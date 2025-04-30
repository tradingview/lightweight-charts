import {
	IChartApi,
	ISeriesApi,
	LineSeries,
	LineSeriesPartialOptions,
	SeriesDataItemTypeMap,
	SeriesType,
	Time,
	UTCTimestamp,
} from 'lightweight-charts';

import { ClosestTimeIndexFinder } from '../../helpers/closest-index';
import { merge } from '../../helpers/merge';
import { IIndicatorConstructor, IIndicatorInstance } from '../indicator';

export interface SpreadIndicatorOptions<TSeriesType extends SeriesType> {
	comparisionData: SeriesDataItemTypeMap<Time>[TSeriesType][];
	source: string;
	mainSource?: string;
	seriesOptions?: LineSeriesPartialOptions;
	allowMismatchedDates?: boolean;
}

type WithTime<V> = V & { time: unknown };

function ensureTimestampData<T, N extends UTCTimestamp>(
	data: WithTime<T>[]
): (Omit<T, 'time'> & { time: N })[] {
	for (const item of data) {
		if (typeof item.time !== 'number') {
			throw new Error('All items must have a numeric "time" property.');
		}
	}
	return data as (Omit<T, 'time'> & { time: N })[];
}

export type ISpreadIndicatorInstance<TSeriesType extends SeriesType> =
	IIndicatorInstance<
		SpreadIndicatorOptions<TSeriesType>,
		ISeriesApi<'Line', Time>
	>;

class SpreadIndicator<TSeriesType extends SeriesType>
	implements ISpreadIndicatorInstance<TSeriesType>
{
	private _series: ISeriesApi<TSeriesType, Time>;
	private _options: SpreadIndicatorOptions<TSeriesType>;
	private _indicatorSeries: ISeriesApi<'Line', Time> | null = null;
	private _chart: IChartApi | null = null;
	private _closestIndex: ClosestTimeIndexFinder<
		SeriesDataItemTypeMap<UTCTimestamp>[TSeriesType]
	> | null = null;

	public constructor(
		series: ISeriesApi<TSeriesType, Time>,
		options: SpreadIndicatorOptions<TSeriesType>
	) {
		this._series = series;
		this._options = options;
	}

	public applyOptions(
		options: Partial<SpreadIndicatorOptions<TSeriesType>>
	): void {
		this._options = merge(this._options, options);
		this._updateData();
	}

	public attach(chart: IChartApi): ISeriesApi<'Line', Time> {
		this._indicatorSeries = chart.addSeries(
			LineSeries,
			this._options.seriesOptions
		) as ISeriesApi<'Line', Time>;
		this._updateData();
		return this._indicatorSeries;
	}

	public detach(): void {
		if (this._chart && this._indicatorSeries) {
			this._chart.removeSeries(this._indicatorSeries as never);
			this._indicatorSeries = null;
		}
	}

	private _updateData() {
		this._closestIndex = new ClosestTimeIndexFinder<
			SeriesDataItemTypeMap<UTCTimestamp>[TSeriesType]
		>(ensureTimestampData(this._options.comparisionData));
		const mainData = ensureTimestampData(this._series.data() as never);
		const indicatorData = mainData.map(mainDataPoint => {
			const comparisionDataIndex = this._closestIndex!.findClosestIndex(
				mainDataPoint.time as UTCTimestamp,
				'left'
			);
			const comparisionData =
				this._options.comparisionData[comparisionDataIndex];
			const mainSourceKey = this._options.mainSource ?? this._options.source;
			const mainHasSource = mainDataPoint[mainSourceKey as never] !== undefined;
			const compareHasSource =
				comparisionData[this._options.source as never] !== undefined;
			if (
				!comparisionData ||
				!mainHasSource ||
				!compareHasSource ||
				(!this._options.allowMismatchedDates &&
					comparisionData.time !== mainDataPoint.time)
			) {
				// whitespace
				return {
					time: mainDataPoint.time,
				};
			}
			const compareValue = comparisionData[
				this._options.source as never
			] as number;
			const mainValue = (
				mainDataPoint as SeriesDataItemTypeMap<Time>[TSeriesType]
			)[mainSourceKey as never] as number;
			return {
				time: mainDataPoint.time,
				value: mainValue - compareValue,
			};
		});
		this._indicatorSeries?.setData(indicatorData);
	}
}

export type ISpreadIndicatorConstructor<TSeriesType extends SeriesType> =
	IIndicatorConstructor<
		SpreadIndicatorOptions<TSeriesType>,
		ISeriesApi<'Line', Time>
	>;

export function createSpreadIndicator<TSeriesType extends SeriesType>(
	series: ISeriesApi<TSeriesType, Time>,
	options: SpreadIndicatorOptions<TSeriesType>
) {
	return new SpreadIndicator(series, options);
}
