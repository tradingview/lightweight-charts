import { customSeriesDefaultOptions, CustomSeriesOptions } from 'lightweight-charts';

/**
 * How a column's width is derived from the bar spacing.
 *
 * - `percent` — a share of the bar spacing, see `widthPercent`.
 * - `histogram` — the full slot with a one-pixel gap, exactly as the built-in
 *   histogram series draws it. `widthPercent` is ignored.
 */
export type PrettyHistogramWidthMode = 'percent' | 'histogram';

export interface PrettyHistogramSeriesOptions extends CustomSeriesOptions {
	/** Fill color of the columns, used whenever no more specific color applies. */
	color: string;
	/** Fill color of columns at or above `base`. `null` to use `color`. */
	upColor: string | null;
	/** Fill color of columns below `base`. `null` to use `color`. */
	downColor: string | null;
	/** Price the columns grow from. */
	base: number;
	/** Column width as a percentage of the bar spacing, `0`–`100`. */
	widthPercent: number;
	/** How the column width is derived from the bar spacing. */
	widthMode: PrettyHistogramWidthMode;
	/** Lower bound for the column width, in CSS pixels. */
	minColumnWidth: number;
	/** Corner radius of the column's outer end, in CSS pixels. */
	radius: number;
	/** Whether the corners at the `base` end are rounded as well. */
	roundInnerCorners: boolean;
	/** Border color of the columns. `null` for no border. */
	borderColor: string | null;
	/** Border width in CSS pixels. Only drawn when `borderColor` is set. */
	borderWidth: number;
	/**
	 * Color the fill fades into at the outer end of each column. `null` for a
	 * flat fill.
	 */
	gradientColor: string | null;
	/**
	 * Whether hovering the series fades every column except the hovered one.
	 */
	highlightHovered: boolean;
}

export const defaultOptions: PrettyHistogramSeriesOptions = {
	...customSeriesDefaultOptions,
	color: '#D63864',
	upColor: null,
	downColor: null,
	base: 0,
	widthPercent: 50,
	widthMode: 'percent',
	minColumnWidth: 1,
	radius: 4,
	roundInnerCorners: false,
	borderColor: null,
	borderWidth: 1,
	gradientColor: null,
	highlightHovered: false,
};
