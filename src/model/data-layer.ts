/// <reference types="_build-time-constants" />

import { lowerbound } from '../helpers/algorithms';
import { ensureDefined } from '../helpers/assertions';
import { Mutable } from '../helpers/mutable';

import { SeriesDataItemTypeMap } from './data-consumer';
import { getSeriesPlotRowCreator, isSeriesPlotRow, WhitespacePlotRow } from './get-series-plot-row-creator';
import { IHorzScaleBehavior, InternalHorzScaleItem, InternalHorzScaleItemKey } from './ihorz-scale-behavior';
import { Series, SeriesUpdateInfo } from './series';
import { SeriesPlotRow } from './series-data';
import { SeriesType } from './series-options';
import {
	TickMarkWeightValue,
	TimePointIndex,
	TimeScalePoint,
} from './time-data';

export type TimedData<HorzScaleItem> = Pick<SeriesDataItemTypeMap<HorzScaleItem>[SeriesType], 'time'>;

export interface TimeScaleChanges<HorzScaleItem> {
	/**
	 * An index of the first changed time scale point by any type of change (time, weight, etc)
	 */
	firstChangedPointIndex?: TimePointIndex;

	/**
	 * An array of the new time scale points
	 */
	points?: readonly TimeScalePoint<HorzScaleItem>[];

	/**
	 * In terms of time scale "base index" means the latest time scale point with data (there might be whitespaces)
	 */
	baseIndex: TimePointIndex | null;
}

export interface SeriesChanges<HorzScaleItem> {
	/**
	 * Data to be merged into series' plot list
	 */
	data: readonly SeriesPlotRow<SeriesType, HorzScaleItem>[];
	/**
	 * Additional info about this change
	 */
	info?: SeriesUpdateInfo;
}

export interface DataUpdateResponse<HorzScaleItem> {
	/**
	 * Contains updates for all _changed_ series (if series data doesn't changed then it will not be here)
	 */
	series: Map<Series<SeriesType, HorzScaleItem>, SeriesChanges<HorzScaleItem>>;

	/**
	 * Contains optional time scale points
	 */
	timeScale: TimeScaleChanges<HorzScaleItem>;
}

interface TimePointData<HorzScaleItem> {
	index: TimePointIndex;
	timePoint: InternalHorzScaleItem;

	// actually the type of the value should be related to the series' type (generic type)
	// here, in data layer all data for us is "mutable" by default, but to the chart we provide "readonly" data, to avoid modifying it
	mapping: Map<Series<SeriesType, HorzScaleItem>, Mutable<SeriesPlotRow<SeriesType, HorzScaleItem> | WhitespacePlotRow<HorzScaleItem>>>;
}

export interface InternalTimeScalePoint<HorzScaleItem> extends Mutable<TimeScalePoint<HorzScaleItem>> {
	pointData: TimePointData<HorzScaleItem>;
}

function createEmptyTimePointData<HorzScaleItem>(timePoint: InternalHorzScaleItem): TimePointData<HorzScaleItem> {
	return { index: 0 as TimePointIndex, mapping: new Map(), timePoint };
}

interface SeriesRowsFirstAndLastTime {
	firstTime: InternalHorzScaleItemKey;
	lastTime: InternalHorzScaleItemKey;
}

function seriesRowsFirsAndLastTime<TSeriesType extends SeriesType, HorzScaleItem>(seriesRows: SeriesPlotRow<TSeriesType, HorzScaleItem>[] | undefined, bh: IHorzScaleBehavior<HorzScaleItem>): SeriesRowsFirstAndLastTime | undefined {
	if (seriesRows === undefined || seriesRows.length === 0) {
		return undefined;
	}

	return {
		firstTime: bh.key(seriesRows[0].time),
		lastTime: bh.key(seriesRows[seriesRows.length - 1].time),
	};
}

function seriesUpdateInfo<TSeriesType extends SeriesType, HorzScaleItem>(seriesRows: SeriesPlotRow<TSeriesType, HorzScaleItem>[] | undefined, prevSeriesRows: SeriesPlotRow<TSeriesType, HorzScaleItem>[] | undefined, bh: IHorzScaleBehavior<HorzScaleItem>): SeriesUpdateInfo | undefined {
	const firstAndLastTime = seriesRowsFirsAndLastTime(seriesRows, bh);
	const prevFirstAndLastTime = seriesRowsFirsAndLastTime(prevSeriesRows, bh);
	if (firstAndLastTime !== undefined && prevFirstAndLastTime !== undefined) {
		return {
			lastBarUpdatedOrNewBarsAddedToTheRight:
				firstAndLastTime.lastTime >= prevFirstAndLastTime.lastTime &&
				firstAndLastTime.firstTime >= prevFirstAndLastTime.firstTime,
		};
	}

	return undefined;
}

