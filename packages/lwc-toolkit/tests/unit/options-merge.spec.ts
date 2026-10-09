import { expect } from 'chai';
import { describe, it } from 'node:test';
import { runInNewContext } from 'node:vm';

import {
	cloneOptions,
	freezeOptions,
	isPlainObject,
	isUnsafeKey,
	mergeOptions,
} from '../../src/options/merge.js';

void describe('isUnsafeKey', () => {
	void it('flags the keys which would reach a prototype', () => {
		expect(['__proto__', 'constructor', 'prototype'].map(isUnsafeKey)).to.deep.equal([true, true, true]);
		expect(isUnsafeKey('proto')).to.equal(false);
		expect(isUnsafeKey('color')).to.equal(false);
	});
});

void describe('isPlainObject', () => {
	void it('is true for object literals, JSON output and objects of no prototype', () => {
		expect(isPlainObject({})).to.equal(true);
		expect(isPlainObject(JSON.parse('{"a": 1}'))).to.equal(true);
		expect(isPlainObject(Object.create(null))).to.equal(true);
	});

	void it('is true for plain objects of another realm', () => {
		const foreign = runInNewContext('({ a: { b: 1 } })') as Record<string, unknown>;
		expect(Object.getPrototypeOf(foreign)).to.not.equal(Object.prototype);
		expect(isPlainObject(foreign)).to.equal(true);
		expect(isPlainObject(runInNewContext('[]'))).to.equal(false);
		expect(isPlainObject(runInNewContext('new Date(0)'))).to.equal(false);
	});

	void it('is false for arrays, class instances, dates, functions and null', () => {
		class Point {
			public x: number = 1;
		}
		expect(isPlainObject([])).to.equal(false);
		expect(isPlainObject(new Point())).to.equal(false);
		expect(isPlainObject(Object.create({ inherited: true }))).to.equal(false);
		expect(isPlainObject(null)).to.equal(false);
		expect(isPlainObject(new Date(0))).to.equal(false);
		expect(isPlainObject(new Map())).to.equal(false);
		expect(isPlainObject(() => 1)).to.equal(false);
	});
});

void describe('cloneOptions', () => {
	void it('copies plain objects and arrays deeply', () => {
		const source = { range: { min: 1, max: 2 }, list: [{ id: 'a' }] };
		const clone = cloneOptions(source);
		expect(clone).to.deep.equal(source);
		clone.range.min = 10;
		clone.list[0].id = 'b';
		clone.list.push({ id: 'c' });
		expect(source).to.deep.equal({ range: { min: 1, max: 2 }, list: [{ id: 'a' }] });
	});

	void it('keeps functions, other objects, undefined and non-finite numbers as they are, unlike cloneReadonly', () => {
		const formatter = (x: number): string => `${x}`;
		const when = new Date(0);
		const clone = cloneOptions({ formatter, when, missing: undefined, nan: Number.NaN, list: [formatter] });
		expect(clone.formatter).to.equal(formatter);
		expect(clone.when).to.equal(when);
		expect('missing' in clone).to.equal(true);
		expect(Number.isNaN(clone.nan)).to.equal(true);
		expect(clone.list[0]).to.equal(formatter);
	});

	void it('copies objects of no prototype, and of another realm, into plain ones', () => {
		const bare = Object.create(null) as Record<string, unknown>;
		bare.a = { b: 1 };
		const clone = cloneOptions(bare);
		expect(Object.getPrototypeOf(clone)).to.equal(Object.prototype);
		expect(clone).to.deep.equal({ a: { b: 1 } });
		const foreign = runInNewContext('({ range: { min: 1 } })') as { range: { min: number } };
		const merged = mergeOptions({ range: { min: 0, max: 5 } }, foreign);
		expect(merged).to.deep.equal({ range: { min: 1, max: 5 } });
	});

	void it('drops __proto__, constructor and prototype keys, as JSON.parse makes them', () => {
		const source = JSON.parse('{"__proto__": {"polluted": true}, "nested": {"constructor": 1, "a": 2}}') as Record<string, unknown>;
		const clone = cloneOptions(source) as Record<string, unknown> & { nested: Record<string, unknown> };
		expect(Object.getPrototypeOf(clone)).to.equal(Object.prototype);
		expect(clone.polluted).to.equal(undefined);
		expect(Object.keys(clone.nested)).to.deep.equal(['a']);
		expect(({} as Record<string, unknown>).polluted).to.equal(undefined);
	});
});

void describe('freezeOptions', () => {
	void it('freezes plain objects and arrays at every depth and returns the value', () => {
		const value = { a: { b: [1, { c: 2 }] } };
		expect(freezeOptions(value)).to.equal(value);
		expect(Object.isFrozen(value)).to.equal(true);
		expect(Object.isFrozen(value.a)).to.equal(true);
		expect(Object.isFrozen(value.a.b)).to.equal(true);
		expect(Object.isFrozen(value.a.b[1])).to.equal(true);
		expect(() => {
			(value.a as { b: unknown }).b = 3;
		}).to.throw(TypeError);
	});

	void it('leaves other objects alone', () => {
		const when = new Date(0);
		freezeOptions({ when });
		expect(Object.isFrozen(when)).to.equal(false);
	});
});

