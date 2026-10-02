import { expect } from 'chai';
import { describe, it } from 'node:test';

import { cloneReadonly } from '../../src/simple-clone.js';

void describe('cloneReadonly', () => {
	void it('returns a structurally equal but distinct object', () => {
		const source = { a: 1, b: 'two' };
		const clone = cloneReadonly(source);
		expect(clone).to.deep.equal(source);
		expect(clone).to.not.equal(source);
	});

	void it('clones nested objects and arrays deeply', () => {
		const source = { nested: { list: [1, { deep: true }] } };
		const clone = cloneReadonly(source);
		expect(clone.nested).to.not.equal(source.nested);
		expect(clone.nested.list).to.not.equal(source.nested.list);
		clone.nested.list[0] = 99;
		expect(source.nested.list[0]).to.equal(1);
	});

	void it('clones arrays as arrays', () => {
		const clone = cloneReadonly([1, 2, 3]);
		expect(Array.isArray(clone)).to.equal(true);
		expect(clone).to.deep.equal([1, 2, 3]);
	});

	void it('drops keys whose value is undefined (JSON round trip)', () => {
		const clone = cloneReadonly({ a: 1, b: undefined });
		expect(Object.keys(clone)).to.deep.equal(['a']);
		expect('b' in clone).to.equal(false);
	});

	void it('drops function-valued keys', () => {
		const clone = cloneReadonly({ a: 1, fn: () => 1 });
		expect(Object.keys(clone)).to.deep.equal(['a']);
	});

	void it('turns undefined array entries into null', () => {
		expect(cloneReadonly([1, undefined, 3])).to.deep.equal([1, null, 3]);
	});

	void it('turns NaN and Infinity into null', () => {
		expect(cloneReadonly({ a: NaN, b: Infinity, c: -Infinity })).to.deep.equal({
			a: null,
			b: null,
			c: null,
		});
	});

	void it('turns a Date into an ISO string, not a Date', () => {
		const clone = cloneReadonly({ when: new Date(0) });
		expect(clone.when).to.equal('1970-01-01T00:00:00.000Z');
	});

	void it('does not preserve the prototype', () => {
		class Point {
			public constructor(public x: number) {}
			public double(): number {
				return this.x * 2;
			}
		}
		const clone = cloneReadonly(new Point(3));
		expect(clone).to.deep.equal({ x: 3 });
		expect(clone instanceof Point).to.equal(false);
	});

	void it('throws on a circular reference', () => {
		const source: { self?: unknown } = {};
		source.self = source;
		expect(() => cloneReadonly(source)).to.throw(TypeError);
	});
});