function timeScalePointTime<TSeriesType extends SeriesType, HorzScaleItem>(mergedPointData: Map<Series<TSeriesType, HorzScaleItem>, SeriesPlotRow<TSeriesType, HorzScaleItem> | WhitespacePlotRow<HorzScaleItem>>): HorzScaleItem {
	let result: HorzScaleItem | undefined;
	mergedPointData.forEach((v: SeriesPlotRow<TSeriesType, HorzScaleItem> | WhitespacePlotRow<HorzScaleItem>) => {
		if (result === undefined) {
			result = v.originalTime;
		}
	});

	return ensureDefined(result);
}

function saveOriginalTime<TSeriesType extends SeriesType, HorzScaleItem>(data: SeriesDataItemWithOriginalTime<TSeriesType, HorzScaleItem>): void {
	if (data.originalTime === undefined) {
		data.originalTime = data.time;
	}
}

type SeriesDataItemWithOriginalTime<TSeriesType extends SeriesType, HorzScaleItem> = SeriesDataItemTypeMap<HorzScaleItem>[TSeriesType] & {
	originalTime: HorzScaleItem;
};

export class DataLayer<HorzScaleItem> {
	// note that _pointDataByTimePoint and _seriesRowsBySeries shares THE SAME objects in their values between each other
	// it's just different kind of maps to make usages/perf better
	private _pointDataByTimePoint: Map<InternalHorzScaleItemKey, TimePointData<HorzScaleItem>> = new Map();
	private _seriesRowsBySeries: Map<Series<SeriesType, HorzScaleItem>, SeriesPlotRow<SeriesType, HorzScaleItem>[]> = new Map();
	private _seriesLastTimePoint: Map<Series<SeriesType, HorzScaleItem>, InternalHorzScaleItem> = new Map();

	// this is kind of "dest" values (in opposite to "source" ones) - we don't need to modify it manually, the only by calling _updateTimeScalePoints or updateSeriesData methods
	private _sortedTimePoints: readonly InternalTimeScalePoint<HorzScaleItem>[] = [];

	private readonly _horzScaleBehavior: IHorzScaleBehavior<HorzScaleItem>;

	public constructor(horzScaleBehavior: IHorzScaleBehavior<HorzScaleItem>) {
		this._horzScaleBehavior = horzScaleBehavior;
	}

	public destroy(): void {
		this._pointDataByTimePoint.clear();
		this._seriesRowsBySeries.clear();
		this._seriesLastTimePoint.clear();
		this._sortedTimePoints = [];
	}

