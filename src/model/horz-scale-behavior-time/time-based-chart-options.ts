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
     * Optional rendering engine selection. Defaults to main-thread if omitted.
     * This is an experimental opt-in and may change.
     */
	renderingEngine?: 'main-thread' | 'worker';
    /**
     * Experimental: controls how bulk series data is transported to a worker when using worker rendering.
     * - 'sab' uses SharedArrayBuffer for zero-copy sharing (requires COOP/COEP and cross-origin isolation)
     * - 'ab' uses ArrayBuffer transfer to move the buffer to the worker
     * - 'json' sends raw JSON items without numeric packing
     * @defaultValue 'sab'
     */
	dataTransport?: 'sab' | 'ab' | 'json';
	/**
	 * Extended time scale options with option to override tickMarkFormatter
	 */
	timeScale: TimeScaleOptions;
}
