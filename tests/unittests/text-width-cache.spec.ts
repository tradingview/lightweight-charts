import { expect } from 'chai';
import { describe, it } from 'mocha';

import { TextWidthCache } from '../../src/model/text-width-cache';

function fakeMeasureText(str: string): { width: number } {
	let fakeWidth = 0;
	for (let i = 0; i < str.length; i++) {
		fakeWidth += (1 + str.charCodeAt(i) % 64 / 64) * 10;
	}
	return { width: fakeWidth };
}

describe('TextWidthCache', () => {
	it('should return the same measureText would return', () => {
		const textWidthCache = new TextWidthCache();
		const fakeCtx = { measureText: fakeMeasureText } as unknown as CanvasRenderingContext2D;
		expect(
			textWidthCache.measureText(fakeCtx, 'test')
		).to.be.equal(
			fakeMeasureText('test').width
		);
	});

	it('should cache and purge values', () => {
		const invocations: Record<string, number> = Object.create(null);
		const fakeCtx = {
			measureText(str: string): { width: number } {
				invocations[str] = (invocations[str] || 0) + 1;
				return { width: 42 };
			},
		} as unknown as CanvasRenderingContext2D;

		const textWidthCache = new TextWidthCache(3);
		textWidthCache.measureText(fakeCtx, 'foo');
		textWidthCache.measureText(fakeCtx, 'bar');
		textWidthCache.measureText(fakeCtx, 'baz');

		expect(invocations).to.deep.equal({
			foo: 1,
			bar: 1,
			baz: 1,
		});

		textWidthCache.measureText(fakeCtx, 'baz');
		textWidthCache.measureText(fakeCtx, 'bar');
		textWidthCache.measureText(fakeCtx, 'foo');

		expect(invocations).to.deep.equal({
			foo: 1,
			bar: 1,
			baz: 1,
		});

		// The oldest, foo, should be removed
		textWidthCache.measureText(fakeCtx, 'quux');

		expect(invocations).to.deep.equal({
			foo: 1,
			bar: 1,
			baz: 1,
			quux: 1,
		});

		textWidthCache.measureText(fakeCtx, 'baz');
		textWidthCache.measureText(fakeCtx, 'bar');
		textWidthCache.measureText(fakeCtx, 'foo');

		expect(invocations).to.deep.equal({
			foo: 2,
			bar: 1,
			baz: 1,
			quux: 1,
		});
	});

	it('should not cache zero width of nonempty string', () => {
		const invocations: Record<string, number> = Object.create(null);
		const fakeCtx = {
			measureText(str: string): { width: number } {
				invocations[str] = (invocations[str] || 0) + 1;
				return { width: 0 };
			},
		} as unknown as CanvasRenderingContext2D;

		const textWidthCache = new TextWidthCache(3);

		textWidthCache.measureText(fakeCtx, '');
		textWidthCache.measureText(fakeCtx, 'not empty');
		textWidthCache.measureText(fakeCtx, '');
		textWidthCache.measureText(fakeCtx, 'not empty');
		textWidthCache.measureText(fakeCtx, '');
		textWidthCache.measureText(fakeCtx, 'not empty');

		expect(invocations).to.deep.equal({
			// cache
			'': 1,
			// no cache
			'not empty': 3,
		});
	});

	it('should not treat prototype values as keys', () => {
		const invocations: Record<string, number> = Object.create(null);
		const fakeCtx = {
			measureText(str: string): { width: number } {
				invocations[str] = (invocations[str] || 0) + 1;
				return { width: 42 };
			},
		} as unknown as CanvasRenderingContext2D;

		const textWidthCache = new TextWidthCache(3);

		textWidthCache.measureText(fakeCtx, '__proto__');
		textWidthCache.measureText(fakeCtx, 'prototype');
		textWidthCache.measureText(fakeCtx, 'hasOwnProperty');

		expect(invocations.__proto__).to.deep.equal(1);
		expect(invocations.prototype).to.deep.equal(1);
		expect(invocations.hasOwnProperty).to.deep.equal(1);

		// Just checking if it still works

		textWidthCache.measureText(fakeCtx, '__proto__');
		textWidthCache.measureText(fakeCtx, 'prototype');
		textWidthCache.measureText(fakeCtx, 'hasOwnProperty');

		expect(invocations.__proto__).to.deep.equal(1);
		expect(invocations.prototype).to.deep.equal(1);
		expect(invocations.hasOwnProperty).to.deep.equal(1);
	});

	it('should apply default optimization regex', () => {
		const textWidthCache = new TextWidthCache();
		const fakeCtx = { measureText: fakeMeasureText } as unknown as CanvasRenderingContext2D;
		expect(
			textWidthCache.measureText(fakeCtx, 'test2345')
		).to.be.equal(
			textWidthCache.measureText(fakeCtx, 'test6789')
		);
	});

	it('should apply custom optimization regex', () => {
		const textWidthCache = new TextWidthCache();
		const fakeCtx = { measureText: fakeMeasureText } as unknown as CanvasRenderingContext2D;
		const re = /[1-9]/g;
		expect(
			textWidthCache.measureText(fakeCtx, 'test01234', re)
		).to.be.equal(
			textWidthCache.measureText(fakeCtx, 'test56789', re)
		);
	});
});
