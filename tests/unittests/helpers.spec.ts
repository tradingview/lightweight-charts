/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { clone, merge } from '../../src/helpers/strict-type-checks';

describe('Helpers', () => {
	/* eslint-disable
		@typescript-eslint/unbound-method,
		@typescript-eslint/no-explicit-any,
		@typescript-eslint/no-unsafe-member-access,
		@typescript-eslint/no-unused-expressions,
	*/
	describe('merge', () => {
		it('should perform deep merge of objects', () => {
			const dst = {
				a: 1,
				b: {
					c: 2,
					d: {
						e: 3,
					},
				},
			};

			const src = {
				b: {
					d: {
						f: 4,
					},
				},
				g: 5,
			};

			const result = merge(dst, src);

			expect(result).to.deep.equal({
				a: 1,
				b: {
					c: 2,
					d: {
						e: 3,
						f: 4,
					},
				},
				g: 5,
			});
		});

		it('should handle arrays correctly', () => {
			const dst = { arr: [1, 2, 3] };
			const src = { arr: [4, 5, 6] };

			const result = merge(dst, src);
			expect(result.arr).to.deep.equal([4, 5, 6]);
		});

		it('should handle undefined values', () => {
			const dst = { a: 1, b: 2 };
			const src = { b: undefined, c: 3 };

			const result = merge(dst, src);
			expect(result).to.deep.equal({ a: 1, b: 2, c: 3 });
		});

		it('should protect against prototype pollution', () => {
			const originalProto = Object.prototype.toString;
			const maliciousPayload = JSON.parse(
				'{"__proto__": {"polluted": true}}'
			) as Record<string, unknown>;

			const dst = { legitimate: 'data' };
			merge(dst, maliciousPayload);

			// Check if prototype was not polluted
			expect(({} as any).polluted).to.be.undefined;
			expect((Object.prototype as any).polluted).to.be.undefined;
			expect(Object.prototype.toString).to.equal(originalProto);
		});

		it('should handle multiple sources', () => {
			const dst = { a: 1 };
			const src1 = { b: 2 };
			const src2 = { c: 3 };

			const result = merge(dst, src1, src2);
			expect(result).to.deep.equal({ a: 1, b: 2, c: 3 });
		});

		it('should protect against constructor pollution', () => {
			const dst = {};
			const malicious = JSON.parse('{ "constructor": { "prototype": { "polluted": true } } }') as Record<string, unknown>;

			merge(dst, malicious);

			expect(({} as any).polluted).to.be.undefined;
			expect((Object.prototype as any).polluted).to.be.undefined;
		});

		it('should protect against nested prototype pollution', () => {
			const dst = { nested: {} };
			const malicious = JSON.parse('{"nested":{"__proto__": { "polluted": true }}}') as Record<string, unknown>;

			merge(dst, malicious);

			expect(({} as any).polluted).to.be.undefined;
			expect((Object.prototype as any).polluted).to.be.undefined;
		});

		it('should handle circular references safely', () => {
			const dst: Record<string, unknown> = { a: 1 };
			dst.circular = dst;

			const src = { b: 2 };

			const result = merge(dst, src);
			expect(result.b).to.equal(2);
			expect(result.circular).to.equal(result);
		});
	});

	describe('clone', () => {
		it('should deep clone objects', () => {
			const original = {
				a: 1,
				b: {
					c: 2,
					d: [1, 2, { e: 3 }],
				},
			};

			const cloned = clone(original);

			expect(cloned).to.deep.equal(original);
			expect(cloned).to.not.equal(original);
			expect(cloned.b).to.not.equal(original.b);
			expect(cloned.b.d).to.not.equal(original.b.d);
		});

		it('should handle primitive values', () => {
			expect(clone(42)).to.equal(42);
			expect(clone('string')).to.equal('string');
			expect(clone(null)).to.equal(null);
			expect(clone(undefined)).to.equal(undefined);
		});

		it('should protect against __proto__ chain climbing', () => {
			const malicious = JSON.parse('{"__proto__": {"__proto__": {"polluted": true}}}');

			clone(malicious);

			expect(({} as any).polluted).to.be.undefined;
			expect((Object.prototype as any).polluted).to.be.undefined;
		});

		it('should protect against prototype pollution', () => {
			const originalProto = Object.prototype.toString;
			const maliciousObject = JSON.parse('{ "__proto__": { "polluted": true }, "value": 1234 }');

			const cloned = clone(maliciousObject);

			expect(cloned.value).to.equal(1234);
			expect(({} as any).polluted).to.be.undefined;
			expect((Object.prototype as any).polluted).to.be.undefined;
			expect(Object.prototype.toString).to.equal(originalProto);
		});
	});
	/* eslint-enable
		@typescript-eslint/unbound-method,
		@typescript-eslint/no-explicit-any,
		@typescript-eslint/no-unsafe-member-access,
		@typescript-eslint/no-unused-expressions,
	*/
});
