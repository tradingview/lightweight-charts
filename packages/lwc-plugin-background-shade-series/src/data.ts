import { CustomData, Time } from 'lightweight-charts';

/**
 * Background shade series data. The `color` every custom series point can
 * carry is not used: the shade always comes from the value.
 */
export interface BackgroundShadeData<HorzScaleItem = Time> extends CustomData<HorzScaleItem> {
	/** Value that decides the bar's shade, between `lowValue` and `highValue`. */
	value: number;
}
