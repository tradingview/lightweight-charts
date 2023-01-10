import { expect } from 'chai';
import { describe, it } from 'mocha';

import { CanvasCtxLike, TextWidthCache } from '../../src/model/text-width-cache';

class FakeCtx implements CanvasCtxLike {
	public readonly invocations: string[] = [];

	public textBaseline: CanvasTextBaseline = 'alphabetic';

	public measureText(text: string): TextMetrics {
		this.invocations.push(text);
		return { width: this._impl(text) } as unknown as TextMetrics;
	}

	public save(): void {}

	public restore(): void {}

	protected _impl(text: string): number {
		let fakeWidth = 0;
		for (let i = 0; i < text.length; i++) {
			fakeWidth += (1 + text.charCodeAt(i) % 64 / 64) * 10;
		}
		return fakeWidth;
	}
}

describe('TextWidthCache', () => {
	it('should return the same measureText would return', () => {
		const textWidthCache = new TextWidthCache();
		const fakeCtx = new FakeCtx();

		expect(
			textWidthCache.measureText(fakeCtx, 'test')
		).to.be.equal(
			fakeCtx.measureText('test').width
		);
	});

	it('should cache and purge values', () => {
		const textWidthCache = new TextWidthCache(3);
		const fakeCtx = new FakeCtx();

		textWidthCache.measureText(fakeCtx, 'foo');
		textWidthCache.measureText(fakeCtx, 'bar');
		textWidthCache.measureText(fakeCtx, 'baz');

		expect(fakeCtx.invocations).to.deep.equal(['foo', 'bar', 'baz']);

		textWidthCache.measureText(fakeCtx, 'baz');
		textWidthCache.measureText(fakeCtx, 'bar');
		textWidthCache.measureText(fakeCtx, 'foo');

		// No new invocations should be made
		expect(fakeCtx.invocations).to.deep.equal(['foo', 'bar', 'baz']);

		// The oldest, foo, should be removed
		textWidthCache.measureText(fakeCtx, 'quux');
		expect(fakeCtx.invocations).to.deep.equal(['foo', 'bar', 'baz', 'quux']);

		textWidthCache.measureText(fakeCtx, 'baz');
		textWidthCache.measureText(fakeCtx, 'bar');
		expect(fakeCtx.invocations).to.deep.equal(['foo', 'bar', 'baz', 'quux']);

		textWidthCache.measureText(fakeCtx, 'foo');
		expect(fakeCtx.invocations).to.deep.equal(['foo', 'bar', 'baz', 'quux', 'foo']);
	});

	it('should not cache zero width of nonempty string', () => {
		class ZeroReturningFakeCtx extends FakeCtx {
			protected override _impl(): number {
				return 0;
			}
		}

		const textWidthCache = new TextWidthCache(3);
		const fakeCtx = new ZeroReturningFakeCtx();

		textWidthCache.measureText(fakeCtx, '');
		textWidthCache.measureText(fakeCtx, 'not empty');
		expect(fakeCtx.invocations).to.deep.equal(['', 'not empty']);

		textWidthCache.measureText(fakeCtx, '');
		textWidthCache.measureText(fakeCtx, 'not empty');
		expect(fakeCtx.invocations).to.deep.equal(['', 'not empty', 'not empty']);

		textWidthCache.measureText(fakeCtx, '');
		textWidthCache.measureText(fakeCtx, 'not empty');
		expect(fakeCtx.invocations).to.deep.equal(['', 'not empty', 'not empty', 'not empty']);
	});

	it('should work with "special" values', () => {
		const textWidthCache = new TextWidthCache(5);
		const fakeCtx = new FakeCtx();

		textWidthCache.measureText(fakeCtx, '__proto__');
		textWidthCache.measureText(fakeCtx, 'prototype');
		textWidthCache.measureText(fakeCtx, 'hasOwnProperty');
		textWidthCache.measureText(fakeCtx, 'undefined');

		expect(fakeCtx.invocations).to.deep.equal(['__proto__', 'prototype', 'hasOwnProperty', 'undefined']);

		// Just checking if it still works

		textWidthCache.measureText(fakeCtx, '__proto__');
		textWidthCache.measureText(fakeCtx, 'prototype');
		textWidthCache.measureText(fakeCtx, 'hasOwnProperty');
		textWidthCache.measureText(fakeCtx, 'undefined');

		expect(fakeCtx.invocations).to.deep.equal(['__proto__', 'prototype', 'hasOwnProperty', 'undefined']);
	});

	it('should apply default optimization regex', () => {
		const textWidthCache = new TextWidthCache();
		const fakeCtx = new FakeCtx();
		expect(
			textWidthCache.measureText(fakeCtx, 'test2345')
		).to.be.equal(
			textWidthCache.measureText(fakeCtx, 'test6789')
		);
		expect(fakeCtx.invocations).to.deep.equal(['test0000']);
	});

	it('should apply custom optimization regex', () => {
		const textWidthCache = new TextWidthCache();
		const fakeCtx = new FakeCtx();
		const re = /[1-9]/g;
		expect(
			textWidthCache.measureText(fakeCtx, 'test01234', re)
		).to.be.equal(
			textWidthCache.measureText(fakeCtx, 'test56789', re)
		);
		expect(fakeCtx.invocations).to.deep.equal(['test00000']);
	});
});
