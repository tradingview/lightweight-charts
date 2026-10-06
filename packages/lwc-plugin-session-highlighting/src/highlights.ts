import { Time } from 'lightweight-charts';

/** Returns the background colour for a bar's time; an empty string draws nothing. */
export type SessionHighlighter = (time: Time) => string;

/** One bar of the series and the colour the highlighter gave it. */
export interface Highlight {
	time: Time;
	color: string;
}

/** A half-open range of data indices, `from` inclusive and `to` exclusive. */

/** A range of logical indices, as the time scale reports its visible range. */
export interface VisibleRange {
	from: number;
	to: number;
}
export interface IndexRange {
	from: number;
	to: number;
}

function sameTime(a: Time, b: Time): boolean {
	if (typeof a === 'object' && typeof b === 'object') {
		return a.year === b.year && a.month === b.month && a.day === b.day;
	}
	return a === b;
}

/** Asks the highlighter for the colour of every bar, in data order. */
export function colorsForTimes(times: readonly Time[], highlighter: SessionHighlighter): Highlight[] {
	return times.map(time => ({ time, color: highlighter(time) }));
}

/**
 * Applies an incremental data update, which only ever touches the last bar:
 * the last entry is recoloured when the time is the same, and a new one is
 * appended otherwise.
 */
export function updateLastColor(highlights: Highlight[], time: Time, highlighter: SessionHighlighter): void {
	const color = highlighter(time);
	const last = highlights[highlights.length - 1];
	if (last !== undefined && sameTime(last.time, time)) {
		last.color = color;
	} else {
		highlights.push({ time, color });
	}
}

/** The first index in `[0, count)` for which `test` holds; `count` when there is none. */
function lowerBound(count: number, test: (index: number) => boolean): number {
	let lo = 0;
	let hi = count;
	while (lo < hi) {
		const mid = (lo + hi) >>> 1;
		if (test(mid)) {
			hi = mid;
		} else {
			lo = mid + 1;
		}
	}
	return lo;
}

/**
 * The data indices whose bars fall inside a visible logical range, widened by
 * one bar on each side so that a bar sliding in at the edge is already drawn.
 *
 * Data index and logical index differ as soon as another series starts
 * earlier or the data has gaps, so the caller supplies `indexAt`, which maps a
 * data index to the time scale's logical index. It must be monotonic, which it
 * is for data sorted by time.
 */
export function visibleDataRange(
	count: number,
	indexAt: (dataIndex: number) => number,
	range: VisibleRange | null
): IndexRange {
	if (count === 0 || range === null) {
		return { from: 0, to: 0 };
	}
	const first = Math.floor(range.from) - 1;
	const last = Math.ceil(range.to) + 1;
	const from = lowerBound(count, index => indexAt(index) >= first);
	const to = lowerBound(count, index => indexAt(index) > last);
	return { from, to: Math.max(from, to) };
}
