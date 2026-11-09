import { finiteOr } from '@tradingview/lwc-toolkit/numbers';

import { GroupedBarsSeriesOptions, defaultOptions } from './options';

/** The `base` option, or `0` when it is not a finite number. */
export function groupedBarsBase(options: Pick<GroupedBarsSeriesOptions, 'base'>): number {
	return finiteOr(options.base, defaultOptions.base);
}

/**
 * Whether a value draws a column: a finite number other than the base, which
 * would draw a column of no height. `null`, as JSON sends a missing value, and
 * `NaN` draw nothing either.
 */
export function isDrawnValue(value: number | null | undefined, base: number): value is number {
	return typeof value === 'number' && Number.isFinite(value) && value !== base;
}

/**
 * The number of columns every group is split into: the most values any point
 * that draws a column has, `null` slots included, so that a column is as wide
 * in every group. A point none of whose values draws a column is whitespace
 * and counts for nothing. At least one.
 */
export function columnCount<T>(
	points: readonly T[],
	base: number,
	valuesOf: (point: T) => readonly (number | null)[] | null | undefined
): number {
	let count = 1;
	for (const point of points) {
		const values = valuesOf(point);
		if (values && values.length > count && values.some(value => isDrawnValue(value, base))) {
			count = values.length;
		}
	}
	return count;
}
