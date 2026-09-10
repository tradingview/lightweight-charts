import { expect } from 'chai';
import { describe, it } from 'node:test';

import {
	calculateColumnPositions,
	calculateColumnPositionsInPlace,
	ColumnPosition,
	ColumnPositionItem,
} from '../../src/dimensions/columns.js';

function evenlySpacedX(count: number, barSpacing: number): number[] {
	return Array.from({ length: count }, (_: unknown, i: number) => i * barSpacing);
}

function widths(positions: ColumnPosition[]): number[] {
	// width is inclusive of both edges: right - left + 1
	return positions.map((p: ColumnPosition) => p.right - p.left + 1);
}

function gaps(positions: ColumnPosition[]): number[] {
	const result: number[] = [];
	for (let i = 1; i < positions.length; i++) {
		result.push(positions[i].left - positions[i - 1].right - 1);
	}
	return result;
}

void describe('calculateColumnPositions', () => {
	void it('width is inclusive: right - left + 1', () => {
		const positions = calculateColumnPositions([10], 6, 1);
		expect(positions[0]).to.deep.equal({
			left: 8,
			right: 12,
			shiftLeft: false,
		});
		expect(positions[0].right - positions[0].left + 1).to.equal(5);
	});

	void it('reserves a one bitmap pixel gap at pixel ratio 1 (barSpacing 6)', () => {
		const positions = calculateColumnPositions(evenlySpacedX(4, 6), 6, 1);
		expect(positions.map((p: ColumnPosition) => p.left)).to.deep.equal([
			-2, 4, 10, 16,
		]);
		expect(widths(positions)).to.deep.equal([5, 5, 5, 5]);
		expect(gaps(positions)).to.deep.equal([1, 1, 1]);
	});

	void it('scales width and gap by the pixel ratio (barSpacing 6, DPR 2)', () => {
		const positions = calculateColumnPositions(evenlySpacedX(4, 6), 6, 2);
		expect(widths(positions)).to.deep.equal([10, 10, 10, 10]);
		expect(gaps(positions)).to.deep.equal([2, 2, 2]);
	});

	void it('keeps gaps consistent but not widths at a fractional pixel ratio (barSpacing 6, DPR 1.25)', () => {
		const positions = calculateColumnPositions(evenlySpacedX(4, 6), 6, 1.25);
		// gap stays at floor(1.25) === 1 everywhere...
		expect(gaps(positions)).to.deep.equal([1, 1, 1]);
		// ...but the widths are not all equal: the second column is a pixel narrower.
		expect(widths(positions)).to.deep.equal([7, 6, 7, 7]);
	});

	void it('drops the gap entirely once a bar is one bitmap pixel wide or less', () => {
		// columnSpacing() returns 0 when ceil(barSpacing * dpr) <= 1
		const positions = calculateColumnPositions(evenlySpacedX(4, 1), 1, 1);
		expect(widths(positions)).to.deep.equal([1, 1, 1, 1]);
		expect(gaps(positions)).to.deep.equal([0, 0, 0]);
	});

	void it('lets columns overlap at sub-pixel bar spacing (barSpacing 0.5, DPR 1)', () => {
		const positions = calculateColumnPositions(evenlySpacedX(4, 0.5), 0.5, 1);
		// two adjacent columns land on exactly the same bitmap pixel
		expect(positions[1]).to.deep.equal({
			left: 1,
			right: 1,
			shiftLeft: true,
		});
		expect(positions[2]).to.deep.equal({
			left: 1,
			right: 1,
			shiftLeft: false,
		});
		expect(gaps(positions)).to.deep.equal([0, -1, 0]);
	});

	void it('never lets adjacent columns overlap while a gap is reserved', () => {
		for (const barSpacing of [2, 2.6, 4, 6, 6.5, 10, 13.3]) {
			for (const dpr of [1, 1.25, 2, 3]) {
				const positions = calculateColumnPositions(
					evenlySpacedX(8, barSpacing),
					barSpacing,
					dpr
				);
				for (const gap of gaps(positions)) {
					expect(gap, `barSpacing ${barSpacing} dpr ${dpr}`).to.be.at.least(1);
				}
			}
		}
	});

	void it('keeps every gap identical when the narrow-column pass does not run', () => {
		for (const barSpacing of [4, 6, 6.5, 10, 13.3]) {
			for (const dpr of [1, 1.25, 2, 3]) {
				const positions = calculateColumnPositions(
					evenlySpacedX(8, barSpacing),
					barSpacing,
					dpr
				);
				expect(
					new Set(gaps(positions)).size,
					`barSpacing ${barSpacing} dpr ${dpr}`
				).to.equal(1);
			}
		}
	});

	void it('gaps become uneven once the narrow-column pass runs (barSpacing 2.6, DPR 1)', () => {
		// Questionable, but current behaviour: trimming every column to the 1px
		// minimum widens some of the gaps.
		const positions = calculateColumnPositions(evenlySpacedX(8, 2.6), 2.6, 1);
		expect(widths(positions)).to.deep.equal([1, 1, 1, 1, 1, 1, 1, 1]);
		expect(gaps(positions)).to.deep.equal([1, 2, 1, 2, 2, 1, 2]);
	});

	void it('narrows every column to the smallest width when that width is under 4px', () => {
		// barSpacing 2.6 produces a mix of 1px and 2px columns; the narrow-column
		// pass then trims all of them down to the 1px minimum.
		const positions = calculateColumnPositions(evenlySpacedX(4, 2.6), 2.6, 1);
		expect(widths(positions)).to.deep.equal([1, 1, 1, 1]);
		expect(positions.map((p: ColumnPosition) => p.left)).to.deep.equal([
			0, 2, 5, 7,
		]);
	});

	void it('does not run the narrow-column pass once the minimum width reaches 4px', () => {
		const positions = calculateColumnPositions(evenlySpacedX(4, 6), 6, 1.25);
		// minimum width here is 6, so the mixed 7/6 widths are left as they are
		expect(widths(positions)).to.include(7);
	});

	void it('returns a new array of the same length as the input', () => {
		const xs = evenlySpacedX(5, 6);
		const positions = calculateColumnPositions(xs, 6, 1);
		expect(positions).to.have.length(5);
		expect(xs).to.deep.equal(evenlySpacedX(5, 6));
	});

	void it('returns an empty array for no bars', () => {
		expect(calculateColumnPositions([], 6, 1)).to.deep.equal([]);
	});
});

