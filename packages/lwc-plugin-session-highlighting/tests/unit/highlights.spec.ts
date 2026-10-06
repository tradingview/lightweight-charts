import { expect } from 'chai';
import { describe, it } from 'node:test';
import type { Time } from 'lightweight-charts';

import { colorsForTimes, updateLastColor, visibleDataRange } from '../../src/highlights.js';

const even = (time: Time) => ((time as number) % 2 === 0 ? 'red' : '');

void describe('colorsForTimes', () => {
	void it('asks the highlighter for every time, in order', () => {
		const result = colorsForTimes([1, 2, 3] as Time[], even);
		expect(result).to.deep.equal([
			{ time: 1, color: '' },
			{ time: 2, color: 'red' },
			{ time: 3, color: '' },
		]);
	});

	void it('returns an empty list for no data', () => {
		expect(colorsForTimes([], even)).to.deep.equal([]);
	});
});

void describe('updateLastColor', () => {
	void it('replaces the last entry when the time is the same', () => {
		const highlights = colorsForTimes([1, 2] as Time[], even);
		updateLastColor(highlights, 2 as Time, () => 'blue');
		expect(highlights).to.deep.equal([{ time: 1, color: '' }, { time: 2, color: 'blue' }]);
	});

	void it('appends when the time is new', () => {
		const highlights = colorsForTimes([1, 2] as Time[], even);
		updateLastColor(highlights, 4 as Time, even);
		expect(highlights).to.have.length(3);
		expect(highlights[2]).to.deep.equal({ time: 4, color: 'red' });
	});

	void it('appends to an empty list', () => {
		const highlights = colorsForTimes([], even);
		updateLastColor(highlights, 4 as Time, even);
		expect(highlights).to.deep.equal([{ time: 4, color: 'red' }]);
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
