import { CustomData, Time } from 'lightweight-charts';

/**
 * Stacked area series data.
 */
export interface StackedAreaData<HorzScaleItem = Time> extends CustomData<HorzScaleItem> {
	values: number[];
}
