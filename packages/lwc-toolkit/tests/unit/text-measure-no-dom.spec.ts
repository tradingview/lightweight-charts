import { expect } from 'chai';
import { describe, it } from 'node:test';

import { createTextWidthCache, textMeasureContext } from '../../src/text/measure.js';

// Node has no `document`: a file of its own, as the module looks for a DOM once.
void describe('text measuring without a DOM', () => {
	void it('has no context, and measures nothing, so that the caller estimates', () => {
		expect(typeof (globalThis as { document?: unknown }).document).to.equal('undefined');
		expect(textMeasureContext()).to.equal(null);
		expect(createTextWidthCache().measure('12px Arial', 'abc')).to.equal(null);
	});
});
