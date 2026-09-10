import { CustomData, Time } from 'lightweight-charts';

/**
 * Pretty histogram series data. The optional `color` inherited from
 * `CustomData` overrides the series `color` for that bar.
 */
export interface PrettyHistogramData<HorzScaleItem = Time> extends CustomData<HorzScaleItem> {
	value: number;
}
