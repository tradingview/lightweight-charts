/**
 * The visual stacking order for the markers within the chart.
 *
 * - `normal`: Markers are drawn together with the series they belong to. They can appear below other series depending on the series stacking order.
 * - `aboveSeries`: Markers are drawn above all series but below primitives that use the 'top' zOrder layer.
 * - `top`: Markers are drawn on the topmost primitive layer, above all series and (most) other primitives.
 */
export type SeriesMarkerZOrder = 'top' | 'aboveSeries' | 'normal';

/**
 * Configuration options for the series markers plugin.
 * These options affect all markers managed by the plugin.
 */
export interface SeriesMarkersOptions {
	/**
	 * Autoscaling is a feature that automatically adjusts a price scale to fit the visible range of data.
	 *
	 * @defaultValue `true`
	 */
	autoScale: boolean;

	/**
	 * Defines the stacking order of the markers relative to the series and other primitives.
	 *
	 * @defaultValue `normal`
	 */
	zOrder: SeriesMarkerZOrder;
}

export const seriesMarkerOptionsDefaults: SeriesMarkersOptions = {
	autoScale: true,
	zOrder: 'normal',
} as const;
