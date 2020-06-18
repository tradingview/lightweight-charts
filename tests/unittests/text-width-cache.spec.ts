import { expect } from 'chai';
import { describe, it } from 'mocha';

import { CanvasCtxLike, TextMetricsLike, TextWidthCache } from '../../src/model/text-width-cache';

const fakeCtx: CanvasCtxLike = {
	measureText(str: string): TextMetricsLike {
		let fakeWidth = 0;
		for (let i = 0; i < str.length; i++) {
			fakeWidth += (1 + str.charCodeAt(i) % 64 / 64) * 10;
		}
		return { width: fakeWidth };
	},
};

class SpyingFakeCtx implements CanvasCtxLike {
	public readonly invocations: Map<string, number> = new Map();
	private _valueToReturn: number;

	public constructor(valueToReturn: number) {
		this._valueToReturn = valueToReturn;
	}

	public measureText(text: string): TextMetricsLike {
		this.invocations.set(
			text,
			(this.invocations.get(text) || 0) + 1
		);
		return { width: this._valueToReturn };
	}
}

describe('TextWidthCache', () => {
	it('should return the same measureText would return', () => {
		const textWidthCache = new TextWidthCache();
		expect(
			textWidthCache.measureText(fakeCtx, 'test')
		).to.be.equal(
			fakeCtx.measureText('test').width
		);
	});

	it('should cache and purge values', () => {
		const spyingCtx = new SpyingFakeCtx(42);
		const textWidthCache = new TextWidthCache(3);

		textWidthCache.measureText(spyingCtx, 'foo');
		textWidthCache.measureText(spyingCtx, 'bar');
		textWidthCache.measureText(spyingCtx, 'baz');

		expect(spyingCtx.invocations.get('foo')).to.be.equal(1);
		expect(spyingCtx.invocations.get('bar')).to.be.equal(1);
		expect(spyingCtx.invocations.get('baz')).to.be.equal(1);

		textWidthCache.measureText(spyingCtx, 'baz');
		textWidthCache.measureText(spyingCtx, 'bar');
		textWidthCache.measureText(spyingCtx, 'foo');

		expect(spyingCtx.invocations.get('foo')).to.be.equal(1);
		expect(spyingCtx.invocations.get('bar')).to.be.equal(1);
		expect(spyingCtx.invocations.get('baz')).to.be.equal(1);

		// The oldest, foo, should be removed

		textWidthCache.measureText(spyingCtx, 'quux');
		expect(spyingCtx.invocations.get('quux')).to.be.equal(1);

		textWidthCache.measureText(spyingCtx, 'baz');
		textWidthCache.measureText(spyingCtx, 'bar');
		textWidthCache.measureText(spyingCtx, 'foo');

		expect(spyingCtx.invocations.get('foo')).to.be.equal(2);
		expect(spyingCtx.invocations.get('bar')).to.be.equal(1);
		expect(spyingCtx.invocations.get('baz')).to.be.equal(1);
		expect(spyingCtx.invocations.get('quux')).to.be.equal(1);
	});

	it('should not cache zero width of nonempty string', () => {
		const spyingCtx = new SpyingFakeCtx(0);
		const textWidthCache = new TextWidthCache(3);

		textWidthCache.measureText(spyingCtx, '');
		textWidthCache.measureText(spyingCtx, 'not empty');
		textWidthCache.measureText(spyingCtx, '');
		textWidthCache.measureText(spyingCtx, 'not empty');
		textWidthCache.measureText(spyingCtx, '');
		textWidthCache.measureText(spyingCtx, 'not empty');

		expect(spyingCtx.invocations.get('')).to.be.equal(1);
		expect(spyingCtx.invocations.get('not empty')).to.be.equal(3);
	});

	it('should work with "special" values', () => {
		const spyingCtx = new SpyingFakeCtx(42);
		const textWidthCache = new TextWidthCache(5);

		textWidthCache.measureText(spyingCtx, '__proto__');
		textWidthCache.measureText(spyingCtx, 'prototype');
		textWidthCache.measureText(spyingCtx, 'hasOwnProperty');
		textWidthCache.measureText(spyingCtx, 'undefined');

		expect(spyingCtx.invocations.get('__proto__')).to.be.equal(1);
		expect(spyingCtx.invocations.get('prototype')).to.be.equal(1);
		expect(spyingCtx.invocations.get('hasOwnProperty')).to.be.equal(1);
		expect(spyingCtx.invocations.get('undefined')).to.be.equal(1);

		// Just checking if it still works

		textWidthCache.measureText(spyingCtx, '__proto__');
		textWidthCache.measureText(spyingCtx, 'prototype');
		textWidthCache.measureText(spyingCtx, 'hasOwnProperty');
		textWidthCache.measureText(spyingCtx, 'undefined');

		expect(spyingCtx.invocations.get('__proto__')).to.be.equal(1);
		expect(spyingCtx.invocations.get('prototype')).to.be.equal(1);
		expect(spyingCtx.invocations.get('hasOwnProperty')).to.be.equal(1);
		expect(spyingCtx.invocations.get('undefined')).to.be.equal(1);
	});

	it('should apply default optimization regex', () => {
		const textWidthCache = new TextWidthCache();
		expect(
			textWidthCache.measureText(fakeCtx, 'test2345')
		).to.be.equal(
			textWidthCache.measureText(fakeCtx, 'test6789')
		);
	});

	it('should apply custom optimization regex', () => {
		const textWidthCache = new TextWidthCache();
		const re = /[1-9]/g;
		expect(
			textWidthCache.measureText(fakeCtx, 'test01234', re)
		).to.be.equal(
			textWidthCache.measureText(fakeCtx, 'test56789', re)
		);
	});
});
