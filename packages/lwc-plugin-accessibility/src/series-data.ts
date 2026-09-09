import { convertTimeUTC } from '@tradingview/lwc-toolkit/time';
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

/** Facts used by announcements, reconciled lazily against the public series data. */
export class SeriesStats {
	private readonly _entries = new Map<AnySeries, readonly SeriesDataPoint[]>();

	/** Invalidates the snapshot without reading data on every streaming tick. */
	public update(series: AnySeries, _scope: DataChangedScope): void {
		this._entries.delete(series);
	}

	/** Shared by announcement statistics and focused navigation. */
	public snapshot(series: AnySeries): readonly SeriesDataPoint[] {
		let points = this._entries.get(series);
		if (points === undefined) {
			points = series.data();
			this._entries.set(series, points);
		}
		return points;
	}

	public forget(series: AnySeries): void {
		this._entries.delete(series);
	}

	public clear(): void {
		this._entries.clear();
	}

	public latest(series: AnySeries): SeriesDataPoint | null {
		const points = this.snapshot(series);
		return points[points.length - 1] ?? null;
	}

	public length(series: AnySeries): number {
		return this.snapshot(series).length;
	}

	/** Counts fulfilled points, rather than slots on the chart's shared time scale. */
	public countInRange(series: AnySeries, range: IRange<number> | null): number {
		const points = this.snapshot(series);
		if (range === null) { return points.length; }
		if (points.length === 0 || Math.ceil(range.from) > Math.floor(range.to)) { return 0; }
		const first = series.dataByIndex(Math.ceil(range.from), MismatchDirection.NearestRight);
		const last = series.dataByIndex(Math.floor(range.to), MismatchDirection.NearestLeft);
		if (first === null || last === null) { return 0; }
		const from = convertTimeUTC(first.time);
		const to = convertTimeUTC(last.time);
		if (from > to) { return 0; }
		const bound = (time: number, inclusive: boolean): number => {
			let low = 0;
			let high = points.length;
			while (low < high) {
				const mid = Math.floor((low + high) / 2);
				const current = convertTimeUTC(points[mid].time);
				if (current < time || (inclusive && current === time)) { low = mid + 1; } else { high = mid; }
			}
			return low;
		};
		return bound(to, true) - bound(from, false);
	}
}
