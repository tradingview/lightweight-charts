import { expect } from 'chai';
import type { Time } from 'lightweight-charts';
import { describe, it } from 'node:test';

import { SeriesStats, timeKey } from '../../src/series-data';
import { AnySeries, SeriesDataPoint } from '../../src/types';

function valuePoint(time: number, value: number): SeriesDataPoint {
	return { time: time as unknown as Time, value };
}

/** The three methods {@link SeriesStats} uses, over a plain array of points. */
function fakeSeries(points: SeriesDataPoint[], barsBefore: number = 0, barsAfter: number = 0): AnySeries {
	return {
		data: () => points,
		dataByIndex: () => points[points.length - 1] ?? null,
		barsInLogicalRange: () => ({ barsBefore, barsAfter }),
	} as unknown as AnySeries;
}

void describe('timeKey', () => {
	void it('flattens business days so equal days compare equal', () => {
		expect(timeKey({ year: 2019, month: 5, day: 15 } as unknown as Time))
			.to.equal(timeKey({ year: 2019, month: 5, day: 15 } as unknown as Time));
		expect(timeKey(1557878400 as unknown as Time)).to.equal(1557878400);
	});
});

void describe('SeriesStats', () => {
	void it('tracks the length across appends and replacements', () => {
		const points = [valuePoint(1, 1), valuePoint(2, 2)];
		const series = fakeSeries(points);
		const stats = new SeriesStats();
		stats.update(series, 'full');
		expect(stats.length(series)).to.equal(2);
		points.push(valuePoint(3, 3));
		stats.update(series, 'update');
		expect(stats.length(series)).to.equal(3);
		// Replacing the newest bar does not grow the series.
		points[2] = valuePoint(3, 30);
		stats.update(series, 'update');
		expect(stats.length(series)).to.equal(3);
		expect((stats.latest(series) as { value: number }).value).to.equal(30);
	});

	void it('counts the points in a logical range from barsInLogicalRange', () => {
		const stats = new SeriesStats();
		const series = fakeSeries([valuePoint(1, 1), valuePoint(2, 2), valuePoint(3, 3)], 1, 1);
		stats.update(series, 'full');
		expect(stats.countInRange(series, { from: 1, to: 2 })).to.equal(1);
		// Negative counts mean the first / last bar is inside the range.
		const inside = fakeSeries([valuePoint(1, 1), valuePoint(2, 2)], -3, -2);
		stats.update(inside, 'full');
		expect(stats.countInRange(inside, { from: -3, to: 9 })).to.equal(2);
		// An unknown range is the whole series.
		expect(stats.countInRange(inside, null)).to.equal(2);
	});

	void it('forgets a series that left the pane', () => {
		const stats = new SeriesStats();
		const series = fakeSeries([valuePoint(1, 1)]);
		stats.update(series, 'full');
		stats.forget(series);
		// Falls back to reading the series directly.
		expect(stats.length(series)).to.equal(1);
	});
});

void describe('SeriesStats corrections', () => {
	void it('does not count equivalent business-day objects as new points', () => {
		const points: SeriesDataPoint[] = [{ time: { year: 2024, month: 1, day: 2 }, value: 10 }];
		const series = fakeSeries(points);
		const stats = new SeriesStats();
		stats.update(series, 'full');
		points[0] = { time: { year: 2024, month: 1, day: 2 }, value: 20 };
		stats.update(series, 'update');
		expect(stats.length(series)).to.equal(1);
	});
	void it('reconciles multiple removals and an empty series', () => {
		const points = [valuePoint(1, 1), valuePoint(2, 2), valuePoint(3, 3)];
		const series = fakeSeries(points);
		const stats = new SeriesStats();
		stats.update(series, 'full');
		points.splice(1);
		stats.update(series, 'update');
		expect(stats.length(series)).to.equal(1);
		points.pop();
		stats.update(series, 'update');
		expect(stats.length(series)).to.equal(0);
		expect(stats.latest(series)).to.equal(null);
	});
});
