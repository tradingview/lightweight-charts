/// <reference types="_build-time-constants" />

export { LineStyle, LineType, LineWidth } from './renderers/draw-line';

export { BarPrice } from './model/bar';
export { CrossHairMode } from './model/cross-hair';
export { PriceScaleMode } from './model/price-scale';
export { UTCTimestamp } from './model/time-data';

export { BarData } from './api/ibar-series-api-base';
export { IChartApi, MouseEventParams } from './api/ichart-api';
export { HistogramData } from './api/ihistogram-series-api';
export { LineData } from './api/iline-series-api-base';
export { ISeriesApi } from './api/iseries-api';

export { isBusinessDay, isUTCTimestamp } from './api/data-layer';
export { createChart } from './api/create-chart';

export function version(): string {
	return process.env.BUILD_VERSION;
}
