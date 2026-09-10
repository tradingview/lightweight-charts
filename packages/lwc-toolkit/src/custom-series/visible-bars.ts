import {
	CustomBarItemData,
	CustomData,
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
 * Splits a visible range into the runs of consecutive bars, breaking wherever
 * `bars[i].time !== bars[i - 1].time + 1`. Whitespace data never reaches a
 * renderer, so a jump in the logical time index is the only sign of a gap and
 * a line series has to start a new path there instead of bridging it.
 * The returned ranges are absolute `[from, to)` index ranges into `bars`.
 */
export function visibleSegments(
	bars: readonly TimeIndexed[],
	range: IRange<number>
): IRange<number>[] {
	const { from, to } = clampedRange(range, bars.length);
	if (from >= to) {
		return [];
	}
	const segments: IRange<number>[] = [];
	let segmentStart = from;
	for (let i = from + 1; i < to; i++) {
		if (bars[i].time !== bars[i - 1].time + 1) {
			segments.push({ from: segmentStart, to: i });
			segmentStart = i;
		}
	}
	segments.push({ from: segmentStart, to });
	return segments;
}
