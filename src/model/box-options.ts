import { LineStyle, LineWidth } from '../renderers/draw-line';

/**
 * Represents a box options.
 */
export interface BoxOptions {
	/**
	 * Line: bottom.
	 *
	 * @defaultValue `0`
	 */
	lowPrice: number;
	/**
	 * Line: top.
	 *
	 * @defaultValue `0`
	 */
	highPrice: number;
	/**
	 * Line: left.
	 *
	 * @defaultValue `0`
	 */
	earlyTime: number;
	/**
	 * Line: right.
	 *
	 * @defaultValue `0`
	 */
	lateTime: number;
	/**
	 * Border color.
	 *
	 * @defaultValue `''`
	 */
	borderColor: string;
	/**
	 * Border width in pixels.
	 *
	 * @defaultValue `1`
	 */
	borderWidth: LineWidth;
	/**
	 * Border style.
	 *
	 * @defaultValue {@link LineStyle.Solid}
	 */
	borderStyle: LineStyle;
	/**
	 * Fill color.
	 *
	 * @defaultValue `''`
	 */
	fillColor: string;
	/**
	 * Fill opacity.
	 *
	 * @defaultValue `1`
	 */
	fillOpacity: number;
	/**
	 * Display border.
	 *
	 * @defaultValue `true`
	 */
	borderVisible: boolean;
	/**
	 * Display the current price value in on the price scale.
	 *
	 * @defaultValue `false`
	 */
	axisLabelVisible: boolean;
	/**
	 * Price line's on the chart pane.
	 *
	 * @defaultValue `''`
	 */
	title: string;
}
