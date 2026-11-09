import { CustomData, Time } from 'lightweight-charts';

/**
 * Grouped bars series data.
 */
export interface GroupedBarsData<HorzScaleItem = Time> extends CustomData<HorzScaleItem> {
	/**
	 * Values of the point, one column each, drawn left to right. `null`, or a
	 * number which is not finite, leaves its column empty: JSON has no `NaN`,
	 * so a missing value from a server usually arrives as `null`.
	 */
	values: (number | null)[];
	/**
	 * Fill color of each column of this point, overriding the series `colors`
	 * option. An entry which is `undefined`, and a missing entry, fall back to
	 * the series color for that column.
	 */
	colors?: readonly (string | undefined)[];
}
