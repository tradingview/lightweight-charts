import { LineData, WhitespaceData } from '../model/data-consumer';
import { SeriesPartialOptionsMap } from '../model/series-options';
import { SeriesDefinition } from '../model/series/series-def';

import { IChartApiBase } from './ichart-api';
import { ISeriesApi } from './iseries-api';

export type YieldCurveSeriesType = 'Area' | 'Line';

/**
 * The main interface of a single yield curve chart.
 */
export interface IYieldCurveChartApi extends Omit<IChartApiBase<number>, 'addSeries'> {
	/**
	 * Creates a series with specified parameters.
	 *
	 * Note that the Yield Curve chart only supports the Area and Line series types.
	 *
	 * @param definition - A series definition for either AreaSeries or LineSeries.
	 * @param options - Customization parameters of the series being created.
	 * @param paneIndex - An index of the pane where the series should be created.
	 * ```js
	 * const series = chart.addSeries(LineSeries, { lineWidth: 2 });
	 * ```
	 */
	addSeries<T extends YieldCurveSeriesType>(
		definition: SeriesDefinition<T>,
		options?: SeriesPartialOptionsMap[T],
		paneIndex?: number
	): ISeriesApi<T, number, WhitespaceData<number> | LineData<number>>;
}
