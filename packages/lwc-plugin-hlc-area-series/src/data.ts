import { CustomData, Time } from 'lightweight-charts';

/**
 * HLC area series data.
 */
export interface HLCAreaData<HorzScaleItem = Time> extends CustomData<HorzScaleItem> {
	high: number;
	low: number;
	close: number;
}
