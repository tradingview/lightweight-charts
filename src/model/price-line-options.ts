import { LineStyle, LineWidth } from '../renderers/draw-line';

/**
 * Represents a price line.
 */
export interface PriceLineOptions {
	/**
	 * Price line's value.
	 */
	price: number;
	/**
	 * Price line's color.
	 */
	color: string;
	/**
	 * Price line's width in pixels.
	 */
	lineWidth: LineWidth;
	/**
	 * Price line's style.
	 */
	lineStyle: LineStyle;
	/**
	 * Display the current price value in on the price scale.
	 */
	axisLabelVisible: boolean;
	/**
	 * Price line's on the chart pane.
	 */
	title: string;
}
