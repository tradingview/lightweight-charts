import { expect } from 'chai';
import { describe, it } from 'node:test';

import { HeatmapSeries, defaultOptions } from '../../src/heatmap-series';
import { orderBookData, priceData, profileData } from '../../src/example/sample-data';

void describe('HeatmapSeries', () => {
	void it('treats a point with no cell to draw as whitespace, null cells included', () => {
		const view = new HeatmapSeries();
		expect(view.isWhitespace({ time: '2024-01-01' })).to.equal(true);
		expect(view.isWhitespace({ time: '2024-01-01', cells: [] })).to.equal(true);
		expect(view.isWhitespace({ time: '2024-01-01', cells: null } as never)).to.equal(true);
		expect(view.isWhitespace({ time: '2024-01-01', cells: [{ low: 0, high: 1, amount: 1 }] })).to.equal(false);
		expect(view.isWhitespace({ time: '2024-01-01', cells: [null, { low: 0, high: 1, amount: NaN }] })).to.equal(true);
	});

	void it('has no conflation reducer, so the chart never merges columns', () => {
		expect((new HeatmapSeries() as { conflationReducer?: unknown }).conflationReducer).to.equal(undefined);
	});

	void it('hides the price line and the last value label by default', () => {
		expect(defaultOptions.lastValueVisible).to.equal(false);
		expect(defaultOptions.priceLineVisible).to.equal(false);
	});

	void it('ramps the default shader from faint at 0 to opaque at 100', () => {
		const range = { min: 0, max: 100 };
		expect(defaultOptions.cellShader(0, range)).to.equal('rgba(0, 100, 0, 0.2)');
		expect(defaultOptions.cellShader(50, range)).to.equal('rgba(0, 178, 50, 0.6)');
		expect(defaultOptions.cellShader(100, range)).to.equal('rgba(0, 255, 100, 1)');
		expect(defaultOptions.cellShader(500, range)).to.equal('rgba(0, 255, 100, 1)');
		// The amount is rounded, so the shader returns at most 101 colors.
		expect(defaultOptions.cellShader(49.6, range)).to.equal(defaultOptions.cellShader(50, range));
	});
});

void describe('sample data', () => {
	void it('is the same on every load', () => {
		expect(profileData(priceData(20))).to.deep.equal(profileData(priceData(20)));
		expect(orderBookData(30)).to.deep.equal(orderBookData(30));
		expect(orderBookData(30, 4)).to.not.deep.equal(orderBookData(30));
	});

	void it('gives every order book column the same number of levels around the mid price', () => {
		const { mid, book } = orderBookData(50, 3, 10, 0.5);
		book.forEach((column, i) => {
			expect(column.cells).to.have.length(20);
			const lows = column.cells.map(cell => cell?.low ?? NaN);
			expect(Math.min(...lows)).to.be.at.most(mid[i].value);
			expect(Math.max(...lows) + 0.5).to.be.at.least(mid[i].value);
		});
	});
});
