/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { filterOverlappingLabels, TimeAxisLabel } from '../../src/gui/time-axis-labels';

function label(coordinate: number, width: number = 80, weight: number = 1): TimeAxisLabel {
	return { coordinate, width, weight };
}

describe('Time axis labels after edge alignment', () => {
	it('keeps separated labels and their original references', () => {
		const labels = [label(40), label(120), label(200)];
		expect(filterOverlappingLabels(labels)).to.deep.equal(labels);
		expect(filterOverlappingLabels(labels)[0]).to.equal(labels[0]);
	});

	it('omits an equal-weight neighbor overlapping a label shifted from the left edge', () => {
		const labels = [label(40), label(90), label(180)];
		expect(filterOverlappingLabels(labels)).to.deep.equal([labels[0], labels[2]]);
	});

	it('omits an equal-weight label shifted from the right edge into its neighbor', () => {
		const labels = [label(40), label(120), label(170)];
		expect(filterOverlappingLabels(labels)).to.deep.equal(labels.slice(0, 2));
	});

	it('preserves a heavier mark instead of the overlapping lighter marks', () => {
		const labels = [label(40), label(120), label(140, 160, 2)];
		expect(filterOverlappingLabels(labels)).to.deep.equal([labels[2]]);
	});

	it('does not remove previous marks when a heavier earlier mark rejects the new label', () => {
		const labels = [label(40, 80, 3), label(120), label(110, 100, 2)];
		expect(filterOverlappingLabels(labels)).to.deep.equal(labels.slice(0, 2));
	});

	it('uses measured widths rather than character counts', () => {
		const labels = [label(40, 20), label(80, 30), label(120, 90)];
		expect(filterOverlappingLabels(labels)).to.deep.equal(labels.slice(0, 2));
	});

	it('handles an empty axis and labels wider than the axis', () => {
		expect(filterOverlappingLabels([])).to.deep.equal([]);
		const labels = [label(60, 200), label(40, 200)];
		expect(filterOverlappingLabels(labels)).to.deep.equal([labels[0]]);
	});
});
