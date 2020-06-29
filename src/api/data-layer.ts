/// <reference types="_build-time-constants" />

import { ensureDefined, ensureNotNull } from '../helpers/assertions';
import { isString } from '../helpers/strict-type-checks';

import { Series } from '../model/series';
import { SeriesPlotRow } from '../model/series-data';
import { SeriesType } from '../model/series-options';
import { BusinessDay, TimePoint, TimePointIndex, TimeScalePoint, UTCTimestamp } from '../model/time-data';

import {
	isBusinessDay,
	isUTCTimestamp,
	SeriesDataItemTypeMap,
	Time,
} from './data-consumer';
import { getSeriesPlotRowCreator, isSeriesPlotRow, WhitespacePlotRow } from './get-series-plot-row-creator';
import { fillWeightsForPoints } from './time-scale-point-weight-generator';

type TimedData = Pick<SeriesDataItemTypeMap[SeriesType], 'time'>;
type TimeConverter = (time: Time) => TimePoint;

function businessDayConverter(time: Time): TimePoint {
	if (!isBusinessDay(time)) {
		throw new Error('time must be of type BusinessDay');
	}

	const date = new Date(Date.UTC(time.year, time.month - 1, time.day, 0, 0, 0, 0));

	return {
		timestamp: Math.round(date.getTime() / 1000) as UTCTimestamp,
		businessDay: time,
	};
}

function timestampConverter(time: Time): TimePoint {
	if (!isUTCTimestamp(time)) {
		throw new Error('time must be of type isUTCTimestamp');
	}
	return {
		timestamp: time,
	};
}

function selectTimeConverter(data: TimedData[]): TimeConverter | null {
	if (data.length === 0) {
		return null;
	}
	if (isBusinessDay(data[0].time)) {
		return businessDayConverter;
	}
	return timestampConverter;
}

export function convertTime(time: Time): TimePoint {
	if (isUTCTimestamp(time)) {
		return timestampConverter(time);
	}

	if (!isBusinessDay(time)) {
		return businessDayConverter(stringToBusinessDay(time));
	}

	return businessDayConverter(time);
}

const validDateRegex = /^\d\d\d\d-\d\d-\d\d$/;

export function stringToBusinessDay(value: string): BusinessDay {
	if (process.env.NODE_ENV === 'development') {
		// in some browsers (I look at your Chrome) the Date constructor may accept invalid date string
		// but parses them in "implementation specific" way
		// for example 2019-1-1 isn't the same as 2019-01-01 (for Chrome both are "valid" date strings)
		// see https://bugs.chromium.org/p/chromium/issues/detail?id=968939
		// so, we need to be sure that date has valid format to avoid strange behavior and hours of debugging
		// but let's do this in development build only because of perf
		if (!validDateRegex.test(value)) {
			throw new Error(`Invalid date string=${value}, expected format=yyyy-mm-dd`);
		}
	}

	const d = new Date(value);
	if (isNaN(d.getTime())) {
		throw new Error(`Invalid date string=${value}, expected format=yyyy-mm-dd`);
	}

	return {
		day: d.getUTCDate(),
		month: d.getUTCMonth() + 1,
		year: d.getUTCFullYear(),
	};
}

function convertStringToBusinessDay(value: TimedData): void {
	if (isString(value.time)) {
		value.time = stringToBusinessDay(value.time);
	}
}

function convertStringsToBusinessDays(data: TimedData[]): void {
	return data.forEach(convertStringToBusinessDay);
}

export interface TimeScaleChanges {
	/**
	 * An array of the new time scale points
	 */
	points?: readonly TimeScalePoint[];

	/**
	 * In terms of time scale "base index" means the latest time scale point with data (there might be whitespaces)
	 */
	baseIndex: TimePointIndex;
}

export interface SeriesChanges {
	/**
	 * Data to be merged into series' plot list
	 */
	data: SeriesPlotRow[];

	/**
	 * Whether it needs to clear old data before apply data from this change
	 */
	fullUpdate: boolean;
}

export interface DataUpdateResponse {
	/**
	 * Contains updates for all _changed_ series (if series data doesn't changed then it will not be here)
	 */
	series: Map<Series, SeriesChanges>;

	/**
	 * Contains optional time scale points
	 */
	timeScale: TimeScaleChanges;
}

interface TimePointData {
	index: TimePointIndex;
	timePoint: TimePoint;

	// actually the type of the value should be related to the series' type (generic type)
	// here, in data layer all data for us is "mutable" by default, but to the chart we provide "readonly" data, to avoid modifying it
	mapping: Map<Series, Mutable<SeriesPlotRow | WhitespacePlotRow>>;
}

function createEmptyTimePointData(timePoint: TimePoint): TimePointData {
	return { index: 0 as TimePointIndex, mapping: new Map(), timePoint };
}

export class DataLayer {
	// note that _pointDataByTimePoint and _seriesRowsBySeries shares THE SAME objects in their values between each other
	// it's just different kind of maps to make usages/perf better
	private _pointDataByTimePoint: Map<UTCTimestamp, TimePointData> = new Map();
	private _seriesRowsBySeries: Map<Series, SeriesPlotRow[]> = new Map();
	private _seriesLastTimePoint: Map<Series, TimePoint> = new Map();

