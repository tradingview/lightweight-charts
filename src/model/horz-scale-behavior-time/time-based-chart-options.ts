import { ChartOptionsImpl } from '../chart-model';
import { HorzScaleOptions } from '../time-scale';
import { TickMarkFormatter } from './horz-scale-behavior-time';
import { Time } from './types';

/**
 * Extended time scale options for time-based horizontal scale
 */
export interface TimeScaleOptions extends HorzScaleOptions {
	/**
	 * Tick marks formatter can be used to customize tick marks labels on the time axis.
	 *
	 * @defaultValue `undefined`
	 */
	tickMarkFormatter?: TickMarkFormatter;
}

/**
 * Options for chart with time at the horizontal scale
 */
export interface TimeChartOptions extends ChartOptionsImpl<Time> {
	/**
	 * Extended time scale options with option to override tickMarkFormatter
	 */
	timeScale: TimeScaleOptions;
}
