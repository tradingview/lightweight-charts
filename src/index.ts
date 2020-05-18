/// <reference types="_build-time-constants" />

export { LineStyle, LineType } from './renderers/draw-line';

export { CrosshairMode } from './model/crosshair';
export { PriceScaleMode } from './model/price-scale';
export { PriceLineSource } from './model/series-options';
export { TickMarkType } from './model/time-scale';

export {
	isBusinessDay,
	isUTCTimestamp,
} from './api/data-consumer';

export { createChart } from './api/create-chart';

export function version(): string {
	return process.env.BUILD_VERSION;
}
