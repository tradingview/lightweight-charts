import { LineStyle, LineWidth } from '../renderers/draw-line';

import { BarPrice } from './bar';

export interface PriceLineOptions {
	level: BarPrice;
	color: string;
	lineWidth: LineWidth;
	lineStyle: LineStyle;
}
