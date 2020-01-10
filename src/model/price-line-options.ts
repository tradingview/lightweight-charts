import { LineStyle, LineWidth } from '../renderers/draw-line';

import { BarPrice } from './bar';

export interface PriceLineOptions {
	price: BarPrice;
	color: string;
	lineWidth: LineWidth;
	lineStyle: LineStyle;
	axisLabelVisible: boolean;
}
