import { CustomData, Time } from 'lightweight-charts';
import { StackedAreaPointColor } from './options';

/**
 * Stacked area series data.
 */
export interface StackedAreaData<HorzScaleItem = Time> extends CustomData<HorzScaleItem> {
	/**
	 * Values of the point, in stacking order. Points do not have to carry the
	 * same number of values: a point with fewer values is padded with zeroes,
	 * so its missing bands collapse onto the one below them.
	 */
	values: number[];
	/**
	 * Colours of each band at this point, overriding the series `colors`
	 * option. An entry, and any colour within it, which is missing falls back
	 * to the series colour. An override applies to the piece of the band which
	 * starts at this point.
	 */
	colors?: readonly (StackedAreaPointColor | undefined)[];
}
