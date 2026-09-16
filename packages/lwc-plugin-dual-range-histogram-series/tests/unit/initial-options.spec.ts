import { expect } from 'chai';
import { it } from 'node:test';
import { DualRangeHistogramSeries, defaultOptions } from '../../src/dual-range-histogram-series';

void it('measures current scaling options before any renderer update', () => {
	const options: typeof defaultOptions = { ...defaultOptions, ...{ scaleMode: 'price', baseValue: 50 } };
	const view = new DualRangeHistogramSeries(() => options);
	const values = view.priceValueBuilder({ time: '2024-01-01', values: [20, -10] });
	expect(Math.min(...values)).to.equal(Math.min(...[40, 50, 70]));
	expect(Math.max(...values)).to.equal(Math.max(...[40, 50, 70]));
});
