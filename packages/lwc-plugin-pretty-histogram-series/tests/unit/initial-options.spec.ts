import { expect } from 'chai';
import { it } from 'node:test';
import { PrettyHistogramSeries, defaultOptions } from '../../src/pretty-histogram-series';

void it('measures current scaling options before any renderer update', () => {
	const options: typeof defaultOptions = { ...defaultOptions, ...{ base: 100 } };
	const view = new PrettyHistogramSeries(() => options);
	const values = view.priceValueBuilder({ time: '2024-01-01', value: 30 });
	expect(Math.min(...values)).to.equal(Math.min(...[30, 100]));
	expect(Math.max(...values)).to.equal(Math.max(...[30, 100]));
});
