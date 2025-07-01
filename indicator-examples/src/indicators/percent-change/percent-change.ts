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
	calculatePercentChangeIndicatorValues,
	PercentChangeCalculationOptions,
	SupportedData,
} from './percent-change-calculation';

/**
 * Apply (add) a Percent Change indicator to the specified series.
 * The data from series will be automatically read and used as the
 * source data for the indicator calculation (and will be updated when
 * the data of the series is updated or changed)
 *
 * @param series - Source series
 * @param options - Calculation options for the percent change
 * @returns A Line series (ISeriesApi) for the attached indicator
 *
 * @example
 * const pcSeries = applyPercentChangeIndicator(mainSeries, {
 * 	offset: 2,
 * });
 * pcSeries.applyOptions({
 * 	color: 'orange',
 * 	lineWidth: 2,
 * 	lineStyle: LineStyle.Dotted,
 * });
 */
export function applyPercentChangeIndicator<T extends SeriesType>(
	series: ISeriesApi<T>,
	options: PercentChangeCalculationOptions
): ISeriesApi<'Line'> {
	class PercentChangePrimitive implements ISeriesPrimitive {
		private _baseSeries: ISeriesApi<SeriesType> | null = null;
		private _indicatorSeries: ISeriesApi<'Line'> | null = null;
		private _chart: IChartApi | null = null;
		private _options: PercentChangeCalculationOptions | null = null;

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
			options: Partial<PercentChangeCalculationOptions>
		): void {
			this._options = {
				...(this._options || {}),
				...(options as PercentChangeCalculationOptions),
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
			const indicatorValues = calculatePercentChangeIndicatorValues(
				seriesData,
				this._options || options
			);
			this._indicatorSeries.setData(indicatorValues);
		};
	}
	const primitive = new PercentChangePrimitive();
	series.attachPrimitive(primitive);
	return primitive.indicatorSeries();
}