void describe('mergeOptions', () => {
	void it('merges nested objects key by key and replaces arrays', () => {
		const merged = mergeOptions(
			{ border: { visible: false, color: 'grey' }, palette: ['a', 'b'] },
			{ border: { visible: true }, palette: ['c'] }
		);
		expect(merged).to.deep.equal({ border: { visible: true, color: 'grey' }, palette: ['c'] });
	});

	void it('skips undefined', () => {
		expect(mergeOptions({ a: 1, b: { c: 2 } }, { a: undefined, b: { c: undefined } })).to.deep.equal({ a: 1, b: { c: 2 } });
	});

	void it('shares no object or array with the target, even for keys the source leaves out', () => {
		const target = { range: { min: 1, max: 2 }, list: [{ id: 'a' }], border: { visible: false } };
		const merged = mergeOptions(target, { border: { visible: true } });
		merged.range.min = 10;
		merged.list[0].id = 'changed';
		merged.list.push({ id: 'b' });
		merged.border.visible = false;
		expect(target).to.deep.equal({ range: { min: 1, max: 2 }, list: [{ id: 'a' }], border: { visible: false } });
	});

	void it('shares no object or array with the source', () => {
		const source = { groups: [{ id: 'a', color: '#F23645' }], range: { min: 0, max: null as number | null } };
		const merged = mergeOptions({ groups: [], range: { min: null, max: null } }, source);
		source.groups[0].color = '#000000';
		source.groups.push({ id: 'b', color: '#000000' });
		source.range.max = 5;
		expect(merged).to.deep.equal({ groups: [{ id: 'a', color: '#F23645' }], range: { min: 0, max: null } });
	});

	void it('keeps functions as they are', () => {
		const formatter = (x: number): string => `${x}`;
		expect(mergeOptions({ formatter: null as unknown }, { formatter }).formatter).to.equal(formatter);
	});

	void it('copies the source, or the target for an undefined source, when either is not a plain object', () => {
		expect(mergeOptions([1, 2], [3])).to.deep.equal([3]);
		const target = { a: { b: 1 } };
		const copy = mergeOptions(target, undefined);
		expect(copy).to.deep.equal(target);
		expect(copy.a).to.not.equal(target.a);
	});

	void it('skips __proto__, constructor and prototype keys, as JSON.parse makes them', () => {
		const source = JSON.parse('{"__proto__": {"polluted": true}, "range": {"__proto__": {"x": 1}, "min": 2}, "constructor": 3}') as Record<string, unknown>;
		const merged = mergeOptions({ range: { min: 0, max: 1 } }, source) as Record<string, unknown> & { range: Record<string, unknown> };
		expect(Object.getPrototypeOf(merged)).to.equal(Object.prototype);
		expect(Object.getPrototypeOf(merged.range)).to.equal(Object.prototype);
		expect(merged.polluted).to.equal(undefined);
		expect(Object.prototype.hasOwnProperty.call(merged, 'constructor')).to.equal(false);
		expect(merged.range).to.deep.equal({ min: 2, max: 1 });
		expect(({} as Record<string, unknown>).polluted).to.equal(undefined);
	});

	void it('lets null replace a value by default, at every depth', () => {
		const merged = mergeOptions(
			{ range: { min: 1, max: 2 } as { min: number | null; max: number } | null, color: 'red' as string | null },
			{ range: { min: null }, color: null }
		);
		expect(merged).to.deep.equal({ range: { min: null, max: 2 }, color: null });
		expect(mergeOptions({ range: { min: 1 } }, { range: null })).to.deep.equal({ range: null });
	});

	void describe('with defaults (opt-in)', () => {
		const defaults = freezeOptions({
			color: 'red',
			label: null as string | null,
			range: { min: null as number | null, max: null as number | null },
			border: { visible: false, width: 1 },
			list: ['a'],
		});
		const current = {
			color: 'blue',
			label: 'x' as string | null,
			range: { min: 1 as number | null, max: 2 as number | null },
			border: { visible: true, width: 3 },
			list: ['b', 'c'],
		};

		void it('resets a null option to a copy of its default', () => {
			const merged = mergeOptions(current, { color: null, border: null, list: null }, defaults);
			expect(merged.color).to.equal('red');
			expect(merged.border).to.deep.equal({ visible: false, width: 1 });
			expect(merged.border).to.not.equal(defaults.border);
			expect(merged.list).to.deep.equal(['a']);
			expect(merged.list).to.not.equal(defaults.list);
			expect(merged.range).to.deep.equal({ min: 1, max: 2 });
		});

		void it('resets at every depth', () => {
			const merged = mergeOptions(current, { border: { width: null } }, defaults);
			expect(merged.border).to.deep.equal({ visible: true, width: 1 });
		});

		void it('keeps null where the default is null, or where there is no default', () => {
			const merged = mergeOptions(
				{ ...current, extra: 5 as number | null },
				{ label: null, range: { min: null }, extra: null },
				defaults
			);
			expect(merged.label).to.equal(null);
			expect(merged.range).to.deep.equal({ min: null, max: 2 });
			expect(merged.extra).to.equal(null);
		});

		void it('takes no inherited value for a default', () => {
			const merged = mergeOptions({ toString: 'x' as string | null }, { toString: null }, {});
			expect(merged.toString).to.equal(null);
		});

		void it('resets a null source as a whole', () => {
			expect(mergeOptions(current, null, defaults)).to.deep.equal(defaults);
		});
	});
});
