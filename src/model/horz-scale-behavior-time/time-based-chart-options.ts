import { ChartOptions } from '../chart-model';
import { TimeScaleOptions } from '../time-scale';
import { TickMarkFormatter } from './horz-scale-behavior-time';
import { Time } from './types';

/**
 * Extended time scale options for time-base horz scale
 */
export interface TimeChartTimeScaleOptions extends TimeScaleOptions {
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
export interface TimeChartOptions extends ChartOptions<Time> {
	/**
	 * Extended time scale options with option to override tickMarkFormatter
	 */
	timeScale: TimeChartTimeScaleOptions;
}
