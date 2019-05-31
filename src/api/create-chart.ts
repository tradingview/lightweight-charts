import { ensureNotNull } from '../helpers/assertions';
import { clone, DeepPartial, isString, merge } from '../helpers/strict-type-checks';

import { ChartOptions } from '../model/chart-model';

import { ChartApi } from './chart-api';
import { IChartApi } from './ichart-api';
import { chartOptionsDefaults } from './options/chart-options-defaults';

export { LineStyle, LineType, LineWidth } from '../renderers/draw-line';

export { BarPrice } from '../model/bar';
export { CrossHairMode } from '../model/cross-hair';
export { PriceScaleMode } from '../model/price-scale';
export { UTCTimestamp } from '../model/time-data';

export { BarData } from './ibar-series-api-base';
export { IChartApi, MouseEventParams } from './ichart-api';
export { HistogramData } from './ihistogram-series-api';
export { LineData } from './iline-series-api-base';
export { ISeriesApi } from './iseries-api';

export { isBusinessDay, isUTCTimestamp } from './data-layer';

/**
 * This function is the main entry point of the Lightweight Charting Library
 * @param container - id of HTML element or element itself
 * @param options - any subset of ChartOptions to be applied at start.
 * @return an interface to the created chart
 */
export function createChart(container: string | HTMLElement, options?: DeepPartial<ChartOptions>): IChartApi {
	const htmlElement = ensureNotNull(isString(container) ? document.getElementById(container) : container);
	const chartOptions = (options === undefined) ?
		clone(chartOptionsDefaults) :
		merge(clone(chartOptionsDefaults), options) as ChartOptions;

	return new ChartApi(htmlElement, chartOptions);
}
