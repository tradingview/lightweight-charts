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
});

void describe('positionsBox', () => {
	void it('covers both edges inclusively', () => {
		const { position, length } = positionsBox(2, 5, 1);
		expect(position).to.equal(2);
		expect(length).to.equal(4);
	});
});
