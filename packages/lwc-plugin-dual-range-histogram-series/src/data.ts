import { CustomData, Time } from 'lightweight-charts';

/**
 * DualRangeHistogram Series Data
 */
export interface DualRangeHistogramData<HorzScaleItem = Time>
	extends CustomData<HorzScaleItem> {
	values: number[];
	/**
	 * Per-column color overrides for this point, in the same order as `values`.
	 * An entry which is `undefined` uses the series color for that column.
	 */
	colors?: (string | undefined)[];
}
