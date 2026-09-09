import { CustomSeriesPricePlotValues } from 'lightweight-charts';

/**
 * Running totals of `values`: entry `i` is the sum of `values[0..i]`, which is
 * the top edge of the `i`-th band of a stacked series. Negative values pull the
 * running total back down, so a mixed stack builds up and down from the same
 * baseline. Returns a new array and leaves the input untouched.
 */
export function cumulativeSum(values: readonly number[]): number[] {
	let sum = 0;
	const result = new Array<number>(values.length);
	for (let i = 0; i < values.length; i++) {
		sum += values[i];
		result[i] = sum;
	}
	return result;
}

/**
 * Price plot values for one stacked data item: `[low, high, total]`, where the
 * extremes are taken over the running totals (see {@link cumulativeSum}) and
 * the baseline, and the last entry — the value the chart treats as the item's
 * current value — is the total of the stack.
 *
 * Reporting the running extremes rather than just the total is what makes a
 * stack containing negative values autoscale correctly: positive bands
 * accumulate above the baseline and negative bands below it, so both ends of
 * the stack stay in view.
 *
 * @param values - the band values of the item, in stacking order
 * @param base - baseline the stack is drawn from, usually zero
 */
export function stackedPlotValues(
	values: readonly number[],
	base: number = 0
): CustomSeriesPricePlotValues {
	let sum = base;
	let min = base;
	let max = base;
	for (let i = 0; i < values.length; i++) {
		sum += values[i];
		if (sum < min) {
			min = sum;
		}
		if (sum > max) {
			max = sum;
		}
	}
	return [min, max, values.length === 0 ? base : sum];
}

/**
 * Boundaries of the bands of a stack drawn from `base`: entry `i` is the far
 * edge of band `i`, whose near edge is entry `i - 1` (or `base` for the first
 * band). A negative value therefore draws its band back down from where the
 * previous one ended, so a mixed stack stays contiguous and never overlaps.
 *
 * @param values - the band values of the item, in stacking order
 * @param base - price the stack starts from, usually zero
 */
export function stackLevels(
	values: readonly number[],
	base: number = 0
): number[] {
	let level = base;
	const result = new Array<number>(values.length);
	for (let i = 0; i < values.length; i++) {
		level += values[i];
		result[i] = level;
	}
	return result;
}
