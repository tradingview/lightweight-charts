import { lowerBound } from '../helpers/algorithms';
import { ensureDefined } from '../helpers/assertions';
import { getSeriesPlotRowCreator, isSeriesPlotRow } from './get-series-plot-row-creator';
function createEmptyTimePointData(timePoint) {
    return { index: 0, mapping: new Map(), timePoint };
}
function seriesRowsFirstAndLastTime(seriesRows, bh) {
    if (seriesRows === undefined || seriesRows.length === 0) {
        return undefined;
    }
    return {
        firstTime: bh.key(seriesRows[0].time),
        lastTime: bh.key(seriesRows[seriesRows.length - 1].time),
    };
}
function seriesUpdateInfo(seriesRows, prevSeriesRows, bh) {
    const firstAndLastTime = seriesRowsFirstAndLastTime(seriesRows, bh);
    const prevFirstAndLastTime = seriesRowsFirstAndLastTime(prevSeriesRows, bh);
    if (firstAndLastTime !== undefined && prevFirstAndLastTime !== undefined) {
        return {
            lastBarUpdatedOrNewBarsAddedToTheRight: firstAndLastTime.lastTime >= prevFirstAndLastTime.lastTime &&
                firstAndLastTime.firstTime >= prevFirstAndLastTime.firstTime,
        };
    }
    return undefined;
}
function timeScalePointTime(mergedPointData) {
    let result;
    mergedPointData.forEach((v) => {
        if (result === undefined) {
            result = v.originalTime;
        }
    });
    return ensureDefined(result);
}
function saveOriginalTime(data) {
    if (data.originalTime === undefined) {
        data.originalTime = data.time;
    }
}
export class DataLayer {
    constructor(horzScaleBehavior) {
        // note that _pointDataByTimePoint and _seriesRowsBySeries shares THE SAME objects in their values between each other
        // it's just different kind of maps to make usages/perf better
        this._pointDataByTimePoint = new Map();
        this._seriesRowsBySeries = new Map();
        this._seriesLastTimePoint = new Map();
        // this is kind of "dest" values (in opposite to "source" ones) - we don't need to modify it manually, the only by calling _updateTimeScalePoints or updateSeriesData methods
        this._sortedTimePoints = [];
        this._horzScaleBehavior = horzScaleBehavior;
    }
    destroy() {
        this._pointDataByTimePoint.clear();
        this._seriesRowsBySeries.clear();
        this._seriesLastTimePoint.clear();
        this._sortedTimePoints = [];
    }
    setSeriesData(series, data) {
        let needCleanupPoints = this._pointDataByTimePoint.size !== 0;
        let isTimeScaleAffected = false;
        // save previous series rows data before it's replaced inside this._setRowsToSeries
        const prevSeriesRows = this._seriesRowsBySeries.get(series);
        if (prevSeriesRows !== undefined) {
            if (this._seriesRowsBySeries.size === 1) {
                needCleanupPoints = false;
                isTimeScaleAffected = true;
                // perf optimization - if there is only 1 series, then we can just clear and fill everything from scratch
                this._pointDataByTimePoint.clear();
            }
            else {
                // perf optimization - actually we have to use this._pointDataByTimePoint for going through here
                // but as soon as this._sortedTimePoints is just a different form of _pointDataByTimePoint we can use it as well
                for (const point of this._sortedTimePoints) {
                    if (point.pointData.mapping.delete(series)) {
                        isTimeScaleAffected = true;
                    }
                }
            }
        }
        let seriesRows = [];
        if (data.length !== 0) {
            const originalTimes = data.map((d) => d.time);
            const timeConverter = this._horzScaleBehavior.createConverterToInternalObj(data);
            const createPlotRow = getSeriesPlotRowCreator(series.seriesType());
            const dataToPlotRow = series.customSeriesPlotValuesBuilder();
            const customWhitespaceChecker = series.customSeriesWhitespaceCheck();
            seriesRows = data.map((item, index) => {
                const time = timeConverter(item.time);
                const horzItemKey = this._horzScaleBehavior.key(time);
                let timePointData = this._pointDataByTimePoint.get(horzItemKey);
                if (timePointData === undefined) {
                    // the indexes will be sync later
                    timePointData = createEmptyTimePointData(time);
                    this._pointDataByTimePoint.set(horzItemKey, timePointData);
                    isTimeScaleAffected = true;
                }
                const row = createPlotRow(time, timePointData.index, item, originalTimes[index], dataToPlotRow, customWhitespaceChecker);
                timePointData.mapping.set(series, row);
                return row;
            });
        }
        if (needCleanupPoints) {
            // we deleted the old data from mapping and added the new ones
            // so there might be empty points now, let's remove them first
            this._cleanupPointsData();
        }
        this._setRowsToSeries(series, seriesRows);
        let firstChangedPointIndex = -1;
        if (isTimeScaleAffected) {
            // then generate the time scale points
            // timeWeight will be updates in _updateTimeScalePoints later
            const newTimeScalePoints = [];
            this._pointDataByTimePoint.forEach((pointData) => {
                newTimeScalePoints.push({
                    timeWeight: 0,
                    time: pointData.timePoint,
                    pointData,
                    originalTime: timeScalePointTime(pointData.mapping),
                });
            });
            newTimeScalePoints.sort((t1, t2) => this._horzScaleBehavior.key(t1.time) - this._horzScaleBehavior.key(t2.time));
            firstChangedPointIndex = this._replaceTimeScalePoints(newTimeScalePoints);
        }
        return this._getUpdateResponse(series, firstChangedPointIndex, seriesUpdateInfo(this._seriesRowsBySeries.get(series), prevSeriesRows, this._horzScaleBehavior));
    }
    removeSeries(series) {
        return this.setSeriesData(series, []);
    }
    updateSeriesData(series, data) {
        const extendedData = data;
        saveOriginalTime(extendedData);
        // convertStringToBusinessDay(data);
        this._horzScaleBehavior.preprocessData(data);
        const timeConverter = this._horzScaleBehavior.createConverterToInternalObj([data]);
        const time = timeConverter(data.time);
        const lastSeriesTime = this._seriesLastTimePoint.get(series);
        if (lastSeriesTime !== undefined && this._horzScaleBehavior.key(time) < this._horzScaleBehavior.key(lastSeriesTime)) {
            throw new Error(`Cannot update oldest data, last time=${lastSeriesTime}, new time=${time}`);
        }
        let pointDataAtTime = this._pointDataByTimePoint.get(this._horzScaleBehavior.key(time));
        // if no point data found for the new data item
        // that means that we need to update scale
        const affectsTimeScale = pointDataAtTime === undefined;
        if (pointDataAtTime === undefined) {
            // the indexes will be sync later
            pointDataAtTime = createEmptyTimePointData(time);
            this._pointDataByTimePoint.set(this._horzScaleBehavior.key(time), pointDataAtTime);
        }
        const createPlotRow = getSeriesPlotRowCreator(series.seriesType());
        const dataToPlotRow = series.customSeriesPlotValuesBuilder();
        const customWhitespaceChecker = series.customSeriesWhitespaceCheck();
        const plotRow = createPlotRow(time, pointDataAtTime.index, data, extendedData.originalTime, dataToPlotRow, customWhitespaceChecker);
        pointDataAtTime.mapping.set(series, plotRow);
        this._updateLastSeriesRow(series, plotRow);
        const info = { lastBarUpdatedOrNewBarsAddedToTheRight: isSeriesPlotRow(plotRow) };
        // if point already exist on the time scale - we don't need to make a full update and just make an incremental one
        if (!affectsTimeScale) {
            return this._getUpdateResponse(series, -1, info);
        }
        const newPoint = {
            timeWeight: 0,
            time: pointDataAtTime.timePoint,
            pointData: pointDataAtTime,
            originalTime: timeScalePointTime(pointDataAtTime.mapping),
        };
        const insertIndex = lowerBound(this._sortedTimePoints, this._horzScaleBehavior.key(newPoint.time), (a, b) => this._horzScaleBehavior.key(a.time) < b);
        // yes, I know that this array is readonly and this change is intended to make it performative
        // we marked _sortedTimePoints array as readonly to avoid modifying this array anywhere else
        // but this place is exceptional case due performance reasons, sorry
        this._sortedTimePoints.splice(insertIndex, 0, newPoint);
        for (let index = insertIndex; index < this._sortedTimePoints.length; ++index) {
            assignIndexToPointData(this._sortedTimePoints[index].pointData, index);
        }
        this._horzScaleBehavior.fillWeightsForPoints(this._sortedTimePoints, insertIndex);
        return this._getUpdateResponse(series, insertIndex, info);
    }
    _updateLastSeriesRow(series, plotRow) {
        let seriesData = this._seriesRowsBySeries.get(series);
        if (seriesData === undefined) {
            seriesData = [];
            this._seriesRowsBySeries.set(series, seriesData);
        }
        const lastSeriesRow = seriesData.length !== 0 ? seriesData[seriesData.length - 1] : null;
        if (lastSeriesRow === null || this._horzScaleBehavior.key(plotRow.time) > this._horzScaleBehavior.key(lastSeriesRow.time)) {
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
        this._seriesLastTimePoint.set(series, plotRow.time);
    }
    _setRowsToSeries(series, seriesRows) {
        if (seriesRows.length !== 0) {
            this._seriesRowsBySeries.set(series, seriesRows.filter(isSeriesPlotRow));
            this._seriesLastTimePoint.set(series, seriesRows[seriesRows.length - 1].time);
        }
        else {
            this._seriesRowsBySeries.delete(series);
            this._seriesLastTimePoint.delete(series);
        }
    }
    _cleanupPointsData() {
        // let's treat all current points as "potentially removed"
        // we could create an array with actually potentially removed points
        // but most likely this array will be similar to _sortedTimePoints so let's avoid using additional memory
        // note that we can use _sortedTimePoints here since a point might be removed only it was here previously
        for (const point of this._sortedTimePoints) {
            if (point.pointData.mapping.size === 0) {
                this._pointDataByTimePoint.delete(this._horzScaleBehavior.key(point.time));
            }
        }
    }
    /**
     * Sets new time scale and make indexes valid for all series
     *
     * @returns The index of the first changed point or `-1` if there is no change.
     */
    _replaceTimeScalePoints(newTimePoints) {
        let firstChangedPointIndex = -1;
        // search the first different point and "syncing" time weight by the way
        for (let index = 0; index < this._sortedTimePoints.length && index < newTimePoints.length; ++index) {
            const oldPoint = this._sortedTimePoints[index];
            const newPoint = newTimePoints[index];
            if (this._horzScaleBehavior.key(oldPoint.time) !== this._horzScaleBehavior.key(newPoint.time)) {
                firstChangedPointIndex = index;
                break;
            }
            // re-assign point's time weight for points if time is the same (and all prior times was the same)
            newPoint.timeWeight = oldPoint.timeWeight;
            assignIndexToPointData(newPoint.pointData, index);
        }
        if (firstChangedPointIndex === -1 && this._sortedTimePoints.length !== newTimePoints.length) {
            // the common part of the prev and the new points are the same
            // so the first changed point is the next after the common part
            firstChangedPointIndex = Math.min(this._sortedTimePoints.length, newTimePoints.length);
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
        this._horzScaleBehavior.fillWeightsForPoints(newTimePoints, firstChangedPointIndex);
        this._sortedTimePoints = newTimePoints;
        return firstChangedPointIndex;
    }
    _getBaseIndex() {
        if (this._seriesRowsBySeries.size === 0) {
            // if we have no data then 'reset' the base index to null
            return null;
        }
        let baseIndex = 0;
        this._seriesRowsBySeries.forEach((data) => {
            if (data.length !== 0) {
                baseIndex = Math.max(baseIndex, data[data.length - 1].index);
            }
        });
        return baseIndex;
    }
    _getUpdateResponse(updatedSeries, firstChangedPointIndex, info) {
        const dataUpdateResponse = {
            series: new Map(),
            timeScale: {
                baseIndex: this._getBaseIndex(),
            },
        };
        if (firstChangedPointIndex !== -1) {
            // TODO: it's possible to make perf improvements by checking what series has data after firstChangedPointIndex
            // but let's skip for now
            this._seriesRowsBySeries.forEach((data, s) => {
                dataUpdateResponse.series.set(s, {
                    data,
                    info: s === updatedSeries ? info : undefined,
                });
            });
            // if the series data was set to [] it will have already been removed from _seriesRowBySeries
            // meaning the forEach above won't add the series to the data update response
            // so we handle that case here
            if (!this._seriesRowsBySeries.has(updatedSeries)) {
                dataUpdateResponse.series.set(updatedSeries, { data: [], info });
            }
            dataUpdateResponse.timeScale.points = this._sortedTimePoints;
            dataUpdateResponse.timeScale.firstChangedPointIndex = firstChangedPointIndex;
        }
        else {
            const seriesData = this._seriesRowsBySeries.get(updatedSeries);
            // if no seriesData found that means that we just removed the series
            dataUpdateResponse.series.set(updatedSeries, { data: seriesData || [], info });
        }
        return dataUpdateResponse;
    }
}
function assignIndexToPointData(pointData, index) {
    // first, nevertheless update index of point data ("make it valid")
    pointData.index = index;
    // and then we need to sync indexes for all series
    pointData.mapping.forEach((seriesRow) => {
        seriesRow.index = index;
    });
}
