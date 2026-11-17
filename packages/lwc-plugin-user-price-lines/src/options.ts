import { LineStyle, LineWidth } from 'lightweight-charts';

export interface UserPriceLinesOptions {
	/** Color of the price lines the plugin adds. */
	lineColor: string;
	/** Width of the price lines the plugin adds, in CSS pixels. */
	lineWidth: LineWidth;
	/** Style of the price lines the plugin adds. */
	lineStyle: LineStyle;
	/** Whether the price lines the plugin adds show their price on the price scale. */
	axisLabelVisible: boolean;
	/**
	 * Background of the add button. An empty string uses the background of the
	 * crosshair's horizontal line label, so the button matches that label.
	 */
	buttonColor: string;
	/** Background of the add button while the pointer is over it. */
	hoverColor: string;
	/**
	 * The most price lines the plugin keeps. Adding one more removes the
	 * oldest. Rounded down, and at least `1`; a value that is not a number
	 * means no limit.
	 */
	maxLines: number;
	/**
	 * Whether the plugin sets the chart's crosshair to `CrosshairMode.Normal`
	 * while it is attached, so the button follows the pointer rather than the
	 * series' values. The mode the chart had is put back when the plugin is
	 * detached, unless something changed it from `Normal` in the meantime.
	 */
	setCrosshairMode: boolean;
}

/** Values used for any option which is not set. */
export const defaultOptions: UserPriceLinesOptions = {
	lineColor: '#000000',
	lineWidth: 1,
	lineStyle: LineStyle.Dashed,
	axisLabelVisible: true,
	buttonColor: '',
	hoverColor: '#777777',
	maxLines: Infinity,
	setCrosshairMode: true,
};
