import {
	CustomBarItemData,
	CustomData,
	CustomSeriesWhitespaceData,
	IRange,
	PaneRendererCustomData,
} from 'lightweight-charts';

/**
 * The minimum a bar has to provide for {@link visibleSegments}: the logical
 * time scale index of the item (`CustomBarItemData.time`), not a timestamp.
 */
export interface TimeIndexed {
	/** Time scale index (logical index) of the item. */
	readonly time: number;
}

/**
 * Whether two rendered bars are separated by whitespace in their own series.
 * `minGap` is the shortest contiguous whitespace run, in logical indices, that
 * counts as a gap; renderers pass {@link getConflationFactor} so that a run
 * narrower than one conflation bucket is absorbed into the bucket instead of
 * splitting every bar into its own segment. Defaults to 1, which breaks at any
 * whitespace.
 */
export type GapCheck<H, D extends CustomData<H>> = (
	left: CustomBarItemData<H, D>,
	right: CustomBarItemData<H, D>,
	minGap?: number
) => boolean;

/**
 * A chronological view of the data a series has accepted, whitespace included.
 * `points` is a live array whose identity is stable across mutations, so
 * consumers cache on `revision`, which changes whenever a point was added,
 * replaced or removed.
 */
export interface AcceptedInput<H, D extends CustomData<H>> {
	/** Accepted points in chronological order. */
	readonly points: readonly (D | CustomSeriesWhitespaceData<H>)[];
	/** Changes on every accepted data mutation. */
	readonly revision: number;
}

function clampedRange(
	range: IRange<number> | null,
	length: number
): IRange<number> {
	if (range === null) {
		return { from: 0, to: 0 };
	}
	return {
		from: Math.max(0, range.from),
		to: Math.min(length, range.to),
	};
}

/**
 * Calls `fn` for every bar inside `data.visibleRange`, so that a renderer only
 * touches the bars it is about to paint instead of mapping the whole dataset.
 * The index passed to `fn` is the absolute index into `data.bars`, which is
 * what the visible range and per-index option lookups are expressed in.
 * Does nothing when the visible range is `null` or empty.
 */
export function forEachVisibleBar<
	HorzScaleItem,
	TData extends CustomData<HorzScaleItem>,
>(
	data: PaneRendererCustomData<HorzScaleItem, TData>,
	fn: (bar: CustomBarItemData<HorzScaleItem, TData>, index: number) => void
): void {
	const { from, to } = clampedRange(data.visibleRange, data.bars.length);
	for (let i = from; i < to; i++) {
		fn(data.bars[i], i);
	}
}

/**
 * Maps only the bars inside `data.visibleRange`. The result is compacted:
 * `result[0]` is the bar at `visibleRange.from`, so index `k` of the result
 * corresponds to bar `visibleRange.from + k`. The index handed to `fn` is the
 * absolute index into `data.bars` (use it for per-index option lookups).
 * Returns an empty array when the visible range is `null` or empty.
 */
export function mapVisibleBars<
	HorzScaleItem,
	TData extends CustomData<HorzScaleItem>,
	TResult,
>(
	data: PaneRendererCustomData<HorzScaleItem, TData>,
	fn: (bar: CustomBarItemData<HorzScaleItem, TData>, index: number) => TResult
): TResult[] {
	const { from, to } = clampedRange(data.visibleRange, data.bars.length);
	if (from >= to) {
		return [];
	}
	const result = new Array<TResult>(to - from);
	for (let i = from; i < to; i++) {
		result[i - from] = fn(data.bars[i], i);
	}
	return result;
}

/**
 * Widens a visible range by `by` bars on each side, clamped to `[0, length]`,
 * for line-type series whose first and last segments have to leave the pane
 * rather than stop at the first and last visible bar.
 */
export function extendRange(
	range: IRange<number>,
	length: number,
	by: number = 1
): IRange<number> {
	return {
		from: Math.max(0, range.from - by),
		to: Math.min(length, range.to + by),
	};
}

