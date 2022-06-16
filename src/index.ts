/// <reference types="_build-time-constants" />

export { LineStyle, LineType } from './renderers/draw-line';

export { TrackingModeExitMode } from './model/chart-model';
export { CrosshairMode } from './model/crosshair';
export { MismatchDirection } from './model/plot-list';
export { PriceScaleMode } from './model/price-scale';
export { PriceLineSource, LastPriceAnimationMode } from './model/series-options';
export { TickMarkType } from './model/time-scale';
export { ColorType } from './model/layout-options';

export {
	isBusinessDay,
	isUTCTimestamp,
} from './api/data-consumer';

export { createChart } from './api/create-chart';

/**
 * Returns the current version as a string. For example `'3.3.0'`.
 */
export function version(): string {
	return process.env.BUILD_VERSION;
}
