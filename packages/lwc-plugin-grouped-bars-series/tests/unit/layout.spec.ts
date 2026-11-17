import { expect } from 'chai';
import { describe, it } from 'node:test';

import { ColumnSpan, groupWidth, splitGroup } from '../../src/layout';
import { defaultOptions } from '../../src/options';

function expectTiled(spans: ColumnSpan[], left: number, width: number): void {
	expect(spans[0].left).to.equal(left);
	for (let i = 1; i < spans.length; i++) {
		expect(spans[i].left, `column ${i} starts where column ${i - 1} ends`).to.equal(spans[i - 1].left + spans[i - 1].width);
	}
	const last = spans[spans.length - 1];
	expect(last.left + last.width).to.equal(left + width);
	const widths = spans.map(span => span.width);
	expect(Math.max(...widths) - Math.min(...widths)).to.be.at.most(1);
}

void describe('splitGroup', () => {
	void it('splits an even width into equal columns', () => {
		expect(splitGroup(10, 30, 3)).to.deep.equal([
			{ left: 10, width: 10 },
			{ left: 20, width: 10 },
			{ left: 30, width: 10 },
		]);
	});

	void it('tiles a width that does not divide evenly, with no seam and no overlap', () => {
		for (const [width, count] of [[31, 3], [32, 3], [17, 4], [9, 5], [101, 7]]) {
			const spans = splitGroup(5, width, count);
			expect(spans).to.have.length(count);
			expectTiled(spans, 5, width);
		}
	});

	void it('gives every column one pixel when the group is narrower than one pixel per column', () => {
		const spans = splitGroup(10, 2, 4);
		expect(spans).to.have.length(4);
		for (const span of spans) {
			expect(span.width).to.equal(1);
			expect(span.left).to.be.within(10, 11);
		}
	});

	void it('draws a group of zero width as one pixel', () => {
		expect(splitGroup(10, 0, 1)).to.deep.equal([{ left: 10, width: 1 }]);
	});

	void it('returns no columns for a point without values', () => {
		expect(splitGroup(10, 30, 0)).to.deep.equal([]);
	});

	void it('keeps all five columns of a group three pixels wide', () => {
		// A bar spacing of 4 at pixel ratio 1 gives a 3 px group by default,
		// where the example drew three of five columns.
		const spans = splitGroup(100, 3, 5);
		expect(spans).to.deep.equal([
			{ left: 100, width: 1 },
			{ left: 100, width: 1 },
			{ left: 101, width: 1 },
			{ left: 101, width: 1 },
			{ left: 102, width: 1 },
		]);
	});
});

void describe('groupWidth', () => {
	void it('is the given share of the bar spacing in percent mode', () => {
		expect(groupWidth({ columnWidthMode: 'percent', widthPercent: 80 }, 20)).to.equal(16);
	});

	void it('clamps the percentage to 0–100', () => {
		expect(groupWidth({ columnWidthMode: 'percent', widthPercent: 150 }, 20)).to.equal(20);
		expect(groupWidth({ columnWidthMode: 'percent', widthPercent: -10 }, 20)).to.equal(0);
	});

	void it('falls back to the default percentage when it is not a finite number', () => {
		expect(groupWidth({ columnWidthMode: 'percent', widthPercent: NaN }, 20)).to.equal((20 * defaultOptions.widthPercent) / 100);
	});

	void it('is the whole bar spacing in histogram mode, whatever the percentage', () => {
		expect(groupWidth({ columnWidthMode: 'histogram', widthPercent: 10 }, 20)).to.equal(20);
	});
});

