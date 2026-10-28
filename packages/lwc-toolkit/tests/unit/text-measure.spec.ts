import { expect } from 'chai';
import { after, describe, it } from 'node:test';

import { createTextWidthCache, textMeasureContext } from '../../src/text/measure.js';

/**
 * A stand-in DOM whose 2D context measures every character as wide as the
 * pixel size at the start of the font string, and counts the measurements
 * and the contexts created. Installed before the module first looks for a
 * DOM, which it does once: `text-measure-no-dom.spec.ts` covers the case
 * without one.
 */
const counts = { contexts: 0, measured: 0 };
const fakeContext = {
	font: '',
	measureText(text: string): { width: number } {
		counts.measured++;
		const size = Number(/(\d+)px/.exec(this.font)?.[1] ?? 0);
		return { width: text.length * size };
	},
};
(globalThis as unknown as { document: unknown }).document = {
	createElement: (tag: string) => {
		expect(tag).to.equal('canvas');
		return {
			getContext: (kind: string) => {
				expect(kind).to.equal('2d');
				counts.contexts++;
				return fakeContext;
			},
		};
	},
};

after(() => {
	delete (globalThis as { document?: unknown }).document;
});

void describe('textMeasureContext', () => {
	void it('creates one context on first use and shares it', () => {
		const first = textMeasureContext();
		expect(first).to.equal(fakeContext);
		expect(textMeasureContext()).to.equal(first);
		expect(counts.contexts).to.equal(1);
	});
});

void describe('createTextWidthCache', () => {
	void it('measures in the font given, and remembers the width per font', () => {
		const cache = createTextWidthCache();
		const before = counts.measured;
		expect(cache.measure('12px Arial', 'abc')).to.equal(36);
		expect(cache.measure('bold 10px Arial', 'abc')).to.equal(30);
		expect(cache.measure('12px Arial', 'abc')).to.equal(36);
		expect(cache.measure('bold 10px Arial', 'abc')).to.equal(30);
		expect(counts.measured - before).to.equal(2);
	});

	void it('sets the font on the shared context, whatever another caller left there', () => {
		const cache = createTextWidthCache();
		fakeContext.font = '99px Other';
		expect(cache.measure('5px Arial', 'xy')).to.equal(10);
	});

	void it('starts again from empty once full', () => {
		const cache = createTextWidthCache(2);
		const before = counts.measured;
		cache.measure('1px A', 'a');
		cache.measure('1px A', 'b');
		cache.measure('1px A', 'c');
		// 'a' was dropped with the rest when 'c' came in; 'c' is kept.
		cache.measure('1px A', 'c');
		cache.measure('1px A', 'a');
		expect(counts.measured - before).to.equal(4);
	});

	void it('measures again after clear', () => {
		const cache = createTextWidthCache();
		const before = counts.measured;
		cache.measure('1px A', 'a');
		cache.clear();
		cache.measure('1px A', 'a');
		expect(counts.measured - before).to.equal(2);
	});
});
