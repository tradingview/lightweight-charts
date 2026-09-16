import {
	CustomSeriesOptions,
	customSeriesDefaultOptions,
} from 'lightweight-charts';

/**
 * How the width of a column is decided.
 *
 * - `histogram` — the width the built-in histogram series uses: as wide as the
 *   bar spacing allows, leaving a one pixel gap between neighbours.
 * - `percent` — a share of the bar spacing, given by `widthPercent`.
 */
export type StackedBarsColumnWidthMode = 'histogram' | 'percent';

/**
 * Order the values of a point are stacked in.
 *
 * - `normal` — `values[0]` is the segment closest to the base.
 * - `reverse` — the last value is closest to the base. Colours follow their
 *   value, so only the positions change.
 */
export type StackedBarsStackOrder = 'normal' | 'reverse';

export interface StackedBarsSeriesOptions extends CustomSeriesOptions {
	/**
	 * Fill colour of each segment, in stacking order. Colours repeat when a
	 * point has more values than there are colours.
	 */
	colors: readonly string[];
	/** Price the columns are stacked from. */
	base: number;
	/** How the width of a column is decided. */
	columnWidthMode: StackedBarsColumnWidthMode;
	/** Width of a column as a percentage of the bar spacing, `0`–`100`. Only used when `columnWidthMode` is `percent`. */
	widthPercent: number;
	/** Colour of the border drawn inside the edge of every segment. */
	segmentBorderColor: string;
	/** Width of the segment border in pixels. `0` draws no border. */
	segmentBorderWidth: number;
	/** Corner radius of the two ends of a column, in pixels. */
	radius: number;
	/** Order the values of a point are stacked in. */
	stackOrder: StackedBarsStackOrder;
	/** Scale every point so that its segments fill the same total height, giving a 100% stacked chart. */
	percent: boolean;
}

export const defaultOptions: StackedBarsSeriesOptions = {
	...customSeriesDefaultOptions,
	colors: [
		'#2962FF',
		'#E1575A',
		'#F28E2C',
		'rgb(164, 89, 209)',
		'rgb(27, 156, 133)',
	],
	base: 0,
	columnWidthMode: 'histogram',
	widthPercent: 80,
	segmentBorderColor: '#FFFFFF',
	segmentBorderWidth: 0,
	radius: 0,
	stackOrder: 'normal',
	percent: false,
} as const;
