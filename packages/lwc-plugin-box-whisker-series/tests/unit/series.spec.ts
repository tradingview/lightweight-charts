import { expect } from 'chai';
import { describe, it } from 'node:test';

import { BoxWhiskerSeries } from '../../src/box-whisker-series';

void describe('BoxWhiskerSeries', () => {
	const point = { time: '2024-01-01', min: 10, q1: 20, median: 30, q3: 40, max: 50, outliers: [99, 2] };

	void it('autoscales on the whiskers and the outliers, with the median last', () => {
		// The example left the outliers out, so a dot beyond the scale was cut off.
		expect(new BoxWhiskerSeries().priceValueBuilder(point)).to.deep.equal([50, 10, 99, 2, 30]);
		expect(new BoxWhiskerSeries().priceValueBuilder({ ...point, outliers: null })).to.deep.equal([50, 10, 30]);
	});

	void it('treats a point without five finite numbers as whitespace', () => {
		const view = new BoxWhiskerSeries();
		expect(view.isWhitespace({ time: '2024-01-01' })).to.equal(true);
		expect(view.isWhitespace({ ...point, q1: null } as never)).to.equal(true);
		expect(view.isWhitespace({ ...point, median: NaN })).to.equal(true);
		expect(view.isWhitespace({ ...point, max: Infinity })).to.equal(true);
		expect(view.isWhitespace(point)).to.equal(false);
	});

	void it('has no conflation reducer, so the chart never conflates it', () => {
		expect('conflationReducer' in new BoxWhiskerSeries()).to.equal(false);
	});
});
