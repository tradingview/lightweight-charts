import { expect } from 'chai';
import { MismatchDirection, type Time } from 'lightweight-charts';
import { describe, it } from 'node:test';

import { SeriesStats, timeKey } from '../../src/series-data';
import { AnySeries, SeriesDataPoint } from '../../src/types';

function valuePoint(time: number, value: number): SeriesDataPoint {
	return { time: time as unknown as Time, value };
}

/** A sparse series whose data positions differ from the shared logical indexes. */
function fakeSeries(points: SeriesDataPoint[], logical: number[] = points.map((_, index) => index)): AnySeries {
	return {
		data: () => points.slice(),
		dataByIndex: (index: number, direction: MismatchDirection) => {
			const found = direction === MismatchDirection.NearestRight
				? logical.findIndex(value => value >= index)
				: logical.findLastIndex(value => value <= index);
			return points[found] ?? null;
		},
	} as unknown as AnySeries;
}

void describe('timeKey', () => {
	void it('matches equivalent strings, business days and UTC timestamps', () => {
		expect(timeKey('2024-01-01')).to.equal(timeKey({ year: 2024, month: 1, day: 1 }));
		expect(timeKey('2024-01-01')).to.equal(timeKey(1704067200 as Time));
		expect(timeKey('2024-01-01')).to.not.equal(timeKey('2024-01-02'));
	});
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

	void it('counts actual sparse points and excludes fractional viewport edges', () => {
		const stats = new SeriesStats();
		const series = fakeSeries([valuePoint(1, 1), valuePoint(3, 3), valuePoint(5, 5)], [0, 2, 4]);
		expect(stats.countInRange(series, { from: 2, to: 4 })).to.equal(2);
		expect(stats.countInRange(series, { from: 2.2, to: 4.2 })).to.equal(1);
		expect(stats.countInRange(series, { from: 2.2, to: 3.8 })).to.equal(0);
		expect(stats.countInRange(series, { from: -5, to: -1 })).to.equal(0);
		expect(stats.countInRange(series, { from: 5, to: 10 })).to.equal(0);
		expect(stats.countInRange(series, { from: -3, to: 9 })).to.equal(3);
		expect(stats.countInRange(series, null)).to.equal(3);
	});

	void it('coalesces invalidations and shares one snapshot between consumers', () => {
		const stats = new SeriesStats();
		const series = fakeSeries([valuePoint(1, 1)]);
		const data = series.data.bind(series);
		let reads = 0;
		series.data = () => { reads++; return data(); };
		for (let i = 0; i < 100; i++) { stats.update(series, 'update'); }
		expect(reads).to.equal(0);
		const snapshot = stats.snapshot(series);
		expect(stats.latest(series)).to.equal(snapshot[0]);
		expect(stats.length(series)).to.equal(1);
		expect(stats.countInRange(series, { from: 0, to: 1 })).to.equal(1);
		expect(reads).to.equal(1);
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
