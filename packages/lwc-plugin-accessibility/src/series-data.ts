import { DataChangedScope, IRange, MismatchDirection, Time } from 'lightweight-charts';

import { AnySeries, SeriesDataPoint } from './types';

/**
 * A logical index past the end of any real series, so a `NearestLeft` lookup
 * always lands on the last data item.
 */
const PAST_THE_END = Number.MAX_SAFE_INTEGER;

/** The series' newest data item, in O(log n) and without cloning the data. */
export function latestDataPoint(series: AnySeries): SeriesDataPoint | null {
	return series.dataByIndex(PAST_THE_END, MismatchDirection.NearestLeft);
}

/**
 * A comparable, equality-safe key for a `Time`: business-day objects are
 * distinct objects for the same day, so they are flattened to a string.
 */
export function timeKey(time: Time): string | number {
	return typeof time === 'object' ? `${time.year}-${time.month}-${time.day}` : time;
}

/** Facts used by announcements, reconciled against the public series data. */
export class SeriesStats {
	private readonly _entries = new Map<AnySeries, { length: number; latest: SeriesDataPoint | null }>();

	/** Records a data change; call with the scope the library reported. */
	public update(series: AnySeries, _scope: DataChangedScope): void {
		// 'update' also covers historical corrections, whitespace changes and pop.
		// The scope does not identify the changed index or the number removed.
		const points = series.data();
		this._entries.set(series, { length: points.length, latest: points[points.length - 1] ?? null });
	}

	public forget(series: AnySeries): void {
		this._entries.delete(series);
	}

	public clear(): void {
		this._entries.clear();
	}

	public latest(series: AnySeries): SeriesDataPoint | null {
		const known = this._entries.get(series);
		return known !== undefined ? known.latest : latestDataPoint(series);
	}

	public length(series: AnySeries): number {
		const known = this._entries.get(series);
		return known !== undefined ? known.length : series.data().length;
	}

	/**
	 * How many of the series' points lie inside `range`, derived from
	 * `barsInLogicalRange` and the tracked length. Falls back to the full length
	 * when the range is unknown.
	 */
	public countInRange(series: AnySeries, range: IRange<number> | null): number {
		const total = this.length(series);
		if (range === null || total === 0) {
			return range === null ? total : 0;
		}
		const bars = series.barsInLogicalRange(range);
		if (bars === null) {
			return 0;
		}
		// Negative `barsBefore` / `barsAfter` mean the first / last bar is inside
		// the range, so only positive counts are outside it.
		const outside = Math.max(0, bars.barsBefore) + Math.max(0, bars.barsAfter);
		return Math.max(0, Math.round(total - outside));
	}
}
