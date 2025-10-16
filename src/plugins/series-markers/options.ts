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
 	 * Specifies whether the auto-scaling calculation should expand to include the size of markers.
 	 *
 	 * When `true`, the auto-scale feature will adjust the price scale's range to ensure
 	 * series markers are fully visible and not cropped by the chart's edges.
 	 *
 	 * When `false`, the scale will only fit the series data points, which may cause
 	 * markers to be partially hidden.
	 *
	 * Note: This option only has an effect when auto-scaling is enabled for the price scale.
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
