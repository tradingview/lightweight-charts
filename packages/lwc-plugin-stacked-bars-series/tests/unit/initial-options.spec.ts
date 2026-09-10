import { expect } from 'chai';
import { it } from 'node:test';
import { StackedBarsSeries, defaultOptions } from '../../src/stacked-bars-series';

void it('measures current scaling options before any renderer update', () => {
	const options: typeof defaultOptions = { ...defaultOptions, ...{ stackOrder: 'reverse', base: 50 } };
	const view = new StackedBarsSeries(() => options);
	const values = view.priceValueBuilder({ time: '2024-01-01', values: [10, -20] });
	expect(Math.min(...values)).to.equal(Math.min(...[30, 40, 50]));
	expect(Math.max(...values)).to.equal(Math.max(...[30, 40, 50]));
});
