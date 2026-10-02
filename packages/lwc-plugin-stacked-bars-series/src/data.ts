import { CustomData, Time } from 'lightweight-charts';

/**
 * Stacked bars series data.
 */
export interface StackedBarsData<HorzScaleItem = Time> extends CustomData<HorzScaleItem> {
	/** Values of the point, in stacking order. */
	values: number[];
	/**
	 * Fill colour of each segment of this point, overriding the series
	 * `colors` option. An entry which is `undefined`, and a missing entry,
	 * fall back to the series colour for that segment.
	 */
	colors?: readonly (string | undefined)[];
}
