import { LineStyle, LineWidth } from '../renderers/draw-line';

export interface PriceLineOptions {
	price: number;
	color: string;
	lineWidth: LineWidth;
	lineStyle: LineStyle;
	axisLabelVisible: boolean;
}
