import { expect } from 'chai';
import { describe, it } from 'node:test';

import {
	addAmounts,
	edgeSpan,
	fitsInside,
	gapSpan,
	hasDrawnCell,
	heatmapPlotValues,
	insetSpan,
	isDrawnCell,
	nearestCell,
} from '../../src/geometry';

void describe('isDrawnCell', () => {
	void it('draws a cell with finite edges and amount only', () => {
		expect(isDrawnCell({ low: 0, high: 1, amount: 2 })).to.equal(true);
		expect(isDrawnCell({ low: 1, high: 0, amount: 0 })).to.equal(true);
		expect(isDrawnCell(null)).to.equal(false);
		expect(isDrawnCell(undefined)).to.equal(false);
		expect(isDrawnCell({ low: 0, high: Infinity, amount: 2 })).to.equal(false);
		expect(isDrawnCell({ low: 0, high: 1, amount: NaN })).to.equal(false);
		expect(isDrawnCell({ low: '0', high: 1, amount: 2 } as never)).to.equal(false);
	});
});

void describe('hasDrawnCell', () => {
	void it('needs an array holding a drawn cell', () => {
		expect(hasDrawnCell([null, { low: 0, high: 1, amount: 2 }])).to.equal(true);
		expect(hasDrawnCell([null, { low: 0, high: 1, amount: NaN }])).to.equal(false);
		expect(hasDrawnCell([])).to.equal(false);
		expect(hasDrawnCell(null)).to.equal(false);
		expect(hasDrawnCell(undefined)).to.equal(false);
		expect(hasDrawnCell('cells')).to.equal(false);
	});
});

void describe('heatmapPlotValues', () => {
	void it('spans the lowest and the highest edge, whichever field holds it, with the middle last', () => {
		expect(heatmapPlotValues([{ low: 10, high: 20, amount: 1 }, { low: 70, high: 60, amount: 1 }])).to.deep.equal([10, 70, 40]);
	});

	void it('leaves out cells that are not drawn', () => {
		expect(heatmapPlotValues([
			{ low: 10, high: 20, amount: 1 },
			{ low: Infinity, high: 5, amount: 1 },
			{ low: -100, high: -90, amount: NaN },
			null,
		])).to.deep.equal([10, 20, 15]);
	});

	void it('is NaN for a column with nothing to draw, which keeps it out of the price scale', () => {
		expect(heatmapPlotValues([null])).to.have.length(1);
		expect(heatmapPlotValues([null])[0]).to.be.NaN;
		expect(heatmapPlotValues(null)[0]).to.be.NaN;
	});
});

void describe('addAmounts', () => {
	void it('widens a range over the drawn cells of several columns', () => {
		let range = addAmounts(null, [{ low: 0, high: 1, amount: 5 }, null, { low: 0, high: 1, amount: NaN }]);
		expect(range).to.deep.equal({ min: 5, max: 5 });
		range = addAmounts(range, [{ low: 0, high: 1, amount: -2 }, { low: 0, high: 1, amount: 9 }]);
		expect(range).to.deep.equal({ min: -2, max: 9 });
	});

	void it('stays null with no drawn cell', () => {
		expect(addAmounts(null, [null, { low: 0, high: NaN, amount: 1 }])).to.equal(null);
	});
});

void describe('edgeSpan', () => {
	void it('rounds each edge on its own, so cells that share an edge abut', () => {
		const upper = edgeSpan(10.4, 20.6, 1.5);
		const lower = edgeSpan(20.6, 33.3, 1.5);
		expect(upper.position + upper.length).to.equal(lower.position);
	});

	void it('takes the edges in either order', () => {
		expect(edgeSpan(20, 10, 1)).to.deep.equal(edgeSpan(10, 20, 1));
	});
});

void describe('fitsInside', () => {
	void it('needs a cell more than three times the width, before rounding', () => {
		expect(fitsInside(3.5, 1)).to.equal(true);
		expect(fitsInside(3, 1)).to.equal(false);
		expect(fitsInside(7, 2)).to.equal(true);
		expect(fitsInside(100, 0)).to.equal(false);
	});
});

void describe('gapSpan', () => {
	void it('takes the gap off half at each end, so two spans that abut end up the gap apart', () => {
		const first = gapSpan({ position: 0, length: 10 }, 3);
		const second = gapSpan({ position: 10, length: 10 }, 3);
		expect(first).to.deep.equal({ position: 1, length: 7 });
		expect(second.position - (first.position + first.length)).to.equal(3);
	});

	void it('keeps at least a pixel, and leaves the span alone with no gap', () => {
		expect(gapSpan({ position: 0, length: 2 }, 3)).to.deep.equal({ position: 1, length: 1 });
		expect(gapSpan({ position: 0, length: 4 }, 0)).to.deep.equal({ position: 0, length: 4 });
	});
});

void describe('insetSpan', () => {
	void it('shrinks a span at both ends', () => {
		expect(insetSpan({ position: 0, length: 10 }, 2)).to.deep.equal({ position: 2, length: 6 });
	});

	void it('never turns a short span negative', () => {
		// A cell shorter than twice the border used to get a negative height.
		expect(insetSpan({ position: 5, length: 3 }, 2)).to.deep.equal({ position: 7, length: 1 });
		expect(insetSpan({ position: 5, length: 3 }, 0)).to.deep.equal({ position: 5, length: 3 });
	});
});

void describe('nearestCell', () => {
	// Prices map to y = 100 - price, as on a chart.
	const toY = (price: number): number => 100 - price;
	const cells = [{ low: 20, high: 30, amount: 1 }, null, { low: 0, high: 10, amount: 1 }, { low: 10, high: 20, amount: NaN }];

	void it('reports the cell under the pointer at distance 0', () => {
		expect(nearestCell(cells, 75, toY)).to.deep.equal({ index: 0, distance: 0 });
	});

	void it('reports the nearer cell across a hole, at its distance', () => {
		expect(nearestCell(cells, 88, toY)).to.deep.equal({ index: 2, distance: 2 });
	});

	void it('prefers the cell listed later at the same distance', () => {
		expect(nearestCell([{ low: 0, high: 10, amount: 1 }, { low: 0, high: 10, amount: 2 }], 95, toY)).to.deep.equal({ index: 1, distance: 0 });
	});

	void it('skips cells whose edges cannot be placed', () => {
		expect(nearestCell(cells, 75, () => null)).to.equal(null);
	});
});
