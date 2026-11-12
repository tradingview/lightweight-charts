import {
	CustomSeriesOptions,
	customSeriesDefaultOptions,
} from 'lightweight-charts';

/**
 * How the width of a group of columns is decided.
 *
 * - `histogram` — the width the built-in histogram series gives a column: as
 *   wide as the bar spacing allows, leaving a one pixel gap between
 *   neighboring groups.
 * - `percent` — a share of the bar spacing, given by `widthPercent`.
 */
export type GroupedBarsColumnWidthMode = 'histogram' | 'percent';

export interface GroupedBarsSeriesOptions extends CustomSeriesOptions {
	/**
	 * Fill color of each column, by its index in a point's `values`. Colors
	 * repeat when there are more columns than colors. An empty array falls back
	 * to the default colors.
	 */
	colors: readonly string[];
	/**
	 * Price the columns are drawn from. It is part of the autoscale range, so the
	 * line the columns grow from always stays in view.
	 */
	base: number;
	/** How the width of a group of columns is decided. */
	columnWidthMode: GroupedBarsColumnWidthMode;
	/**
	 * Width of a group as a percentage of the bar spacing, `0`–`100`. Only used
	 * when `columnWidthMode` is `percent`.
	 */
	widthPercent: number;
}

export const defaultOptions: GroupedBarsSeriesOptions = {
	...customSeriesDefaultOptions,
	colors: [
		'#2962FF',
		'#E1575A',
		'#F28E2C',
		'rgb(164, 89, 209)',
		'rgb(27, 156, 133)',
	],
	base: 0,
	columnWidthMode: 'percent',
	widthPercent: 80,
};
