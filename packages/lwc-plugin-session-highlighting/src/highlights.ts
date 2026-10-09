import { Time, UTCTimestamp } from 'lightweight-charts';
import { convertTimeUTC } from '@tradingview/lwc-toolkit/time';

/** Returns the background color for a bar's time; an empty string draws nothing. */
export type SessionHighlighter = (time: Time) => string;

/** One bar of the series and the color the highlighter gave it. */
export interface Highlight {
	/** The time as the data gives it, which is what the highlighter is shown. */
	time: Time;
	/**
	 * The same bar as the time scale keys it. Every form of `Time` maps to the
	 * UTC timestamp of its bar, so this is what is handed to the time scale on
	 * each paint: the time is converted once here instead of on every lookup.
	 */
	timestamp: UTCTimestamp;
	color: string;
}

/**
 * A range of logical indices, as the time scale reports its visible range.
 * It is the shape of the library's `LogicalRange` without the branded
 * `Logical` type, so that plain numbers can be passed in tests.
 */
export interface VisibleRange {
	from: number;
	to: number;
}

/** A half-open range of data indices, `from` inclusive and `to` exclusive. */
export interface IndexRange {
	from: number;
	to: number;
}

/** The UTC timestamp the time scale keys a bar by, for any form of `Time`. */
export function timestampOf(time: Time): UTCTimestamp {
	return Math.round(convertTimeUTC(time) / 1000) as UTCTimestamp;
}

/** Whether two times name the same bar, however each of them is written. */
export function sameBar(a: Time, b: Time): boolean {
	return timestampOf(a) === timestampOf(b);
}

function highlightFor(time: Time, highlighter: SessionHighlighter): Highlight {
	return { time, timestamp: timestampOf(time), color: highlighter(time) };
}

/** Asks the highlighter for the color of every bar, in data order. */
export function colorsForTimes(times: readonly Time[], highlighter: SessionHighlighter): Highlight[] {
	return times.map(time => highlightFor(time, highlighter));
}

/**
 * Applies an incremental data update that kept or grew the bar count by one,
 * which is what `series.update()` does: the last entry is replaced when the
 * count is unchanged and `time` is still the same bar, whatever form the time
 * now has, and a new one is appended when the count grew by one. Returns
 * false without touching the list when the change is neither, such as the
 * last bar being a different bar at the same count, meaning every bar has to
 * be recolored.
 */
export function updateLastColor(
	highlights: Highlight[],
	count: number,
	time: Time,
	highlighter: SessionHighlighter,
	isSameBar: (a: Time, b: Time) => boolean = sameBar
): boolean {
	const last = highlights[highlights.length - 1];
	if (count === highlights.length) {
		if (last === undefined || !isSameBar(last.time, time)) {
			return false;
		}
		highlights[highlights.length - 1] = highlightFor(time, highlighter);
		return true;
	}
	if (count === highlights.length + 1) {
		highlights.push(highlightFor(time, highlighter));
		return true;
	}
	return false;
}

/**
 * Cuts the list back to `count` entries after bars were removed from the end,
 * by `series.pop()` or by an update that turned the last bar into whitespace;
 * the entries kept are untouched. A historical update can instead remove a
 * bar from the middle, in which case the kept last entry is not `lastTime`'s
 * bar: nothing is cut and false is returned, meaning every bar has to be
 * recolored.
 */
export function shrinkTo(
	highlights: Highlight[],
	count: number,
	lastTime: Time,
	isSameBar: (a: Time, b: Time) => boolean = sameBar
): boolean {
	if (count > 0 && !isSameBar(highlights[count - 1].time, lastTime)) {
		return false;
	}
	highlights.length = count;
	return true;
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
