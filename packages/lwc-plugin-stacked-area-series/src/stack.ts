import { IRange } from 'lightweight-charts';

/**
 * The values of a point, padded to `length` and with anything that cannot be
 * drawn replaced by zero. Padding rather than dropping keeps every value on
 * the band its index picks, so a point with fewer values than its neighbours
 * simply has its top bands collapse onto the one below them.
 */
export function paddedValues(
	values: readonly number[],
	length: number
): number[] {
	const result = new Array<number>(length);
	for (let i = 0; i < length; i++) {
		const value = values[i];
		result[i] = Number.isFinite(value) ? value : 0;
	}
	return result;
}

/**
 * The values scaled so that they total 100 in absolute terms, which is what a
 * 100% stacked chart draws. A point which totals zero stays at zero.
 */
export function percentValues(values: readonly number[]): number[] {
	let total = 0;
	for (const value of values) {
		total += Math.abs(value);
	}
	if (total === 0) {
		return values.map((): number => 0);
	}
	return values.map((value: number): number => (value / total) * 100);
}

/**
 * Adds two points together band by band, which is how two points are merged
 * when the chart conflates them. The result is as long as the longer input.
 */
export function sumValues(
	first: readonly number[],
	second: readonly number[]
): number[] {
	const result = new Array<number>(Math.max(first.length, second.length));
	for (let i = 0; i < result.length; i++) {
		result[i] = (first[i] ?? 0) + (second[i] ?? 0);
	}
	return result;
}

/**
 * Splits `[from, to)` into the runs of bars which are drawn with one style.
 *
 * `key(i)` identifies the style of the piece of the band between bar `i` and
 * bar `i + 1`. Runs overlap by one bar — a run ends on the bar the next one
 * starts from — so the pieces they draw meet exactly and leave no seam.
 */
export function styleRuns(
	from: number,
	to: number,
	key: (index: number) => string
): IRange<number>[] {
	if (to - from < 2) {
		return to > from ? [{ from, to }] : [];
	}
	const runs: IRange<number>[] = [];
	let start = from;
	for (let i = from + 1; i < to - 1; i++) {
		if (key(i) !== key(i - 1)) {
			runs.push({ from: start, to: i + 1 });
			start = i;
		}
	}
	runs.push({ from: start, to });
	return runs;
}
