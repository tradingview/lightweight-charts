import { customStyleDefaults, seriesOptionsDefaults } from './api/options/series-options-defaults';
export { isBusinessDay, isUTCTimestamp } from './model/horz-scale-behavior-time/types';
export const customSeriesDefaultOptions = Object.assign(Object.assign({}, seriesOptionsDefaults), customStyleDefaults);
export { createChart, createChartEx, defaultHorzScaleBehavior } from './api/create-chart';
/**
 * Returns the current version as a string. For example `'3.3.0'`.
 */
export function version() {
    return process.env.BUILD_VERSION;
}
