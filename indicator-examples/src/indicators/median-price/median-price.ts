import {
	ISeriesApi,
	SeriesType,
	ISeriesPrimitive,
	SeriesAttachedParameter,
	SeriesOptionsMap,
	Time,
	IChartApi,
	LineSeries,
} from 'lightweight-charts';
import {
	calculateMedianPriceIndicatorValues,
	MedianPriceCalculationOptions,
	SupportedData,
} from './median-price-calculation';

/**
 * Apply (add) a Median Price indicator to the specified series.
 * The data from series will be automatically read and used as the
 * source data for the indicator calculation (and will be updated when
 * the data of the series is updated or changed)
 *
 * @param series - Source series
 * @param options - Calculation options for the median price
 * @returns A Line series (ISeriesApi) for the attached indicator
 *
 * @example
 * const mpSeries = applyMedianPriceIndicator(mainSeries, {
 * 	offset: 2,
 * });
 * mpSeries.applyOptions({
 * 	color: 'orange',
 * 	lineWidth: 2,
 * 	lineStyle: LineStyle.Dotted,
 * });
 */
export function applyMedianPriceIndicator<T extends SeriesType>(
	series: ISeriesApi<T>,
	options: MedianPriceCalculationOptions
): ISeriesApi<'Line'> {
	class MedianPricePrimitive implements ISeriesPrimitive {
		private _baseSeries: ISeriesApi<SeriesType> | null = null;
		private _indicatorSeries: ISeriesApi<'Line'> | null = null;
		private _chart: IChartApi | null = null;
		private _options: MedianPriceCalculationOptions | null = null;

		public attached(
			param: SeriesAttachedParameter<Time, keyof SeriesOptionsMap>
		): void {
			const { chart, series } = param;
			this._chart = chart;
			this._baseSeries = series;
			this._indicatorSeries = this._chart.addSeries(LineSeries);
			this._options = options;
			series.subscribeDataChanged(this._updateData);
			this._updateData();
		}

		public detached(): void {
			if (this._baseSeries) {
				this._baseSeries.unsubscribeDataChanged(this._updateData);
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
			options: Partial<MedianPriceCalculationOptions>
		): void {
			this._options = {
				...(this._options || {}),
				...(options as MedianPriceCalculationOptions),
			};
			this._updateData();
		}

		private _updateData = () => {
			if (!this._indicatorSeries) {
				return;
			}
			if (!this._baseSeries) {
				this._indicatorSeries.setData([]);
				return;
			}
			const seriesData = this._baseSeries.data() as SupportedData[];
			const indicatorValues = calculateMedianPriceIndicatorValues(
				seriesData,
				this._options || options
			);
			this._indicatorSeries.setData(indicatorValues);
		};
	}
	const primitive = new MedianPricePrimitive();
	series.attachPrimitive(primitive);
	return primitive.indicatorSeries();
}