	// this is kind of "dest" values (in opposite to "source" ones) - we don't need to modify it manually, the only by calling _syncIndexesAndApplyChanges method
	private _sortedTimePoints: readonly TimeScalePoint[] = [];

	public destroy(): void {
		this._pointDataByTimePoint.clear();
		this._seriesRowsBySeries.clear();
		this._seriesLastTimePoint.clear();
		this._sortedTimePoints = [];
	}

	public setSeriesData<TSeriesType extends SeriesType>(series: Series<TSeriesType>, data: SeriesDataItemTypeMap[TSeriesType][]): DataUpdateResponse {
		// first, remove the series from data mappings if we have any data for that series
		// note we can't use _seriesRowsBySeries here because we might don't have the data there in case of whitespaces
		if (this._seriesLastTimePoint.has(series)) {
			this._pointDataByTimePoint.forEach((pointData: TimePointData) => pointData.mapping.delete(series));
		}

		let seriesRows: (SeriesPlotRow | WhitespacePlotRow)[] = [];

		if (data.length !== 0) {
			convertStringsToBusinessDays(data);

			const timeConverter = ensureNotNull(selectTimeConverter(data));
			const createPlotRow = getSeriesPlotRowCreator(series.seriesType());

			seriesRows = data.map((item: SeriesDataItemTypeMap[TSeriesType]) => {
				const time = timeConverter(item.time);

				let timePointData = this._pointDataByTimePoint.get(time.timestamp);
				if (timePointData === undefined) {
					// the indexes will be sync later
					timePointData = createEmptyTimePointData(time);
					this._pointDataByTimePoint.set(time.timestamp, timePointData);
				}

				const row = createPlotRow(time, timePointData.index, item);
				timePointData.mapping.set(series, row);
				return row;
			});
		}

		// we delete the old data from mapping and add the new ones
		// so there might be empty points, let's remove them first
		this._cleanupPointsData();

		this._setRowsToSeries(series, seriesRows);

		return this._syncIndexesAndApplyChanges(series);
	}

	public removeSeries(series: Series): DataUpdateResponse {
		return this.setSeriesData(series, []);
	}

	public updateSeriesData<TSeriesType extends SeriesType>(series: Series<TSeriesType>, data: SeriesDataItemTypeMap[TSeriesType]): DataUpdateResponse {
		convertStringToBusinessDay(data);

		const time = ensureNotNull(selectTimeConverter([data]))(data.time);

		const lastSeriesTime = this._seriesLastTimePoint.get(series);
		if (lastSeriesTime !== undefined && time.timestamp < lastSeriesTime.timestamp) {
			throw new Error(`Cannot update oldest data, last time=${lastSeriesTime.timestamp}, new time=${time.timestamp}`);
		}

		let pointDataAtTime = this._pointDataByTimePoint.get(time.timestamp);

		// if no point data found for the new data item
		// that means that we need to update scale
		const affectsTimeScale = pointDataAtTime === undefined;

		if (pointDataAtTime === undefined) {
			// the indexes will be sync later
			pointDataAtTime = createEmptyTimePointData(time);
			this._pointDataByTimePoint.set(time.timestamp, pointDataAtTime);
		}

		const createPlotRow = getSeriesPlotRowCreator(series.seriesType());
		const plotRow = createPlotRow(time, pointDataAtTime.index, data);
		pointDataAtTime.mapping.set(series, plotRow);

		const seriesChanges = this._updateLastSeriesRow(series, plotRow);

		// if point already exist on the time scale - we don't need to make a full update and just make an incremental one
		if (!affectsTimeScale) {
			const seriesUpdate = new Map<Series, SeriesChanges>();
			if (seriesChanges !== null) {
				seriesUpdate.set(series, seriesChanges);
			}

			return {
				series: seriesUpdate,
				timeScale: {
					// base index might be updated even if no time scale point is changed
					baseIndex: this._getBaseIndex(),
				},
			};
		}

		// but if we don't have such point on the time scale - we need to generate "full" update (including time scale update)
		return this._syncIndexesAndApplyChanges(series);
	}

	private _updateLastSeriesRow(series: Series, plotRow: SeriesPlotRow | WhitespacePlotRow): SeriesChanges | null {
		let seriesData = this._seriesRowsBySeries.get(series);
		if (seriesData === undefined) {
			seriesData = [];
			this._seriesRowsBySeries.set(series, seriesData);
		}

		const lastSeriesRow = seriesData.length !== 0 ? seriesData[seriesData.length - 1] : null;

		let result: SeriesChanges | null = null;

		if (lastSeriesRow === null || plotRow.time.timestamp > lastSeriesRow.time.timestamp) {
			if (isSeriesPlotRow(plotRow)) {
				seriesData.push(plotRow);

				result = {
					fullUpdate: false,
					data: [plotRow],
				};
			}
		} else {
			if (isSeriesPlotRow(plotRow)) {
				seriesData[seriesData.length - 1] = plotRow;

				result = {
					fullUpdate: false,
					data: [plotRow],
				};
			} else {
				seriesData.splice(-1, 1);

				// we just removed point from series - needs generate full update
				result = {
					fullUpdate: true,
					data: seriesData,
				};
			}
		}

		this._seriesLastTimePoint.set(series, plotRow.time);

		return result;
	}