void describe('calculateColumnPositionsInPlace', () => {
	function items(count: number, barSpacing: number): ColumnPositionItem[] {
		return evenlySpacedX(count, barSpacing).map((x: number) => ({ x }));
	}

	void it('mutates the items, attaching a column to each visible bar', () => {
		const bars = items(4, 6);
		calculateColumnPositionsInPlace(bars, 6, 1, 0, 4);
		expect(bars.map((item: ColumnPositionItem) => item.column)).to.deep.equal(
			calculateColumnPositions(evenlySpacedX(4, 6), 6, 1)
		);
		// the x values are untouched
		expect(bars.map((item: ColumnPositionItem) => item.x)).to.deep.equal(
			evenlySpacedX(4, 6)
		);
	});

	void it('treats endIndex as exclusive when calculating positions', () => {
		const bars = items(6, 6);
		calculateColumnPositionsInPlace(bars, 6, 1, 1, 4);
		expect(bars[3].column).to.not.equal(undefined);
		// endIndex 4 is NOT given a column
		expect(bars[4].column).to.equal(undefined);
	});

	void it('leaves items before startIndex untouched', () => {
		const bars = items(6, 6);
		calculateColumnPositionsInPlace(bars, 6, 1, 2, 5);
		expect(bars[0].column).to.equal(undefined);
		expect(bars[1].column).to.equal(undefined);
		expect(bars[2].column).to.not.equal(undefined);
	});

	void it('clamps endIndex to the length of the items array', () => {
		const bars = items(6, 6);
		calculateColumnPositionsInPlace(bars, 6, 1, 0, 100);
		expect(
			bars.every((item: ColumnPositionItem) => item.column !== undefined)
		).to.equal(true);
	});

	void it('starts a fresh run of positions from startIndex, ignoring earlier columns', () => {
		const all = items(6, 6);
		calculateColumnPositionsInPlace(all, 6, 1, 0, 6);
		const partial = items(6, 6);
		calculateColumnPositionsInPlace(partial, 6, 1, 2, 6);
		// bars 2..5 get the same positions either way, because the alignment
		// correction only ever looks at the previous *calculated* bar.
		expect(partial[2].column).to.deep.equal(all[2].column);
		expect(partial[5].column).to.deep.equal(all[5].column);
	});

	void it('shiftLeft records whether the centre was rounded up', () => {
		const bars = items(4, 2.6);
		calculateColumnPositionsInPlace(bars, 2.6, 1, 0, 4);
		expect(
			bars.map((item: ColumnPositionItem) => item.column?.shiftLeft)
		).to.deep.equal([false, true, false, true]);
	});

	void it('narrow-column pass treats endIndex as INCLUSIVE, so it can touch a stale column at endIndex', () => {
		// Questionable: the position loop stops before endIndex, but the
		// min-width / narrow-column passes guard with `index > endIndex`, so a
		// column left over from an earlier call at exactly endIndex is both
		// measured and mutated.
		const bars = items(4, 2.6);
		bars[2].column = { left: 100, right: 105, shiftLeft: false };
		calculateColumnPositionsInPlace(bars, 2.6, 1, 0, 2);
		expect(bars[2].column).to.deep.equal({
			left: 101,
			right: 105,
			shiftLeft: false,
		});
	});

	void it('leaves a stale column above endIndex alone', () => {
		const bars = items(4, 2.6);
		bars[3].column = { left: 100, right: 105, shiftLeft: false };
		calculateColumnPositionsInPlace(bars, 2.6, 1, 0, 2);
		expect(bars[3].column).to.deep.equal({
			left: 100,
			right: 105,
			shiftLeft: false,
		});
	});

	void it('collapses right onto left rather than allowing a negative width', () => {
		const bars: ColumnPositionItem[] = [{ x: 10 }];
		bars[0].column = { left: 20, right: 5, shiftLeft: false };
		// startIndex above the item keeps the position loop from overwriting it,
		// but the fixing pass still runs over index 0.
		calculateColumnPositionsInPlace(bars, 6, 1, 0, 0);
		expect(bars[0].column).to.deep.equal({
			left: 20,
			right: 20,
			shiftLeft: false,
		});
	});
});
