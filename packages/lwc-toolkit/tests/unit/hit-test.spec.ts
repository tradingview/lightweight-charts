import { expect } from 'chai';
import { describe, it } from 'node:test';
import {
	CustomBarItemData,
	CustomData,
	IRange,
	PaneRendererCustomData,
	Time,
} from 'lightweight-charts';

import {
	createHitTestDataCache,
	distanceToRange,
	nearestVerticalRange,
	seriesHitTestTolerance,
	VerticalSpan,
} from '../../src/custom-series/hit-test.js';

interface TestData extends CustomData<Time> {
	top: number;
	bottom: number;
}

type TestBar = CustomBarItemData<Time, TestData>;

/** Bars 10px apart, each spanning `top`..`bottom` (media y) as given. */
function makeBars(spans: [number, number][]): TestBar[] {
	return spans.map(([top, bottom]: [number, number], i: number) => ({
		x: i * 10,
		time: i,
		barColor: '#000000',
		originalData: { time: i as unknown as Time, top, bottom },
	}));
}

function paneData(bars: TestBar[], visibleRange: IRange<number> | null): PaneRendererCustomData<Time, TestData> {
	return { bars, barSpacing: 10, visibleRange } as unknown as PaneRendererCustomData<Time, TestData>;
}

const spanOf = (bar: TestBar): VerticalSpan => [bar.originalData.top, bar.originalData.bottom];

void describe('distanceToRange', () => {
	void it('is 0 inside the range, ends included', () => {
		expect(distanceToRange(5, 0, 10)).to.equal(0);
		expect(distanceToRange(0, 0, 10)).to.equal(0);
		expect(distanceToRange(10, 0, 10)).to.equal(0);
	});

	void it('is the distance to the nearer end outside it', () => {
		expect(distanceToRange(-3, 0, 10)).to.equal(3);
		expect(distanceToRange(14, 0, 10)).to.equal(4);
	});

	void it('takes the ends in either order', () => {
		expect(distanceToRange(14, 10, 0)).to.equal(4);
		expect(distanceToRange(5, 10, 0)).to.equal(0);
	});
});

void describe('seriesHitTestTolerance', () => {
	void it('reads the option', () => {
		expect(seriesHitTestTolerance({ hitTestTolerance: 3 })).to.equal(3);
		expect(seriesHitTestTolerance({ hitTestTolerance: 0 })).to.equal(0);
	});

	void it('falls back without the option, which hosts before 5.2 lack', () => {
		expect(seriesHitTestTolerance({})).to.equal(8);
		expect(seriesHitTestTolerance({}, 5)).to.equal(5);
	});

	void it('falls back for a value that is not a finite, non-negative number', () => {
		expect(seriesHitTestTolerance({ hitTestTolerance: Number.NaN })).to.equal(8);
		expect(seriesHitTestTolerance({ hitTestTolerance: -1 })).to.equal(8);
		expect(seriesHitTestTolerance({ hitTestTolerance: '3' })).to.equal(8);
	});
});

void describe('nearestVerticalRange', () => {
	const bars = makeBars([[40, 60], [40, 60], [40, 60], [40, 60]]);

	void it('hits the bar whose box holds the pointer at distance 0', () => {
		expect(nearestVerticalRange(paneData(bars, { from: 0, to: 4 }), 21, 50, 3, 2, spanOf))
			.to.deep.equal({ index: 2, distance: 0 });
	});

	void it('measures the straight-line distance to the box within the tolerance', () => {
		// 3px right of bar 1's box (x 9..11) and 4px above it (y 40..60).
		expect(nearestVerticalRange(paneData(bars, { from: 0, to: 4 }), 14, 36, 1, 5, spanOf))
			.to.deep.equal({ index: 1, distance: 5 });
	});

	void it('misses beyond the tolerance', () => {
		expect(nearestVerticalRange(paneData(bars, { from: 0, to: 4 }), 14, 36, 1, 4.9, spanOf)).to.equal(null);
		expect(nearestVerticalRange(paneData(bars, { from: 0, to: 4 }), 20, 70, 3, 5, spanOf)).to.equal(null);
	});

	void it('picks the nearer of two bars in reach, and the earlier on a tie', () => {
		const data = paneData(bars, { from: 0, to: 4 });
		expect(nearestVerticalRange(data, 14, 50, 3, 3, spanOf)).to.deep.equal({ index: 1, distance: 1 });
		expect(nearestVerticalRange(data, 15, 50, 3, 3, spanOf)).to.deep.equal({ index: 1, distance: 2 });
	});

	void it('ranks bars by the distance to their box, not to their x', () => {
		// The pointer is closer to bar 1's x, but bar 1 spans y 80..95 only.
		const uneven = makeBars([[40, 60], [80, 95], [40, 60]]);
		const hit = nearestVerticalRange(paneData(uneven, { from: 0, to: 3 }), 14, 50, 3, 5, spanOf);
		expect(hit).to.deep.equal({ index: 2, distance: 3 });
	});

	void it('skips bars the span callback has nothing for', () => {
		const hit = nearestVerticalRange(
			paneData(bars, { from: 0, to: 4 }),
			19,
			50,
			3,
			8,
			(bar: TestBar, index: number) => (index === 2 ? null : spanOf(bar))
		);
		expect(hit).to.deep.equal({ index: 1, distance: 6 });
	});

	void it('visits only the visible bars near the pointer', () => {
		const visited: number[] = [];
		const many = makeBars(Array.from({ length: 100 }, () => [40, 60] as [number, number]));
		nearestVerticalRange(paneData(many, { from: 10, to: 90 }), 500, 50, 3, 3, (bar: TestBar, index: number) => {
			visited.push(index);
			return spanOf(bar);
		});
		expect(visited).to.deep.equal([50]);
	});

	void it('stays inside the visible range', () => {
		expect(nearestVerticalRange(paneData(bars, { from: 0, to: 2 }), 21, 50, 3, 2, spanOf)).to.equal(null);
	});

	void it('finds nothing without a visible range or bars', () => {
		expect(nearestVerticalRange(paneData(bars, null), 21, 50, 3, 2, spanOf)).to.equal(null);
		expect(nearestVerticalRange(paneData([], { from: 0, to: 0 }), 0, 50, 3, 2, spanOf)).to.equal(null);
	});
});

void describe('createHitTestDataCache', () => {
	void it('returns the same object while the same key is asked for', () => {
		const cache = createHitTestDataCache<{ index: number }>();
		const first = cache.get('bar-3', () => ({ index: 3 }));
		expect(cache.get('bar-3', () => ({ index: 3 }))).to.equal(first);
	});

	void it('creates a new object for another key, and again on coming back', () => {
		const cache = createHitTestDataCache<{ index: number }>();
		const first = cache.get(3, () => ({ index: 3 }));
		const other = cache.get(4, () => ({ index: 4 }));
		expect(other).to.not.equal(first);
		expect(other.index).to.equal(4);
		expect(cache.get(3, () => ({ index: 3 }))).to.not.equal(first);
	});

	void it('creates a new object after clear', () => {
		const cache = createHitTestDataCache<{ index: number }>();
		const first = cache.get(3, () => ({ index: 3 }));
		cache.clear();
		expect(cache.get(3, () => ({ index: 3 }))).to.not.equal(first);
	});
});
