import { expect } from 'chai';
import { describe, it } from 'node:test';

import { BackgroundShadeSeries, defaultOptions } from '../../src/background-shade-series';

void describe('BackgroundShadeSeries', () => {
	void it('takes no part in the price scale', () => {
		const view = new BackgroundShadeSeries();
		const values = view.priceValueBuilder({ time: '2024-01-01', value: 42 });
		expect(values).to.have.length(1);
		expect(Number.isNaN(values[0])).to.equal(true);
	});

	void it('treats a point without a value as whitespace', () => {
		const view = new BackgroundShadeSeries();
		expect(view.isWhitespace({ time: '2024-01-01' })).to.equal(true);
		expect(view.isWhitespace({ time: '2024-01-01', value: 0 })).to.equal(false);
	});

	void it('hides the price line and the last value label by default', () => {
		expect(defaultOptions.priceLineVisible).to.equal(false);
		expect(defaultOptions.lastValueVisible).to.equal(false);
	});

	void it('sits on a price scale of its own by default', () => {
		expect(defaultOptions.priceScaleId).to.equal('background-shade');
	});

	void it('keeps the later point when the chart conflates two', () => {
		const view = new BackgroundShadeSeries();
		const later = { time: '2024-01-02', value: 2 };
		expect(view.conflationReducer({ data: { time: '2024-01-01', value: 1 } }, { data: later })).to.equal(later);
	});
});
