import { LineStyle, LineWidth } from '../renderers/draw-line';

export interface PriceLineOptions {
	/**
	 * Price line's value.
	 *
	 * @default 0
	 */
	price: number;
	/**
	 * Price line's color.
	 *
	 * @default '''
	 */
	color: string;
	/**
	 * Price line's width in pixels.
	 *
	 * @default 1
	 */
	lineWidth: LineWidth;
	/**
	 * Price line's style.
	 *
	 * @default LineStyle.Solid
	 */
	lineStyle: LineStyle;
	/**
	 * Display the current price value in on the price scale.
	 *
	 * @default true
	 */
	axisLabelVisible: boolean;
	/**
	 * Price line's on the chart pane.
	 *
	 * @default ''
	 */
	title: string;
}
