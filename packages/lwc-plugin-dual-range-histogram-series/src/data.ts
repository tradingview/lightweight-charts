import { CustomData, Time } from 'lightweight-charts';

/**
 * DualRangeHistogram Series Data
 */
export interface DualRangeHistogramData<HorzScaleItem = Time>
	extends CustomData<HorzScaleItem> {
	values: number[];
}
