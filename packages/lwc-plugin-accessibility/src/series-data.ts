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
 * Applies one `'update'` data change to an owned copy of a series' points:
 * `series.update()` either replaces the newest bar or appends one, so the
 * cached array can be patched in place instead of being re-read (and cloned)
 * on every tick.
 *
 * Returns the index of the changed point, or `-1` when the change could not be
 * applied incrementally and a full re-read is needed.
 */
export function applyPointUpdate(points: SeriesDataPoint[], latest: SeriesDataPoint | null): number {
	if (latest === null) {
		return -1;
	}
	const last = points[points.length - 1];
	if (last === undefined) {
		points.push(latest);
		return 0;
	}
	if (last.time === latest.time) {
		points[points.length - 1] = latest;
		return points.length - 1;
	}
	// An update can only touch the last bar or add a new one; anything else
	// (a bar inserted before the end) is not an `update`, so re-read.
	if (compareTimes(latest.time, last.time) > 0) {
		points.push(latest);
		return points.length - 1;
	}
	return -1;
}

/**
 * A comparable, equality-safe key for a `Time`: business-day objects are
 * distinct objects for the same day, so they are flattened to a string.
 */
export function timeKey(time: Time): string | number {
	return typeof time === 'object' ? `${time.year}-${time.month}-${time.day}` : time;
}

/** Orders two `Time` values without converting business days to dates. */
function compareTimes(a: Time, b: Time): number {
	const left = timeKey(a);
	const right = timeKey(b);
	return left === right ? 0 : left > right ? 1 : -1;
}

/**
 * The per-series facts the update announcements need – how many points a series
 * holds and which is the newest – kept up to date from the `subscribeDataChanged`
 * scope instead of cloning `series.data()` on every tick.
 *
 * A `'full'` change (`setData`) re-reads the length once; an `'update'` costs a
 * single indexed lookup, and the in-view count comes from `barsInLogicalRange`,
 * so a streaming chart does no work proportional to its history.
 */
export class SeriesStats {
	private readonly _entries = new Map<AnySeries, { length: number; latest: SeriesDataPoint | null }>();

	/** Records a data change; call with the scope the library reported. */
	public update(series: AnySeries, scope: DataChangedScope): void {
		const latest = latestDataPoint(series);
		const known = this._entries.get(series);
		if (scope === 'full' || known === undefined) {
			this._entries.set(series, { length: series.data().length, latest });
			return;
		}
		const appended = latest !== null && (known.latest === null || known.latest.time !== latest.time);
		this._entries.set(series, { length: known.length + (appended ? 1 : 0), latest });
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
