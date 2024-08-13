/**
 * Configuration options for the UpDownMarkers plugin.
 */
export interface UpDownMarkersPluginOptions {
	/**
	 * The color used for markers indicating a positive price change.
	 * This color will be applied to markers shown above data points where the price has increased.
	 */
	positiveColor: string;

	/**
	 * The color used for markers indicating a negative price change.
	 * This color will be applied to markers shown below data points where the price has decreased.
	 */
	negativeColor: string;

	/**
	 * The duration (in milliseconds) for which update markers remain visible on the chart.
	 * After this duration, the markers will automatically disappear.
	 * Set to 0 for markers to remain indefinitely until the next update.
	 */
	updateVisibilityDuration: number;
}

export const upDownMarkersPluginOptionDefaults: UpDownMarkersPluginOptions = {
	positiveColor: '#22AB94',
	negativeColor: '#F7525F',
	updateVisibilityDuration: 5000,
};
