import { finiteOr } from '@tradingview/lwc-toolkit/numbers';

import { GroupedBarsSeriesOptions, defaultOptions } from './options';

/** One column of a group, in bitmap pixels. */
export interface ColumnSpan {
	left: number;
	width: number;
}

/**
 * Width of a group of columns, in CSS pixels: the bar spacing in `histogram`
 * mode, which the renderer then trims to the built-in histogram's column
 * width when drawing, or the `widthPercent` share of it, clamped to
 * `0`–`100`. A percentage which is not a finite number falls back to the
 * default.
 */
export function groupWidth(
	options: Pick<GroupedBarsSeriesOptions, 'columnWidthMode' | 'widthPercent'>,
	barSpacing: number
): number {
	if (options.columnWidthMode === 'histogram') {
		return barSpacing;
	}
	const percent = Math.min(100, Math.max(0, finiteOr(options.widthPercent, defaultOptions.widthPercent)));
	return (barSpacing * percent) / 100;
}

/**
 * Splits the bitmap extent of a group into `count` columns that tile it
 * exactly: every pixel of the group belongs to one column, so neighboring
 * columns have no seam and no overlap, and widths differ by at most one
 * pixel. A group narrower than one pixel per column still gives every column
 * a pixel: the columns are spread evenly over the group and some of them
 * share one, so none is dropped.
 */
export function splitGroup(left: number, width: number, count: number): ColumnSpan[] {
	const spans: ColumnSpan[] = [];
	if (count <= 0) {
		return spans;
	}
	const total = Math.max(1, width);
	for (let i = 0; i < count; i++) {
		const start = left + Math.floor((i * total) / count);
		const end = left + Math.floor(((i + 1) * total) / count);
		if (end > start) {
			spans.push({ left: start, width: end - start });
		} else {
			spans.push({ left: start, width: 1 });
		}
	}
	return spans;
}
