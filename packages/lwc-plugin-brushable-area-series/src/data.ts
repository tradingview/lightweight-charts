import { CustomData, Time } from '@bishopbot/lightweight-charts';

/**
 * BrushableArea Series Data
 */
export interface BrushableAreaData<HorzScaleItem = Time>
	extends CustomData<HorzScaleItem> {
	value: number;
}
