/// <reference types="_build-time-constants" />

export { LineStyle, LineType, LineWidth } from './renderers/draw-line';

export { BarPrice } from './model/bar';
export { CrosshairMode } from './model/crosshair';
export { PriceScaleMode } from './model/price-scale';
export { PriceLineSource } from './model/series-options';
export { UTCTimestamp } from './model/time-data';
export { TickMarkType } from './model/time-scale';

export {
	BarData,
	HistogramData,
	isBusinessDay,
	isUTCTimestamp,
	LineData,
} from './api/data-consumer';
export { IChartApi, MouseEventParams } from './api/ichart-api';
export { ISeriesApi } from './api/iseries-api';

export { createChart } from './api/create-chart';

export function version(): string {
	return process.env.BUILD_VERSION;
}
