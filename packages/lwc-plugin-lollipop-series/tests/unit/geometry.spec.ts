import { expect } from 'chai';
import { describe, it } from 'node:test';

import { MAX_MARKER_SIZE, lollipopBase, lollipopSizes } from '../../src/geometry';
import { defaultOptions } from '../../src/options';

void describe('lollipopSizes', () => {
	void it('keeps the options when the bar spacing has room for them', () => {
		expect(lollipopSizes({ lineWidth: 2, markerSize: 8 }, 20)).to.deep.equal({ lineWidth: 2, dotRadius: 4 });
	});

	void it('caps the stem at half the bar spacing and the dot at the bar spacing', () => {
		expect(lollipopSizes({ lineWidth: 6, markerSize: 10 }, 4)).to.deep.equal({ lineWidth: 2, dotRadius: 2 });
	});

	void it('caps the dot at the largest marker size at any bar spacing', () => {
		expect(lollipopSizes({ lineWidth: 2, markerSize: 60 }, 100).dotRadius).to.equal(MAX_MARKER_SIZE / 2);
	});

	void it('raises negative sizes to zero', () => {
		expect(lollipopSizes({ lineWidth: -1, markerSize: -5 }, 20)).to.deep.equal({ lineWidth: 0, dotRadius: 0 });
	});

	void it('falls back to the defaults for sizes which are not finite numbers', () => {
		expect(lollipopSizes({ lineWidth: NaN, markerSize: Infinity }, 100)).to.deep.equal({
			lineWidth: defaultOptions.lineWidth,
			dotRadius: defaultOptions.markerSize / 2,
		});
	});
});

void describe('lollipopBase', () => {
	void it('falls back to 0 for a base which is not a finite number', () => {
		expect(lollipopBase({ base: 12 })).to.equal(12);
		expect(lollipopBase({ base: NaN })).to.equal(0);
	});
});
