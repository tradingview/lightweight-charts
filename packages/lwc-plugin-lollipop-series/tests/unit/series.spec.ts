import { expect } from 'chai';
import { describe, it } from 'node:test';

import { LollipopSeries, defaultOptions } from '../../src/lollipop-series';

void describe('LollipopSeries', () => {
	void it('reads the current base before any renderer update', () => {
		const options = { ...defaultOptions, base: 100 };
		const view = new LollipopSeries(() => options);
		expect(view.priceValueBuilder({ time: '2024-01-01', value: 30 })).to.deep.equal([100, 30]);
	});

	void it('reports the value last, so the price line and the last value label follow it', () => {
		const view = new LollipopSeries();
		const values = view.priceValueBuilder({ time: '2024-01-01', value: -7 });
		expect(values[values.length - 1]).to.equal(-7);
	});

	void it('treats a point without a finite value as whitespace', () => {
		const view = new LollipopSeries();
		expect(view.isWhitespace({ time: '2024-01-01' })).to.equal(true);
		expect(view.isWhitespace({ time: '2024-01-01', value: 0 })).to.equal(false);
		expect(view.isWhitespace({ time: '2024-01-01', value: null } as never)).to.equal(true);
		expect(view.isWhitespace({ time: '2024-01-01', value: NaN })).to.equal(true);
	});

	void it('has no conflation reducer, so the chart never conflates it', () => {
		expect('conflationReducer' in new LollipopSeries()).to.equal(false);
	});
});
