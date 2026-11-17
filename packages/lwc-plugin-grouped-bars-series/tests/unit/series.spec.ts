import { expect } from 'chai';
import { describe, it } from 'node:test';

import { GroupedBarsData, GroupedBarsSeries, defaultOptions } from '../../src/grouped-bars-series';

interface GroupedBarsHitTest {
	hitTest(x: number, y: number, priceToCoordinate: (price: number) => number | null): { objectId?: string } | null;
}

void describe('GroupedBarsSeries', () => {
	void it('reads the current base before any renderer update', () => {
		const options = { ...defaultOptions, base: 50 };
		const view = new GroupedBarsSeries(() => options);
		expect(view.priceValueBuilder({ time: '2024-01-01', values: [10, 70] })).to.deep.equal([50, 10, 70]);
	});

	void it('leaves null, non-finite values and values equal to the base out of the autoscale range', () => {
		const view = new GroupedBarsSeries();
		expect(view.priceValueBuilder({ time: '2024-01-01', values: [10, NaN, null, Infinity, 0, 30] })).to.deep.equal([0, 10, 30]);
	});

	void it('reads a base which is not a finite number as 0', () => {
		const options = { ...defaultOptions, base: NaN };
		const view = new GroupedBarsSeries(() => options);
		expect(view.priceValueBuilder({ time: '2024-01-01', values: [10] })).to.deep.equal([0, 10]);
	});

	void it('reports the last value of the group last, for the price line', () => {
		const view = new GroupedBarsSeries();
		const values = view.priceValueBuilder({ time: '2024-01-01', values: [10, -20, 5] });
		expect(values[values.length - 1]).to.equal(5);
	});

	void it('treats a point with no values as whitespace', () => {
		const view = new GroupedBarsSeries();
		expect(view.isWhitespace({ time: '2024-01-01' })).to.equal(true);
		expect(view.isWhitespace({ time: '2024-01-01', values: [] })).to.equal(true);
		expect(view.isWhitespace({ time: '2024-01-01', values: [3] })).to.equal(false);
		expect(view.isWhitespace({ time: '2024-01-01', values: [null, NaN] })).to.equal(true);
	});

	void it('treats a point whose values all equal the base as whitespace', () => {
		const view = new GroupedBarsSeries(() => ({ ...defaultOptions, base: 5 }));
		expect(view.isWhitespace({ time: '2024-01-01', values: [5, 5] })).to.equal(true);
		expect(view.isWhitespace({ time: '2024-01-01', values: [0] })).to.equal(false);
	});

	void it('has no conflation reducer, so the chart never conflates it', () => {
		expect('conflationReducer' in new GroupedBarsSeries()).to.equal(false);
	});

	void it('counts the columns when it is drawn, after the series has committed new data', () => {
		// The chart updates the view while setData runs, before the series
		// commits the data it counts the columns of; a count taken then would
		// still be 3, and the fourth column could not be hovered.
		const three = { time: '2024-01-01', values: [10, 20, 30] };
		const four = { time: '2024-01-02', values: [10, 20, 30, 40] };
		const input = { points: [three], revision: 1 };
		const view = new GroupedBarsSeries(undefined, () => input);
		const bar = (x: number, data: GroupedBarsData) => ({ x, time: x, barColor: '#000000', originalData: data });
		const data = { bars: [bar(60, three), bar(100, four)], barSpacing: 40, visibleRange: { from: 0, to: 2 }, conflationFactor: 1 };
		view.update(data as never, defaultOptions);
		input.points.push(four);
		input.revision = 2;
		// The group spans 84 to 116: four columns of 8 px, the last from 108.
		const hit = (view.renderer() as never as GroupedBarsHitTest).hitTest(112, 180, (price: number) => 200 - price);
		expect(hit?.objectId).to.equal('column-1-3');
	});
});
