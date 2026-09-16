import { StackedBarsSeriesOptions } from './options';

/** One segment of a column, after the stacking options have been applied. */
export interface StackedBand {
	/** Value the segment spans, already scaled in percent mode. */
	value: number;
	/** Index of the value within the point, which is what picks its colour. */
	index: number;
}

/** The options which decide the segments of a column. */
export type StackingOptions = Pick<
	StackedBarsSeriesOptions,
	'percent' | 'stackOrder'
>;

/**
 * The values of a point which can be drawn and measured. Values which are not
 * finite are left out, so a `NaN` costs its own segment rather than every
 * segment above it.
 */
export function finiteValues(values: readonly number[]): number[] {
	return values.filter((value: number) => Number.isFinite(value));
}

/**
 * The segments of one point, in the order they are stacked from the base.
 *
 * In percent mode the values are scaled to total 100 in absolute terms, which
 * keeps a mixed stack symmetrical around the base.
 */
export function stackBands(
	values: readonly number[],
	options: StackingOptions
): StackedBand[] {
	const bands: StackedBand[] = [];
	for (let i = 0; i < values.length; i++) {
		if (Number.isFinite(values[i])) {
			bands.push({ value: values[i], index: i });
		}
	}
	if (options.percent) {
		let total = 0;
		for (const band of bands) {
			total += Math.abs(band.value);
		}
		for (const band of bands) {
			band.value = total === 0 ? 0 : (band.value / total) * 100;
		}
	}
	if (options.stackOrder === 'reverse') {
		bands.reverse();
	}
	return bands;
}

/** The values of {@link stackBands}, ready for the stacking helpers. */
export function bandValues(bands: readonly StackedBand[]): number[] {
	return bands.map((band: StackedBand) => band.value);
}

/**
 * Adds two points together band by band, which is how two columns are merged
 * when the chart conflates them. The result is as long as the longer input;
 * a band missing from one of the points contributes nothing.
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
