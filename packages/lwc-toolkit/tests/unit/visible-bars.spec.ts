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
	extendRange,
	forEachVisibleBar,
	mapVisibleBars,
	visibleSegments,
} from '../../src/custom-series/visible-bars.js';

interface TestData extends CustomData<Time> {
	value: number;
}

type TestBar = CustomBarItemData<Time, TestData>;

/**
 * Builds bars with consecutive logical time indices unless `times` is given,
 * which lets a test punch gaps into the index sequence.
 */
function makeBars(count: number, times?: number[]): TestBar[] {
	return Array.from({ length: count }, (_: unknown, i: number) => {
		const time = times ? times[i] : i;
		return {
			x: i * 10,
			time,
			barColor: '#000000',
			originalData: {
				time: time as unknown as Time,
				value: i,
			},
		};
	});
}

function paneData(
	bars: TestBar[],
	visibleRange: IRange<number> | null
): PaneRendererCustomData<Time, TestData> {
	return {
		bars,
		barSpacing: 10,
		visibleRange,
		conflationFactor: 1,
	} as unknown as PaneRendererCustomData<Time, TestData>;
}

void describe('forEachVisibleBar', () => {
	void it('visits only the bars inside the visible range', () => {
		const seen: number[] = [];
		forEachVisibleBar(
			paneData(makeBars(10), { from: 3, to: 6 }),
			(_: TestBar, index: number) => seen.push(index)
		);
		expect(seen).to.deep.equal([3, 4, 5]);
	});

	void it('passes the absolute bar index, not the visit count', () => {
		const seen: number[] = [];
		forEachVisibleBar(
			paneData(makeBars(10), { from: 7, to: 9 }),
			(bar: TestBar, index: number) => seen.push(bar.originalData.value - index)
		);
		expect(seen).to.deep.equal([0, 0]);
	});

	void it('does nothing when the visible range is null', () => {
		let calls = 0;
		forEachVisibleBar(paneData(makeBars(5), null), () => calls++);
		expect(calls).to.equal(0);
	});

	void it('does nothing for an empty range', () => {
		let calls = 0;
		forEachVisibleBar(paneData(makeBars(5), { from: 2, to: 2 }), () => calls++);
		expect(calls).to.equal(0);
	});

	void it('clamps a range which runs past the ends of the data', () => {
		const seen: number[] = [];
		forEachVisibleBar(
			paneData(makeBars(3), { from: -2, to: 9 }),
			(_: TestBar, index: number) => seen.push(index)
		);
		expect(seen).to.deep.equal([0, 1, 2]);
	});
});

void describe('mapVisibleBars', () => {
	void it('returns one entry per visible bar', () => {
		const result = mapVisibleBars(
			paneData(makeBars(10), { from: 4, to: 7 }),
			(bar: TestBar) => bar.x
		);
		expect(result).to.deep.equal([40, 50, 60]);
	});

	void it('compacts the result, so index 0 is the first visible bar', () => {
		const result = mapVisibleBars(
			paneData(makeBars(10), { from: 4, to: 7 }),
			(_: TestBar, index: number) => index
		);
		expect(result).to.deep.equal([4, 5, 6]);
		expect(result).to.have.length(3);
	});

	void it('returns an empty array when there is no visible range', () => {
		expect(
			mapVisibleBars(paneData(makeBars(5), null), (bar: TestBar) => bar.x)
		).to.deep.equal([]);
	});

	void it('returns an empty array for an empty range', () => {
		expect(
			mapVisibleBars(
				paneData(makeBars(5), { from: 3, to: 3 }),
				(bar: TestBar) => bar.x
			)
		).to.deep.equal([]);
	});

	void it('does not map bars outside the visible range', () => {
		let calls = 0;
		mapVisibleBars(paneData(makeBars(100), { from: 0, to: 2 }), () => calls++);
		expect(calls).to.equal(2);
	});
});

void describe('extendRange', () => {
	void it('widens the range by one bar on each side by default', () => {
		expect(extendRange({ from: 3, to: 6 }, 10)).to.deep.equal({
			from: 2,
			to: 7,
		});
	});

	void it('widens by the requested number of bars', () => {
		expect(extendRange({ from: 5, to: 6 }, 10, 3)).to.deep.equal({
			from: 2,
			to: 9,
		});
	});

	void it('clamps the start at zero', () => {
		expect(extendRange({ from: 0, to: 4 }, 10)).to.deep.equal({
			from: 0,
			to: 5,
		});
	});

	void it('clamps the end at the data length', () => {
		expect(extendRange({ from: 8, to: 10 }, 10)).to.deep.equal({
			from: 7,
			to: 10,
		});
	});

	void it('clamps both ends at once', () => {
		expect(extendRange({ from: 0, to: 3 }, 3, 5)).to.deep.equal({
			from: 0,
			to: 3,
		});
	});

	void it('leaves the range alone when asked to extend by zero', () => {
		expect(extendRange({ from: 2, to: 5 }, 10, 0)).to.deep.equal({
			from: 2,
			to: 5,
		});
	});
});

void describe('visibleSegments', () => {
	void it('returns a single run for consecutive bars', () => {
		expect(visibleSegments(makeBars(5), { from: 0, to: 5 })).to.deep.equal([
			{ from: 0, to: 5 },
		]);
	});

	void it('breaks where the logical time index skips', () => {
		// a whitespace item at index 3 leaves a hole between times 2 and 4
		const bars = makeBars(5, [0, 1, 2, 4, 5]);
		expect(visibleSegments(bars, { from: 0, to: 5 })).to.deep.equal([
			{ from: 0, to: 3 },
			{ from: 3, to: 5 },
		]);
	});

	void it('handles several gaps', () => {
		const bars = makeBars(6, [0, 2, 3, 9, 10, 20]);
		expect(visibleSegments(bars, { from: 0, to: 6 })).to.deep.equal([
			{ from: 0, to: 1 },
			{ from: 1, to: 3 },
			{ from: 3, to: 5 },
			{ from: 5, to: 6 },
		]);
	});

	void it('only looks at the requested range', () => {
		const bars = makeBars(6, [0, 5, 6, 7, 20, 21]);
		expect(visibleSegments(bars, { from: 1, to: 4 })).to.deep.equal([
			{ from: 1, to: 4 },
		]);
	});

	void it('returns one segment per bar when every index is a gap', () => {
		const bars = makeBars(3, [0, 10, 20]);
		expect(visibleSegments(bars, { from: 0, to: 3 })).to.deep.equal([
			{ from: 0, to: 1 },
			{ from: 1, to: 2 },
			{ from: 2, to: 3 },
		]);
	});

	void it('returns a single-bar segment for a one-bar range', () => {
		expect(visibleSegments(makeBars(5), { from: 2, to: 3 })).to.deep.equal([
			{ from: 2, to: 3 },
		]);
	});

	void it('returns nothing for an empty range', () => {
		expect(visibleSegments(makeBars(5), { from: 2, to: 2 })).to.deep.equal([]);
		expect(visibleSegments([], { from: 0, to: 0 })).to.deep.equal([]);
	});

	void it('clamps a range running past the data', () => {
		expect(visibleSegments(makeBars(3), { from: -1, to: 8 })).to.deep.equal([
			{ from: 0, to: 3 },
		]);
	});

	void it('does not treat a repeated index as consecutive', () => {
		const bars = makeBars(3, [4, 4, 5]);
		expect(visibleSegments(bars, { from: 0, to: 3 })).to.deep.equal([
			{ from: 0, to: 1 },
			{ from: 1, to: 3 },
		]);
	});
});
