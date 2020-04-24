import { expect } from 'chai';
import { describe, it } from 'mocha';

import { Coordinate } from '../../src/model/coordinate';
import { RangeImpl } from '../../src/model/range-impl';
import { TimePointIndex, visibleTimedValues } from '../../src/model/time-data';

// TODO: add tests for marks spans

function visibleTimedValuesCase(
	rangeFrom: number,
	rangeTo: number,
	extendedRange: boolean,
	expectedFrom: number,
	expectedTo: number,
	times: number[]
): void {
	const barsRange = new RangeImpl(rangeFrom as TimePointIndex, rangeTo as TimePointIndex);
	const timedData = times.map((t: number) => {
		return { time: t as TimePointIndex, x: 0 as Coordinate };
	});
	const actual = visibleTimedValues(timedData, barsRange, extendedRange);
	const expected = { from: expectedFrom, to: expectedTo };
	expect(actual).to.be.deep.equal(expected);
}

describe('TimedData', () => {
	it('visibleTimedValues', () => {
		visibleTimedValuesCase(1, 3, false, 0, 0, []);
		visibleTimedValuesCase(1, 3, false, 0, 1, [1]);
		visibleTimedValuesCase(1, 3, false, 0, 2, [1, 2, 5]);
		visibleTimedValuesCase(1, 3, false, 1, 2, [-1, 2, 5]);
		visibleTimedValuesCase(1, 3, false, 1, 1, [-1, 5]);
		visibleTimedValuesCase(1, 3, false, 0, 0, [4, 5]);
		visibleTimedValuesCase(1, 3, false, 2, 2, [-2, -1]);
	});

	it('visibleTimedValues with exteded range', () => {
		visibleTimedValuesCase(1, 3, true, 0, 0, []);
		visibleTimedValuesCase(1, 3, true, 0, 1, [1]);
		visibleTimedValuesCase(1, 3, true, 0, 3, [1, 2, 5]);
		visibleTimedValuesCase(1, 3, true, 1, 4, [-2, -1, 2, 5, 6]);
	});
});
