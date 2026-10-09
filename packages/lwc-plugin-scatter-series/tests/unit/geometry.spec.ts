import { expect } from 'chai';
import { describe, it } from 'node:test';

import { XMapping, coordinateToX, xToCoordinate } from '../../src/geometry.js';

void describe('X mapping', () => {
	const mapping: XMapping = { start: 96, origin: 12.5, pxPerUnit: 71.375 };

	void it('maps the first slot to its origin, linearly on either side', () => {
		expect(xToCoordinate(mapping, 96)).to.equal(12.5);
		expect(xToCoordinate(mapping, 100)).to.equal(12.5 + 4 * 71.375);
		// Outside the domain: a coordinate outside the pane, not a clamp.
		expect(xToCoordinate(mapping, 90)).to.be.below(0);
		expect(xToCoordinate(mapping, 200)).to.equal(12.5 + 104 * 71.375);
	});

	void it('is undone by coordinateToX, inside and outside the pane', () => {
		for (const x of [96, 99.37, 104, -1e6, 1e6, 0.1]) {
			expect(coordinateToX(mapping, xToCoordinate(mapping, x))).to.be.closeTo(x, 1e-9 * Math.max(1, Math.abs(x)));
		}
		for (const coordinate of [-300, 0, 12.5, 599, 2000]) {
			expect(xToCoordinate(mapping, coordinateToX(mapping, coordinate))).to.be.closeTo(coordinate, 1e-9);
		}
	});
});
