import { CustomData, Time } from 'lightweight-charts';

/**
 * Background shade series data. A `color` on the data item, which every
 * custom series point can carry, shades that bar with it instead of the shade
 * mixed from its value; a color the canvas cannot parse is ignored.
 */
export interface BackgroundShadeData<HorzScaleItem = Time> extends CustomData<HorzScaleItem> {
	/** Value that decides the bar's shade, between `lowValue` and `highValue`. */
	value: number;
}
