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
export function merge(dst: Record<string, any>, ...sources: Record<string, any>[]): Record<string, any> {
	for (const src of sources) {
		// eslint-disable-next-line no-restricted-syntax
		for (const i in src) {
			if (src[i] === undefined) {
				continue;
			}

			if ('object' !== typeof src[i] || dst[i] === undefined) {
				dst[i] = src[i];
			} else {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				merge(dst[i], src[i]);
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
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,no-prototype-builtins
		if (o.hasOwnProperty(p)) {
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
