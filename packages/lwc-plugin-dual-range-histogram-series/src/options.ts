import {
	CustomSeriesOptions,
	customSeriesDefaultOptions,
} from 'lightweight-charts';

/**
 * A value of `T` per column of a point. The keys name the columns by their
 * position in the point's `values`: `[upOuter, upInner, downOuter, downInner]`.
 */
export interface DualRangeHistogramColumns<T> {
	upOuter: T;
	upInner: T;
	downOuter: T;
	downInner: T;
}

/**
 * How the column heights are derived from the values.
 *
 * - `pixels` — the tallest value fills half of `maxHeight`, and every other
 *   column is scaled against it. The series does not report its values to the
 *   price scale, so it never disturbs the scaling of the other series; see
 *   `keepPixelSeriesInView`.
 * - `price` — the values are prices measured from `baseValue`, autoscaled like
 *   any other series. `maxHeight` and `normalize` are ignored.
 */
export type DualRangeHistogramScaleMode = 'pixels' | 'price';

/**
 * What the column heights are scaled against in `pixels` mode.
 *
 * - `visible` — the largest absolute value in the visible range, so the columns
 *   re-scale while panning and zooming.
 * - `all` — the largest absolute value in the whole data set, so the columns
 *   keep their relative heights while panning.
 * - a number — that value is the full height, so the scale never changes.
 */
export type DualRangeHistogramNormalize = 'visible' | 'all' | number;

export interface DualRangeHistogramSeriesOptions extends CustomSeriesOptions {
	/** Fill color of each column. A per-point `colors` entry overrides it. */
	colors: DualRangeHistogramColumns<string>;
	/** Corner radius of each column's outer end, in CSS pixels. */
	borderRadius: DualRangeHistogramColumns<number>;
	/** Border color of the columns. `null` for no border. */
	borderColor: string | null;
	/** Border width in CSS pixels. Only drawn when `borderColor` is set. */
	borderWidth: number;
	/** Total height of the histogram in CSS pixels. Only used in `pixels` mode. */
	maxHeight: number;
	/** How the column heights are derived from the values. */
	scaleMode: DualRangeHistogramScaleMode;
	/** What the column heights are scaled against in `pixels` mode. */
	normalize: DualRangeHistogramNormalize;
	/** Gap between the upward and the downward half, in CSS pixels. */
	gap: number;
	/** Column width as a percentage of the bar spacing, `0`–`100`. */
	widthPercent: number;
	/** Price the columns are centred on. */
	baseValue: number;
	/**
	 * Whether hovering the series fades every point except the hovered one.
	 */
	highlightHovered: boolean;
}

/** The column each entry of a point's `values` belongs to. */
export const columnOrder: readonly (keyof DualRangeHistogramColumns<unknown>)[] =
	['upOuter', 'upInner', 'downOuter', 'downInner'];

export const defaultOptions: DualRangeHistogramSeriesOptions = {
	...customSeriesDefaultOptions,
	colors: {
		upOuter: '#ACE5DC',
		upInner: '#42BDA8',
		downOuter: '#FCCACD',
		downInner: '#F77C80',
	},
	borderRadius: {
		upOuter: 2,
		upInner: 0,
		downOuter: 2,
		downInner: 0,
	},
	borderColor: null,
	borderWidth: 1,
	maxHeight: 130,
	scaleMode: 'pixels',
	normalize: 'visible',
	gap: 0,
	widthPercent: 100,
	baseValue: 0,
	highlightHovered: false,
} as const;
