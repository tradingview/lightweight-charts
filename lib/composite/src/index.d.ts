import { CustomSeriesOptions } from './model/series-options';
export { LineStyle, LineType } from './renderers/draw-line';
export { TrackingModeExitMode } from './model/chart-model';
export { CrosshairMode } from './model/crosshair';
export { MismatchDirection } from './model/plot-list';
export { PriceScaleMode } from './model/price-scale';
export { PriceLineSource, LastPriceAnimationMode } from './model/series-options';
export { ColorType } from './model/layout-options';
export { isBusinessDay, isUTCTimestamp } from './model/horz-scale-behavior-time/types';
export { TickMarkType } from './model/horz-scale-behavior-time/types';
export declare const customSeriesDefaultOptions: CustomSeriesOptions;
export { createChart, createChartEx } from './api/create-chart';
/**
 * Returns the current version as a string. For example `'3.3.0'`.
 */
export declare function version(): string;
