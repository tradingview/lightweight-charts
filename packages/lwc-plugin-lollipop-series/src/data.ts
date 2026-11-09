import { CustomData, Time } from 'lightweight-charts';

/**
 * Lollipop series data. The optional `color` inherited from `CustomData`
 * overrides the series `color` for that point's stem and dot.
 */
export interface LollipopData<HorzScaleItem = Time> extends CustomData<HorzScaleItem> {
	/** Value the dot is drawn at. The stem joins it to the series `base`. */
	value: number;
}
