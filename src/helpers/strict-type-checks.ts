/**
 * Represents a type `T` where every property is optional.
 */
export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends (infer U)[]
		? DeepPartial<U>[]
		: T[P] extends readonly (infer X)[]
			? readonly DeepPartial<X>[]
			: DeepPartial<T[P]>
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isMergeableObject(value: unknown): value is Record<string, any> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function merge(dst: Record<string, any>, ...sources: Record<string, any>[]): Record<string, any> {
	for (const src of sources) {
		// eslint-disable-next-line no-restricted-syntax
		for (const i in src) {
			if (
				src[i] === undefined ||
				!Object.prototype.hasOwnProperty.call(src, i) ||
				['__proto__', 'constructor', 'prototype'].includes(i)
			) {
				continue;
			}

			const srcValue: unknown = src[i];
			// only an own property of dst may receive a nested merge: dst[i] would otherwise
			// resolve through the prototype chain (e.g. Object.prototype.toString) and the merge
			// would write into an object shared by the whole page
			const dstValue: unknown = Object.prototype.hasOwnProperty.call(dst, i) ? dst[i] : undefined;
			if (isMergeableObject(srcValue) && isMergeableObject(dstValue)) {
				merge(dstValue, srcValue);
			} else {
				dst[i] = srcValue;
			}
		}
	}

	return dst;
}

export function isNumber(value: unknown): value is number {
	return (typeof value === 'number') && (isFinite(value));
}

export function isInteger(value: unknown): boolean {
	return (typeof value === 'number') && ((value % 1) === 0);
}

export function isString(value: unknown): value is string {
	return typeof value === 'string';
}

export function isBoolean(value: unknown): value is boolean {
	return typeof value === 'boolean';
}

export function clone<T>(object: T): T {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const o = object as any;
	if (!o || 'object' !== typeof o) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return o;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let c: any;

	if (Array.isArray(o)) {
		c = [];
	} else {
		c = {};
	}

	let p;
	let v;
	// eslint-disable-next-line no-restricted-syntax
	for (p in o) {
		if (Object.prototype.hasOwnProperty.call(o, p)) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			v = o[p];
			if (v && 'object' === typeof v) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				c[p] = clone(v);
			} else {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				c[p] = v;
			}
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return c;
}

export function notNull<T>(t: T | null): t is T {
	return t !== null;
}

export function undefinedIfNull<T>(t: T | null): T | undefined {
	return (t === null) ? undefined : t;
}
