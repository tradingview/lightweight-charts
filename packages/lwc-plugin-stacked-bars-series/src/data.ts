import { CustomData, Time } from 'lightweight-charts';

/**
 * Stacked bars series data.
 */
export interface StackedBarsData<HorzScaleItem = Time> extends CustomData<HorzScaleItem> {
	values: number[];
}
