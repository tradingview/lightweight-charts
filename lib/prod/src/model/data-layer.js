/// <reference types="_build-time-constants" />
import { lowerBound } from '../helpers/algorithms';
import { ensureDefined } from '../helpers/assertions';
import { getSeriesPlotRowCreator, isSeriesPlotRow } from './get-series-plot-row-creator';
function createEmptyTimePointData(timePoint) {
    return { _internal_index: 0, _internal_mapping: new Map(), _internal_timePoint: timePoint };
}
function seriesRowsFirstAndLastTime(seriesRows, bh) {
    if (seriesRows === undefined || seriesRows.length === 0) {
        return undefined;
    }
    return {
        _internal_firstTime: bh.key(seriesRows[0]._internal_time),
        _internal_lastTime: bh.key(seriesRows[seriesRows.length - 1]._internal_time),
    };
}
function seriesUpdateInfo(seriesRows, prevSeriesRows, bh) {
    const firstAndLastTime = seriesRowsFirstAndLastTime(seriesRows, bh);
    const prevFirstAndLastTime = seriesRowsFirstAndLastTime(prevSeriesRows, bh);
    if (firstAndLastTime !== undefined && prevFirstAndLastTime !== undefined) {
        return {
            _internal_lastBarUpdatedOrNewBarsAddedToTheRight: firstAndLastTime._internal_lastTime >= prevFirstAndLastTime._internal_lastTime &&
                firstAndLastTime._internal_firstTime >= prevFirstAndLastTime._internal_firstTime,
        };
    }
    return undefined;
}
function timeScalePointTime(mergedPointData) {
    let result;
    mergedPointData.forEach((v) => {
        if (result === undefined) {
            result = v._internal_originalTime;
        }
    });
    return ensureDefined(result);
}
function saveOriginalTime(data) {
    if (data._internal_originalTime === undefined) {
        data._internal_originalTime = data.time;
    }
}
export class DataLayer {
    constructor(horzScaleBehavior) {
        // note that _pointDataByTimePoint and _seriesRowsBySeries shares THE SAME objects in their values between each other
        // it's just different kind of maps to make usages/perf better
        this._private__pointDataByTimePoint = new Map();
        this._private__seriesRowsBySeries = new Map();
        this._private__seriesLastTimePoint = new Map();
        // this is kind of "dest" values (in opposite to "source" ones) - we don't need to modify it manually, the only by calling _updateTimeScalePoints or updateSeriesData methods
        this._private__sortedTimePoints = [];
        this._private__horzScaleBehavior = horzScaleBehavior;
    }
    _internal_destroy() {
        this._private__pointDataByTimePoint.clear();
        this._private__seriesRowsBySeries.clear();
        this._private__seriesLastTimePoint.clear();
        this._private__sortedTimePoints = [];
    }
    _internal_setSeriesData(series, data) {
        let needCleanupPoints = this._private__pointDataByTimePoint.size !== 0;
        let isTimeScaleAffected = false;
        // save previous series rows data before it's replaced inside this._setRowsToSeries
        const prevSeriesRows = this._private__seriesRowsBySeries.get(series);
        if (prevSeriesRows !== undefined) {
            if (this._private__seriesRowsBySeries.size === 1) {
                needCleanupPoints = false;
                isTimeScaleAffected = true;
                // perf optimization - if there is only 1 series, then we can just clear and fill everything from scratch
                this._private__pointDataByTimePoint.clear();
            }
            else {
                // perf optimization - actually we have to use this._pointDataByTimePoint for going through here
                // but as soon as this._sortedTimePoints is just a different form of _pointDataByTimePoint we can use it as well
                for (const point of this._private__sortedTimePoints) {
                    if (point.pointData._internal_mapping.delete(series)) {
                        isTimeScaleAffected = true;
                    }
                }
            }
        }
        let seriesRows = [];
        if (data.length !== 0) {
            const originalTimes = data.map((d) => d.time);
            const timeConverter = this._private__horzScaleBehavior.createConverterToInternalObj(data);
            const createPlotRow = getSeriesPlotRowCreator(series._internal_seriesType());
            const dataToPlotRow = series._internal_customSeriesPlotValuesBuilder();
            const customWhitespaceChecker = series._internal_customSeriesWhitespaceCheck();
            seriesRows = data.map((item, index) => {
                const time = timeConverter(item.time);
                const horzItemKey = this._private__horzScaleBehavior.key(time);
                let timePointData = this._private__pointDataByTimePoint.get(horzItemKey);
                if (timePointData === undefined) {
                    // the indexes will be sync later
                    timePointData = createEmptyTimePointData(time);
                    this._private__pointDataByTimePoint.set(horzItemKey, timePointData);
                    isTimeScaleAffected = true;
                }
                const row = createPlotRow(time, timePointData._internal_index, item, originalTimes[index], dataToPlotRow, customWhitespaceChecker);
                timePointData._internal_mapping.set(series, row);
                return row;
            });
        }
        if (needCleanupPoints) {
            // we deleted the old data from mapping and added the new ones
            // so there might be empty points now, let's remove them first
            this._private__cleanupPointsData();
        }
        this._private__setRowsToSeries(series, seriesRows);
        let firstChangedPointIndex = -1;
        if (isTimeScaleAffected) {
            // then generate the time scale points
            // timeWeight will be updates in _updateTimeScalePoints later
            const newTimeScalePoints = [];
            this._private__pointDataByTimePoint.forEach((pointData) => {
                newTimeScalePoints.push({
                    timeWeight: 0,
                    time: pointData._internal_timePoint,
                    pointData,
                    originalTime: timeScalePointTime(pointData._internal_mapping),
                });
            });
            newTimeScalePoints.sort((t1, t2) => this._private__horzScaleBehavior.key(t1.time) - this._private__horzScaleBehavior.key(t2.time));
            firstChangedPointIndex = this._private__replaceTimeScalePoints(newTimeScalePoints);
        }
        return this._private__getUpdateResponse(series, firstChangedPointIndex, seriesUpdateInfo(this._private__seriesRowsBySeries.get(series), prevSeriesRows, this._private__horzScaleBehavior));
    }
    _internal_removeSeries(series) {
        return this._internal_setSeriesData(series, []);
    }
    _internal_updateSeriesData(series, data) {
        const extendedData = data;
        saveOriginalTime(extendedData);
        // convertStringToBusinessDay(data);
        this._private__horzScaleBehavior.preprocessData(data);
        const timeConverter = this._private__horzScaleBehavior.createConverterToInternalObj([data]);
        const time = timeConverter(data.time);
        const lastSeriesTime = this._private__seriesLastTimePoint.get(series);
        if (lastSeriesTime !== undefined && this._private__horzScaleBehavior.key(time) < this._private__horzScaleBehavior.key(lastSeriesTime)) {
            throw new Error(`Cannot update oldest data, last time=${lastSeriesTime}, new time=${time}`);
        }
        let pointDataAtTime = this._private__pointDataByTimePoint.get(this._private__horzScaleBehavior.key(time));
        // if no point data found for the new data item
        // that means that we need to update scale
        const affectsTimeScale = pointDataAtTime === undefined;
        if (pointDataAtTime === undefined) {
            // the indexes will be sync later
            pointDataAtTime = createEmptyTimePointData(time);
            this._private__pointDataByTimePoint.set(this._private__horzScaleBehavior.key(time), pointDataAtTime);
        }
        const createPlotRow = getSeriesPlotRowCreator(series._internal_seriesType());
        const dataToPlotRow = series._internal_customSeriesPlotValuesBuilder();
        const customWhitespaceChecker = series._internal_customSeriesWhitespaceCheck();
        const plotRow = createPlotRow(time, pointDataAtTime._internal_index, data, extendedData._internal_originalTime, dataToPlotRow, customWhitespaceChecker);
        pointDataAtTime._internal_mapping.set(series, plotRow);
        this._private__updateLastSeriesRow(series, plotRow);
        const info = { _internal_lastBarUpdatedOrNewBarsAddedToTheRight: isSeriesPlotRow(plotRow) };
        // if point already exist on the time scale - we don't need to make a full update and just make an incremental one
        if (!affectsTimeScale) {
            return this._private__getUpdateResponse(series, -1, info);
        }
        const newPoint = {
            timeWeight: 0,
            time: pointDataAtTime._internal_timePoint,
            pointData: pointDataAtTime,
            originalTime: timeScalePointTime(pointDataAtTime._internal_mapping),
        };
        const insertIndex = lowerBound(this._private__sortedTimePoints, this._private__horzScaleBehavior.key(newPoint.time), (a, b) => this._private__horzScaleBehavior.key(a.time) < b);
        // yes, I know that this array is readonly and this change is intended to make it performative
        // we marked _sortedTimePoints array as readonly to avoid modifying this array anywhere else
        // but this place is exceptional case due performance reasons, sorry
        this._private__sortedTimePoints.splice(insertIndex, 0, newPoint);
        for (let index = insertIndex; index < this._private__sortedTimePoints.length; ++index) {
            assignIndexToPointData(this._private__sortedTimePoints[index].pointData, index);
        }
        this._private__horzScaleBehavior.fillWeightsForPoints(this._private__sortedTimePoints, insertIndex);
        return this._private__getUpdateResponse(series, insertIndex, info);
    }
    _private__updateLastSeriesRow(series, plotRow) {
        let seriesData = this._private__seriesRowsBySeries.get(series);
        if (seriesData === undefined) {
            seriesData = [];
            this._private__seriesRowsBySeries.set(series, seriesData);
        }
        const lastSeriesRow = seriesData.length !== 0 ? seriesData[seriesData.length - 1] : null;
        if (lastSeriesRow === null || this._private__horzScaleBehavior.key(plotRow._internal_time) > this._private__horzScaleBehavior.key(lastSeriesRow._internal_time)) {
            if (isSeriesPlotRow(plotRow)) {
                seriesData.push(plotRow);
            }
        }
        else {
            if (isSeriesPlotRow(plotRow)) {
                seriesData[seriesData.length - 1] = plotRow;
            }
            else {
                seriesData.splice(-1, 1);
            }
        }
        this._private__seriesLastTimePoint.set(series, plotRow._internal_time);
    }
    _private__setRowsToSeries(series, seriesRows) {
        if (seriesRows.length !== 0) {
            this._private__seriesRowsBySeries.set(series, seriesRows.filter(isSeriesPlotRow));
            this._private__seriesLastTimePoint.set(series, seriesRows[seriesRows.length - 1]._internal_time);
        }
        else {
            this._private__seriesRowsBySeries.delete(series);
            this._private__seriesLastTimePoint.delete(series);
        }
    }
    _private__cleanupPointsData() {
        // let's treat all current points as "potentially removed"
        // we could create an array with actually potentially removed points
        // but most likely this array will be similar to _sortedTimePoints so let's avoid using additional memory
        // note that we can use _sortedTimePoints here since a point might be removed only it was here previously
        for (const point of this._private__sortedTimePoints) {
            if (point.pointData._internal_mapping.size === 0) {
                this._private__pointDataByTimePoint.delete(this._private__horzScaleBehavior.key(point.time));
            }
        }
    }
    /**
     * Sets new time scale and make indexes valid for all series
     *
     * @returns The index of the first changed point or `-1` if there is no change.
     */
    _private__replaceTimeScalePoints(newTimePoints) {
        let firstChangedPointIndex = -1;
        // search the first different point and "syncing" time weight by the way
        for (let index = 0; index < this._private__sortedTimePoints.length && index < newTimePoints.length; ++index) {
            const oldPoint = this._private__sortedTimePoints[index];
            const newPoint = newTimePoints[index];
            if (this._private__horzScaleBehavior.key(oldPoint.time) !== this._private__horzScaleBehavior.key(newPoint.time)) {
                firstChangedPointIndex = index;
                break;
            }
            // re-assign point's time weight for points if time is the same (and all prior times was the same)
            newPoint.timeWeight = oldPoint.timeWeight;
            assignIndexToPointData(newPoint.pointData, index);
        }
        if (firstChangedPointIndex === -1 && this._private__sortedTimePoints.length !== newTimePoints.length) {
            // the common part of the prev and the new points are the same
            // so the first changed point is the next after the common part
            firstChangedPointIndex = Math.min(this._private__sortedTimePoints.length, newTimePoints.length);
        }
        if (firstChangedPointIndex === -1) {
            // if no time scale changed, then do nothing
            return -1;
        }
        // if time scale points are changed that means that we need to make full update to all series (with clearing points)
        // but first we need to synchronize indexes and re-fill time weights
        for (let index = firstChangedPointIndex; index < newTimePoints.length; ++index) {
            assignIndexToPointData(newTimePoints[index].pointData, index);
        }
        // re-fill time weights for point after the first changed one
        this._private__horzScaleBehavior.fillWeightsForPoints(newTimePoints, firstChangedPointIndex);
        this._private__sortedTimePoints = newTimePoints;
        return firstChangedPointIndex;
    }
    _private__getBaseIndex() {
        if (this._private__seriesRowsBySeries.size === 0) {
            // if we have no data then 'reset' the base index to null
            return null;
        }
        let baseIndex = 0;
        this._private__seriesRowsBySeries.forEach((data) => {
            if (data.length !== 0) {
                baseIndex = Math.max(baseIndex, data[data.length - 1]._internal_index);
            }
        });
        return baseIndex;
    }
    _private__getUpdateResponse(updatedSeries, firstChangedPointIndex, info) {
        const dataUpdateResponse = {
            _internal_series: new Map(),
            _internal_timeScale: {
                _internal_baseIndex: this._private__getBaseIndex(),
            },
        };
        if (firstChangedPointIndex !== -1) {
            // TODO: it's possible to make perf improvements by checking what series has data after firstChangedPointIndex
            // but let's skip for now
            this._private__seriesRowsBySeries.forEach((data, s) => {
                dataUpdateResponse._internal_series.set(s, {
                    _internal_data: data,
                    _internal_info: s === updatedSeries ? info : undefined,
                });
            });
            // if the series data was set to [] it will have already been removed from _seriesRowBySeries
            // meaning the forEach above won't add the series to the data update response
            // so we handle that case here
            if (!this._private__seriesRowsBySeries.has(updatedSeries)) {
                dataUpdateResponse._internal_series.set(updatedSeries, { _internal_data: [], _internal_info: info });
            }
            dataUpdateResponse._internal_timeScale._internal_points = this._private__sortedTimePoints;
            dataUpdateResponse._internal_timeScale._internal_firstChangedPointIndex = firstChangedPointIndex;
        }
        else {
            const seriesData = this._private__seriesRowsBySeries.get(updatedSeries);
            // if no seriesData found that means that we just removed the series
            dataUpdateResponse._internal_series.set(updatedSeries, { _internal_data: seriesData || [], _internal_info: info });
        }
        return dataUpdateResponse;
    }
}
function assignIndexToPointData(pointData, index) {
    // first, nevertheless update index of point data ("make it valid")
    pointData._internal_index = index;
    // and then we need to sync indexes for all series
    pointData._internal_mapping.forEach((seriesRow) => {
        seriesRow._internal_index = index;
    });
}
