import { expect } from 'chai';
import type { Time } from 'lightweight-charts';
import { describe, it } from 'node:test';

import { SeriesStats, applyPointUpdate, timeKey } from '../../src/series-data';
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

void describe('applyPointUpdate', () => {
	void it('replaces the last point when the time is unchanged', () => {
		const points = [valuePoint(1, 1), valuePoint(2, 2)];
		expect(applyPointUpdate(points, valuePoint(2, 42))).to.equal(1);
		expect(points).to.have.length(2);
		expect((points[1] as { value: number }).value).to.equal(42);
	});

	void it('appends a newer point', () => {
		const points = [valuePoint(1, 1)];
		expect(applyPointUpdate(points, valuePoint(2, 2))).to.equal(1);
		expect(points).to.have.length(2);
	});

	void it('starts an empty cache', () => {
		const points: SeriesDataPoint[] = [];
		expect(applyPointUpdate(points, valuePoint(1, 1))).to.equal(0);
		expect(points).to.have.length(1);
	});

	void it('asks for a full re-read when the change is not at the end', () => {
		expect(applyPointUpdate([valuePoint(1, 1), valuePoint(5, 5)], valuePoint(3, 3))).to.equal(-1);
		expect(applyPointUpdate([valuePoint(1, 1)], null)).to.equal(-1);
	});
});

void describe('SeriesStats', () => {
	void it('tracks the length across appends without re-reading the data', () => {
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