/**
 * Splits a visible range at explicit series gaps. A jump in logical index can
 * also come from another series' timestamps, so it must not imply whitespace.
 * Without a gap predicate, increasing indices form one continuous run.
 * The returned ranges are absolute `[from, to)` index ranges into `bars`.
 */
export function visibleSegments<T extends TimeIndexed>(
	bars: readonly T[],
	range: IRange<number>,
	isGap?: (left: T, right: T) => boolean
): IRange<number>[] {
	const { from, to } = clampedRange(range, bars.length);
	if (from >= to) {
		return [];
	}
	const segments: IRange<number>[] = [];
	let segmentStart = from;
	for (let i = from + 1; i < to; i++) {
		const step = bars[i].time - bars[i - 1].time;
		if (step <= 0 || isGap?.(bars[i - 1], bars[i])) {
			segments.push({ from: segmentStart, to: i });
			segmentStart = i;
		}
	}
	segments.push({ from: segmentStart, to });
	return segments;
}

/**
 * Detects whitespace from the series' accepted input, including on hosts whose
 * renderer data omits it. The input getter returns a chronological snapshot
 * whose revision changes when data changes. Resolve logical indices at lookup
 * time because other series can change the shared timeline independently.
 * A contiguous run shorter than the caller's `minGap` is not reported as a gap.
 */
export function whitespaceGapCheck<H, D extends CustomData<H>>(
	readInput: () => AcceptedInput<H, D>,
	logicalIndex: (time: H) => number | null,
	isWhitespace: (point: D | CustomSeriesWhitespaceData<H>) => boolean
): GapCheck<H, D> {
	let revision: number | null = null;
	let times: H[] = [];
	return (left, right, minGap = 1): boolean => {
		const input = readInput();
		if (input.revision !== revision) {
			revision = input.revision;
			times = input.points.filter(isWhitespace).map(point => point.time);
		}
		if (times.length === 0) { return false; }
		// A time that is no longer on the scale sorts with the entries before
		// it, which keeps both searches monotonic over the same ordering.
		const lowerBound = (isBefore: (index: number | null) => boolean): number => {
			let low = 0;
			let high = times.length;
			while (low < high) {
				const mid = Math.floor((low + high) / 2);
				if (isBefore(logicalIndex(times[mid]))) { low = mid + 1; } else { high = mid; }
			}
			return low;
		};
		// The whitespace strictly between the two bars occupies the positions
		// [first, after). Their count bounds the longest run, so the common
		// case — scattered holidays inside one conflation bucket — costs two
		// binary searches and nothing else.
		const first = lowerBound(index => index === null || index <= left.time);
		if (first >= times.length) { return false; }
		const after = lowerBound(index => index === null || index < right.time);
		const threshold = Math.max(1, minGap);
		if (after - first < threshold) { return false; }
		// Only a contiguous run leaves a hole wide enough to see: whitespace
		// interleaved with drawn indices is below the resolution of a bucket.
		let run = 0;
		let previous: number | null = null;
		for (let position = first; position < after; position++) {
			const index = logicalIndex(times[position]);
			if (index === null) {
				// No longer on the scale, so it holds no logical index to fill.
				run = 0;
			} else {
				run = previous !== null && index === previous + 1 ? run + 1 : 1;
			}
			previous = index;
			if (run >= threshold) { return true; }
		}
		return false;
	};
}

/**
 * Reconstructs a bar's media x coordinate from a currently visible anchor.
 * Extended bars may have missing or stale coordinates after scrolling/zooming.
 * Spacing is per logical index, including when bars have been conflated.
 */
export function barCoordinate(bar: TimeIndexed, anchor: TimeIndexed & { x: number }, barSpacing: number): number {
	return anchor.x + (bar.time - anchor.time) * barSpacing;
}

/** The logical stride of a rendered bar; hosts before 5.1 omit the factor. */
export function getConflationFactor(data: { barSpacing: number; conflationFactor?: number }): number {
	return Math.max(1, data.conflationFactor ?? 1);
}
