import { expect } from 'chai';
import { describe, it } from 'node:test';

import { positionsBox, positionsLine } from '../../src/dimensions/positions.js';

void describe('positionsLine', () => {
	void it('centres an odd width on the pixel', () => {
		const { position, length } = positionsLine(10, 1, 3);
		expect(length).to.equal(3);
		expect(position).to.equal(9);
	});

	void it('scales the width by the pixel ratio', () => {
		expect(positionsLine(10, 2, 1).length).to.equal(2);
	});

	void it('defaults the desired width to one media pixel', () => {
		expect(positionsLine(10, 1)).to.deep.equal({ position: 10, length: 1 });
		expect(positionsLine(10, 2)).to.deep.equal({ position: 19, length: 2 });
	});

	void it('biases an even width towards the lower coordinate', () => {
		// centreOffset floors: offset for width 4 is 2, so the line covers 8..11
		expect(positionsLine(10, 1, 4)).to.deep.equal({ position: 8, length: 4 });
	});

	void it('rounds the width up at DPR 1.25, giving 3 bitmap pixels for a 2px line', () => {
		// round(2 * 1.25) === 3, not 2
		expect(positionsLine(10, 1.25, 2)).to.deep.equal({
			position: 12,
			length: 3,
		});
	});

	void it('keeps a 1px line 1px wide at DPR 1.25', () => {
		expect(positionsLine(10, 1.25, 1)).to.deep.equal({
			position: 13,
			length: 1,
		});
	});

	void it('rounds the position independently of the width at DPR 1.25', () => {
		// 10.4 * 1.25 = 13 exactly, same scaled position as 10 * 1.25 = 12.5 -> 13
		expect(positionsLine(10.4, 1.25, 1).position).to.equal(13);
		expect(positionsLine(10, 1.25, 1).position).to.equal(13);
	});

	void it('widthIsBitmap = true takes the width verbatim, skipping the pixel ratio', () => {
		expect(positionsLine(10, 2, 4, true)).to.deep.equal({
			position: 18,
			length: 4,
		});
		expect(positionsLine(10, 2, 3, true)).to.deep.equal({
			position: 19,
			length: 3,
		});
	});

	void it('widthIsBitmap = true still scales the position by the pixel ratio', () => {
		expect(positionsLine(10, 1.25, 2, true)).to.deep.equal({
			position: 12,
			length: 2,
		});
	});

	void it('widthIsBitmap = false is the same as omitting it', () => {
		expect(positionsLine(10, 2, 4, false)).to.deep.equal(
			positionsLine(10, 2, 4)
		);
	});
});

void describe('positionsBox', () => {
	void it('covers both edges inclusively', () => {
		const { position, length } = positionsBox(2, 5, 1);
		expect(position).to.equal(2);
		expect(length).to.equal(4);
	});

	void it('is order independent', () => {
		expect(positionsBox(5, 2, 1)).to.deep.equal(positionsBox(2, 5, 1));
	});

	void it('has a minimum length of 1 for a zero-height box', () => {
		expect(positionsBox(4, 4, 1)).to.deep.equal({ position: 4, length: 1 });
	});

	void it('scales both coordinates by the pixel ratio', () => {
		expect(positionsBox(2, 5, 2)).to.deep.equal({ position: 4, length: 7 });
	});

	void it('rounds each coordinate before differencing at DPR 1.25', () => {
		// 2 * 1.25 = 2.5 -> 3; 5 * 1.25 = 6.25 -> 6
		expect(positionsBox(2, 5, 1.25)).to.deep.equal({
			position: 3,
			length: 4,
		});
	});
});