	public setSeriesData<TSeriesType extends SeriesType>(series: Series<TSeriesType, HorzScaleItem>, data: SeriesDataItemTypeMap<HorzScaleItem>[TSeriesType][]): DataUpdateResponse<HorzScaleItem> {
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
			} else {
				// perf optimization - actually we have to use this._pointDataByTimePoint for going through here
				// but as soon as this._sortedTimePoints is just a different form of _pointDataByTimePoint we can use it as well
				for (const point of this._sortedTimePoints) {
					if (point.pointData.mapping.delete(series)) {
						isTimeScaleAffected = true;
					}
				}
			}
		}

		let seriesRows: (SeriesPlotRow<TSeriesType, HorzScaleItem> | WhitespacePlotRow<HorzScaleItem>)[] = [];

		if (data.length !== 0) {
			const extendedData = data as SeriesDataItemWithOriginalTime<TSeriesType, HorzScaleItem>[];
			extendedData.forEach((i: SeriesDataItemWithOriginalTime<TSeriesType, HorzScaleItem>) => saveOriginalTime(i));

			// convertStringsToBusinessDays(data);
			this._horzScaleBehavior.preprocessData(data);

			// const timeConverter = ensureNotNull(selectTimeConverter(data));

			const timeConverter = this._horzScaleBehavior.createConverterToInternalObj(data);

			const createPlotRow = getSeriesPlotRowCreator<TSeriesType, HorzScaleItem>(series.seriesType());

			seriesRows = extendedData.map((item: SeriesDataItemWithOriginalTime<TSeriesType, HorzScaleItem>) => {
				const time = timeConverter(item.time);

				const horzItemKey = this._horzScaleBehavior.key(time);

				let timePointData = this._pointDataByTimePoint.get(horzItemKey);
				if (timePointData === undefined) {
					// the indexes will be sync later
					timePointData = createEmptyTimePointData(time);
					this._pointDataByTimePoint.set(horzItemKey, timePointData);
					isTimeScaleAffected = true;
				}

				const row = createPlotRow(time, timePointData.index, item, item.originalTime);
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
			const newTimeScalePoints: InternalTimeScalePoint<HorzScaleItem>[] = [];
			this._pointDataByTimePoint.forEach((pointData: TimePointData<HorzScaleItem>) => {
				newTimeScalePoints.push({
					timeWeight: 0 as TickMarkWeightValue,
					time: pointData.timePoint,
					pointData,
					originalTime: timeScalePointTime(pointData.mapping),
				});
			});

			newTimeScalePoints.sort((t1: InternalTimeScalePoint<HorzScaleItem>, t2: InternalTimeScalePoint<HorzScaleItem>) => this._horzScaleBehavior.key(t1.time) - this._horzScaleBehavior.key(t2.time));

			firstChangedPointIndex = this._replaceTimeScalePoints(newTimeScalePoints);
		}

		return this._getUpdateResponse(
			series,
			firstChangedPointIndex,
			seriesUpdateInfo(this._seriesRowsBySeries.get(series), prevSeriesRows, this._horzScaleBehavior)
		);
	}

	public removeSeries(series: Series<SeriesType, HorzScaleItem>): DataUpdateResponse<HorzScaleItem> {
		return this.setSeriesData(series, []);
	}

	public updateSeriesData<TSeriesType extends SeriesType>(series: Series<TSeriesType, HorzScaleItem>, data: SeriesDataItemTypeMap<HorzScaleItem>[TSeriesType]): DataUpdateResponse<HorzScaleItem> {
		const extendedData = data as SeriesDataItemWithOriginalTime<TSeriesType, HorzScaleItem>;
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

		const createPlotRow = getSeriesPlotRowCreator<SeriesType, HorzScaleItem>(series.seriesType());
		const plotRow = createPlotRow(time, pointDataAtTime.index, data, extendedData.originalTime);
		pointDataAtTime.mapping.set(series, plotRow);

		this._updateLastSeriesRow(series, plotRow);

		const info: SeriesUpdateInfo = { lastBarUpdatedOrNewBarsAddedToTheRight: isSeriesPlotRow(plotRow) };

		// if point already exist on the time scale - we don't need to make a full update and just make an incremental one
		if (!affectsTimeScale) {
			return this._getUpdateResponse(series, -1, info);
		}

		const newPoint: InternalTimeScalePoint<HorzScaleItem> = {
			timeWeight: 0 as TickMarkWeightValue,
			time: pointDataAtTime.timePoint,
			pointData: pointDataAtTime,
			originalTime: timeScalePointTime(pointDataAtTime.mapping),
		};

		const insertIndex = lowerbound(this._sortedTimePoints, this._horzScaleBehavior.key(newPoint.time), (a: InternalTimeScalePoint<HorzScaleItem>, b: number) => this._horzScaleBehavior.key(a.time) < b);

		// yes, I know that this array is readonly and this change is intended to make it performative
		// we marked _sortedTimePoints array as readonly to avoid modifying this array anywhere else
		// but this place is exceptional case due performance reasons, sorry
		(this._sortedTimePoints as InternalTimeScalePoint<HorzScaleItem>[]).splice(insertIndex, 0, newPoint);

		for (let index = insertIndex; index < this._sortedTimePoints.length; ++index) {
			assignIndexToPointData(this._sortedTimePoints[index].pointData, index as TimePointIndex);
		}

		this._horzScaleBehavior.fillWeightsForPoints(this._sortedTimePoints, insertIndex);

		return this._getUpdateResponse(series, insertIndex, info);
	}

	private _updateLastSeriesRow(series: Series<SeriesType, HorzScaleItem>, plotRow: SeriesPlotRow<SeriesType, HorzScaleItem> | WhitespacePlotRow<HorzScaleItem>): void {
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
		} else {
			if (isSeriesPlotRow(plotRow)) {
				seriesData[seriesData.length - 1] = plotRow;
			} else {
				seriesData.splice(-1, 1);
			}
		}

		this._seriesLastTimePoint.set(series, plotRow.time);
	}

	private _setRowsToSeries(series: Series<SeriesType, HorzScaleItem>, seriesRows: (SeriesPlotRow<SeriesType, HorzScaleItem> | WhitespacePlotRow<HorzScaleItem>)[]): void {
		if (seriesRows.length !== 0) {
			this._seriesRowsBySeries.set(series, seriesRows.filter(isSeriesPlotRow));
			this._seriesLastTimePoint.set(series, seriesRows[seriesRows.length - 1].time);
		} else {
			this._seriesRowsBySeries.delete(series);
			this._seriesLastTimePoint.delete(series);
		}
	}

	private _cleanupPointsData(): void {
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
	private _replaceTimeScalePoints(newTimePoints: InternalTimeScalePoint<HorzScaleItem>[]): number {
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

			assignIndexToPointData(newPoint.pointData, index as TimePointIndex);
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
			assignIndexToPointData(newTimePoints[index].pointData, index as TimePointIndex);
		}

		// re-fill time weights for point after the first changed one
		this._horzScaleBehavior.fillWeightsForPoints(newTimePoints, firstChangedPointIndex);

		this._sortedTimePoints = newTimePoints;

		return firstChangedPointIndex;
	}

	private _getBaseIndex(): TimePointIndex | null {
		if (this._seriesRowsBySeries.size === 0) {
			// if we have no data then 'reset' the base index to null
			return null;
		}

		let baseIndex = 0 as TimePointIndex;

		this._seriesRowsBySeries.forEach((data: SeriesPlotRow<SeriesType, HorzScaleItem>[]) => {
			if (data.length !== 0) {
				baseIndex = Math.max(baseIndex, data[data.length - 1].index) as TimePointIndex;
			}
		});

		return baseIndex;
	}

	private _getUpdateResponse(updatedSeries: Series<SeriesType, HorzScaleItem>, firstChangedPointIndex: number, info?: SeriesUpdateInfo): DataUpdateResponse<HorzScaleItem> {
		const dataUpdateResponse: DataUpdateResponse<HorzScaleItem> = {
			series: new Map(),
			timeScale: {
				baseIndex: this._getBaseIndex(),
			},
		};

		if (firstChangedPointIndex !== -1) {
			// TODO: it's possible to make perf improvements by checking what series has data after firstChangedPointIndex
			// but let's skip for now
			this._seriesRowsBySeries.forEach((data: SeriesPlotRow<SeriesType, HorzScaleItem>[], s: Series<SeriesType, HorzScaleItem>) => {
				dataUpdateResponse.series.set(
					s,
					{
						data,
						info: s === updatedSeries ? info : undefined,
					}
				);
			});

			// if the series data was set to [] it will have already been removed from _seriesRowBySeries
			// meaning the forEach above won't add the series to the data update response
			// so we handle that case here
			if (!this._seriesRowsBySeries.has(updatedSeries)) {
				dataUpdateResponse.series.set(updatedSeries, { data: [], info });
			}

			dataUpdateResponse.timeScale.points = this._sortedTimePoints;
			dataUpdateResponse.timeScale.firstChangedPointIndex = firstChangedPointIndex as TimePointIndex;
		} else {
			const seriesData = this._seriesRowsBySeries.get(updatedSeries);
			// if no seriesData found that means that we just removed the series
			dataUpdateResponse.series.set(updatedSeries, { data: seriesData || [], info });
		}

		return dataUpdateResponse;
	}
}

function assignIndexToPointData<HorzScaleItem>(pointData: TimePointData<HorzScaleItem>, index: TimePointIndex): void {
	// first, nevertheless update index of point data ("make it valid")
	pointData.index = index;

	// and then we need to sync indexes for all series
	pointData.mapping.forEach((seriesRow: Mutable<SeriesPlotRow<SeriesType, HorzScaleItem> | WhitespacePlotRow<HorzScaleItem>>) => {
		seriesRow.index = index;
	});
}
