import {
	IChartApi,
	ISeriesApi,
	ISeriesPrimitive,
	LineSeries,
	SeriesAttachedParameter,
	SeriesDataItemTypeMap,
	SeriesOptionsMap,
	SeriesType,
	Time,
	UTCTimestamp,
} from 'lightweight-charts';
import {
	calculateRatioIndicatorValues,
	RatioCalculationOptions,
	SupportedData,
} from './ratio-calculation';

/**
 * Apply (add) a Ratio indicator to the specified series.
 * The data from the two series will be automatically read and used as the
 * source data for the indicator calculation (and will be updated when
 * the data of the series is updated or changed)
 *
 * @param series - Source series
 * @param secondarySeries - Second source series
 * @param options - Calculation options for the ratio
 * @returns A Line series (ISeriesApi) for the attached indicator
 *
 * @example
 * const ratioSeries = applyRatioIndicator(seriesOne, seriesTwo, {
 * 	allowMismatchedDates: false,
 * });
 * ratioSeries.applyOptions({
 * 	color: 'black',
 * 	lineStyle: LineStyle.Dotted,
 * 	lineWidth: 1,
 * });
 */
export function applyRatioIndicator<
	TSeries extends SeriesType,
	TSecondSeries extends SeriesType
>(
	series: ISeriesApi<TSeries>,
	secondarySeries: ISeriesApi<TSecondSeries>,
	options: RatioCalculationOptions<
		SeriesDataItemTypeMap<UTCTimestamp>[TSeries],
		SeriesDataItemTypeMap<UTCTimestamp>[TSecondSeries]
	>
): ISeriesApi<'Line'> {
	class RatioPrimitive implements ISeriesPrimitive {
		private _baseSeries: ISeriesApi<SeriesType> | null = null;
		private _secondarySeries: ISeriesApi<SeriesType> | null = null;
		private _indicatorSeries: ISeriesApi<'Line'> | null = null;
		private _chart: IChartApi | null = null;
		private _options: RatioCalculationOptions<
			SeriesDataItemTypeMap<UTCTimestamp>[TSeries],
			SeriesDataItemTypeMap<UTCTimestamp>[TSecondSeries]
		> | null = null;

		public attached(
			param: SeriesAttachedParameter<Time, keyof SeriesOptionsMap>
		): void {
			const { chart, series } = param;
			this._chart = chart;
			this._baseSeries = series;
			this._secondarySeries = secondarySeries;
			this._indicatorSeries = this._chart.addSeries(LineSeries, {}, 1);
			this._options = options;
			series.subscribeDataChanged(this._updateData);
			this._secondarySeries.subscribeDataChanged(this._updateData);
			this._updateData();
		}

		public detached(): void {
			if (this._baseSeries) {
				this._baseSeries.unsubscribeDataChanged(this._updateData);
			}
			if (this._secondarySeries) {
				this._secondarySeries.unsubscribeDataChanged(this._updateData);
			}
			if (this._indicatorSeries) {
				this._chart?.removeSeries(this._indicatorSeries);
			}
			this._indicatorSeries = null;
		}

		public indicatorSeries(): ISeriesApi<'Line'> {
			if (!this._indicatorSeries) {
				throw new Error('unable to provide indicator series');
			}
			return this._indicatorSeries;
		}

		public applyOptions(
			options: Partial<
				RatioCalculationOptions<
					SeriesDataItemTypeMap<UTCTimestamp>[TSeries],
					SeriesDataItemTypeMap<UTCTimestamp>[TSecondSeries]
				>
			>
		): void {
			this._options = {
				...(this._options || {}),
				...(options as RatioCalculationOptions<
					SeriesDataItemTypeMap<UTCTimestamp>[TSeries],
					SeriesDataItemTypeMap<UTCTimestamp>[TSecondSeries]
				>),
			};
			this._updateData();
		}

		private _updateData = () => {
			if (!this._indicatorSeries) {
				return;
			}
			if (!this._baseSeries || !this._secondarySeries) {
				this._indicatorSeries.setData([]);
				return;
			}
			const seriesData = this._baseSeries.data() as SupportedData[];
			const secondarySeriesData =
				this._secondarySeries.data() as SupportedData[];
			const indicatorValues = calculateRatioIndicatorValues(
				seriesData,
				secondarySeriesData,
				this._options || options
			);
			this._indicatorSeries.setData(indicatorValues);
		};
	}
	const primitive = new RatioPrimitive();
	series.attachPrimitive(primitive);
	return primitive.indicatorSeries();
}
