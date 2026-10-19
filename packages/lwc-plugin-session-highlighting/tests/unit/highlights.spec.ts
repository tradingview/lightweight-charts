import { expect } from 'chai';
import { describe, it } from 'node:test';
import type { Time } from 'lightweight-charts';

import { colorsForTimes, shrinkTo, timestampOf, updateLastColor, visibleDataRange } from '../../src/highlights.js';

const even = (time: Time) => ((time as number) % 2 === 0 ? 'red' : '');

void describe('colorsForTimes', () => {
	void it('asks the highlighter for every time, in order', () => {
		const result = colorsForTimes([1, 2, 3] as Time[], even);
		expect(result).to.deep.equal([
			{ timestamp: 1, color: '' },
			{ timestamp: 2, color: 'red' },
			{ timestamp: 3, color: '' },
		]);
	});

	void it('returns an empty list for no data', () => {
		expect(colorsForTimes([], even)).to.deep.equal([]);
	});
});

void describe('timestampOf', () => {
	void it('maps every form of a day to the UTC timestamp of that day', () => {
		expect(timestampOf(1704067200 as Time)).to.equal(1704067200);
		expect(timestampOf({ year: 2024, month: 1, day: 1 } as Time)).to.equal(1704067200);
		expect(timestampOf('2024-01-01' as Time)).to.equal(1704067200);
	});

	void it('passes fractional numbers through, as the time scale keys them', () => {
		// A sub-second timestamp, and a strike on an options chart.
		expect(timestampOf(1704067200.5 as Time)).to.equal(1704067200.5);
		expect(timestampOf(102.5 as Time)).to.equal(102.5);
	});
});

void describe('updateLastColor', () => {
	void it('replaces the last entry when the count is unchanged and it is the same bar', () => {
		const highlights = colorsForTimes([1, 2] as Time[], even);
		expect(updateLastColor(highlights, 2, 2 as Time, () => 'blue')).to.equal(true);
		expect(highlights).to.deep.equal([{ timestamp: 1, color: '' }, { timestamp: 2, color: 'blue' }]);
	});

	void it('replaces the last entry when the same bar is written another way', () => {
		const highlights = colorsForTimes([{ year: 2024, month: 1, day: 1 }] as Time[], () => 'red');
		expect(updateLastColor(highlights, 1, '2024-01-01' as Time, () => 'blue')).to.equal(true);
		expect(highlights).to.deep.equal([{ timestamp: 1704067200, color: 'blue' }]);
	});

	void it('appends when the count grew by one', () => {
		const highlights = colorsForTimes([1, 2] as Time[], even);
		expect(updateLastColor(highlights, 3, 4 as Time, even)).to.equal(true);
		expect(highlights).to.deep.equal([
			{ timestamp: 1, color: '' },
			{ timestamp: 2, color: 'red' },
			{ timestamp: 4, color: 'red' },
		]);
	});

	void it('appends to an empty list', () => {
		const highlights = colorsForTimes([], even);
		expect(updateLastColor(highlights, 1, 4 as Time, even)).to.equal(true);
		expect(highlights).to.deep.equal([{ timestamp: 4, color: 'red' }]);
	});

	void it('refuses when the count is unchanged but the last bar is a different bar', () => {
		// A historical update on a whitespace point overwrote the last bar.
		const highlights = colorsForTimes([1, 2, 4] as Time[], even);
		let calls = 0;
		expect(updateLastColor(highlights, 3, 3 as Time, () => { calls++; return 'blue'; })).to.equal(false);
		expect(highlights).to.have.length(3);
		expect(highlights[2].timestamp).to.equal(4);
		expect(calls).to.equal(0);
	});

	void it('tells apart two bars within the same second', () => {
		const highlights = colorsForTimes([1704067200.25] as Time[], () => 'red');
		expect(updateLastColor(highlights, 1, 1704067200.5 as Time, () => 'blue')).to.equal(false);
		expect(highlights).to.deep.equal([{ timestamp: 1704067200.25, color: 'red' }]);
	});

	void it('refuses when the count changed by more than an append', () => {
		const highlights = colorsForTimes([1, 2] as Time[], even);
		expect(updateLastColor(highlights, 4, 4 as Time, even)).to.equal(false);
		expect(highlights).to.have.length(2);
	});
});

void describe('shrinkTo', () => {
	void it('drops the popped bars and keeps the rest untouched', () => {
		const highlights = colorsForTimes([1, 2, 3, 4] as Time[], even);
		expect(shrinkTo(highlights, 2, 2 as Time)).to.equal(true);
		expect(highlights).to.deep.equal([{ timestamp: 1, color: '' }, { timestamp: 2, color: 'red' }]);
	});

	void it('empties the list when every bar was popped', () => {
		const highlights = colorsForTimes([1, 2] as Time[], even);
		expect(shrinkTo(highlights, 0, 2 as Time)).to.equal(true);
		expect(highlights).to.deep.equal([]);
	});

	void it('refuses when a bar went missing from the middle', () => {
		const highlights = colorsForTimes([1, 2, 3, 4] as Time[], even);
		// Bar 3 became whitespace, so the data is now [1, 2, 4] and ends in 4.
		expect(shrinkTo(highlights, 3, 4 as Time)).to.equal(false);
		expect(highlights).to.have.length(4);
	});
});

void describe('visibleDataRange', () => {
	// Ten bars whose logical indices are 100..109: another series starts
	// earlier, so data index and logical index differ.
	const indexAt = (i: number) => 100 + i;

	void it('maps a logical range to the data indices it covers, one bar of slack each side', () => {
		expect(visibleDataRange(10, indexAt, { from: 102.4, to: 105.6 })).to.deep.equal({ from: 1, to: 8 });
	});

	void it('clamps to the data', () => {
		expect(visibleDataRange(10, indexAt, { from: -5, to: 500 })).to.deep.equal({ from: 0, to: 10 });
	});

	void it('is empty when the range lies entirely outside the data', () => {
		expect(visibleDataRange(10, indexAt, { from: 200, to: 210 })).to.deep.equal({ from: 10, to: 10 });
		expect(visibleDataRange(10, indexAt, { from: 0, to: 50 })).to.deep.equal({ from: 0, to: 0 });
	});

	void it('is empty for no data or no range', () => {
		expect(visibleDataRange(0, indexAt, { from: 0, to: 10 })).to.deep.equal({ from: 0, to: 0 });
		expect(visibleDataRange(10, indexAt, null)).to.deep.equal({ from: 0, to: 0 });
	});
});
