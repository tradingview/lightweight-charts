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

export interface DualRangeHistogramSeriesOptions extends CustomSeriesOptions {
	colors: DualRangeHistogramColumns<string>;
	borderRadius: DualRangeHistogramColumns<number>;
	maxHeight: number;
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
	maxHeight: 130,
} as const;