	private _setRowsToSeries(series: Series, seriesRows: (SeriesPlotRow | WhitespacePlotRow)[]): void {
		if (seriesRows.length !== 0) {
			this._seriesRowsBySeries.set(series, seriesRows.filter(isSeriesPlotRow));
			this._seriesLastTimePoint.set(series, seriesRows[seriesRows.length - 1].time);
		} else {
			this._seriesRowsBySeries.delete(series);
			this._seriesLastTimePoint.delete(series);
		}
	}

	private _cleanupPointsData(): void {
		// create a copy remove from points items without series
		// _pointDataByTimePoint is kind of "inbound" (or "source") value
		// which should be used to update other dest values like _sortedTimePoints
		const newPointsData = new Map<UTCTimestamp, TimePointData>();
		this._pointDataByTimePoint.forEach((pointData: TimePointData, key: UTCTimestamp) => {
			if (pointData.mapping.size > 0) {
				newPointsData.set(key, pointData);
			}
		});

		this._pointDataByTimePoint = newPointsData;
	}

	/**
	 * Sets new time scale and make indexes valid for all series
	 *
	 * @returns An index of the first changed point
	 */
	private _updateTimeScalePoints(newTimePoints: TimeScalePoint[]): number {
		let firstChangedPointIndex = -1;

		// search the first different point and "syncing" time weight by the way
		for (let index = 0; index < this._sortedTimePoints.length && index < newTimePoints.length; ++index) {
			const oldPoint = this._sortedTimePoints[index];
			const newPoint = newTimePoints[index];
			if (oldPoint.time.timestamp !== newPoint.time.timestamp) {
				firstChangedPointIndex = index;
				break;
			}

			// re-assign point's time weight for points if time is the same (and all prior times was the same)
			newPoint.timeWeight = oldPoint.timeWeight;
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
			const pointData = ensureDefined(this._pointDataByTimePoint.get(newTimePoints[index].time.timestamp));

			// first, nevertheless update index of point data ("make it valid")
			pointData.index = index as TimePointIndex;

			// and then we need to sync indexes for all series
			pointData.mapping.forEach((seriesRow: Mutable<SeriesPlotRow | WhitespacePlotRow>) => {
				seriesRow.index = index as TimePointIndex;
			});
		}

		// re-fill time weights for point after the first changed one
		fillWeightsForPoints(newTimePoints, firstChangedPointIndex);

		this._sortedTimePoints = newTimePoints;

		return firstChangedPointIndex;
	}

	private _getBaseIndex(): TimePointIndex {
		let baseIndex = 0 as TimePointIndex;

		this._seriesRowsBySeries.forEach((data: SeriesPlotRow[]) => {
			if (data.length !== 0) {
				baseIndex = Math.max(baseIndex, data[data.length - 1].index) as TimePointIndex;
			}
		});

		return baseIndex;
	}

	/**
	 * Methods syncs indexes (recalculates them applies them to point/series data) between time scale, point data and series point
	 * and returns generated update for applied change.
	 */
	private _syncIndexesAndApplyChanges<TSeriesType extends SeriesType>(series: Series<TSeriesType>): DataUpdateResponse {
		// then generate the time scale points
		// timeWeight will be updates in _updateTimeScalePoints later
		const newTimeScalePoints = Array.from(this._pointDataByTimePoint.values()).map<TimeScalePoint>((d: TimePointData) => ({ timeWeight: 0, time: d.timePoint }));
		newTimeScalePoints.sort((t1: TimeScalePoint, t2: TimeScalePoint) => t1.time.timestamp - t2.time.timestamp);

		const firstChangedPointIndex = this._updateTimeScalePoints(newTimeScalePoints);

		const dataUpdateResponse: DataUpdateResponse = {
			series: new Map(),
			timeScale: {
				baseIndex: this._getBaseIndex(),
			},
		};

		if (firstChangedPointIndex !== -1) {
			// time scale is changed, so we need to make "full" update for every series
			// TODO: it's possible to make perf improvements by checking what series has data after firstChangedPointIndex
			// but let's skip for now
			this._seriesRowsBySeries.forEach((data: SeriesPlotRow[], s: Series) => {
				dataUpdateResponse.series.set(s, { data, fullUpdate: true });
			});

			dataUpdateResponse.timeScale.points = this._sortedTimePoints;
		} else {
			const seriesData = this._seriesRowsBySeries.get(series);
			// if no seriesData found that means that we just removed the series
			dataUpdateResponse.series.set(series, { data: seriesData || [], fullUpdate: true });
		}

		return dataUpdateResponse;
	}
}
