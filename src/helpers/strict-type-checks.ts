export type DeepPartial<T> = {
	// tslint:disable-next-line:array-type
	[P in keyof T]?: T[P] extends Array<infer U>
		// tslint:disable-next-line:array-type
		? Array<DeepPartial<U>>
		: T[P] extends ReadonlyArray<infer X>
		? ReadonlyArray<DeepPartial<X>>
		: DeepPartial<T[P]>
};

// tslint:disable-next-line:no-any
export function merge(dst: Record<string, any>, src: Record<string, any>, checkPropertyInDst: boolean = false): Record<string, any> {
	for (const i in src) {
		if (checkPropertyInDst && !(i in dst)) {
			continue;
		}

		if ('object' !== typeof src[i] || !dst.hasOwnProperty(i)) {
			dst[i] = src[i];
		} else {
			merge(dst[i], src[i], checkPropertyInDst);
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

export function isNaN(value: number): boolean {
	return !(value <= 0) && !(value > 0);
}

export function clone<T>(object: T): T {
	// tslint:disable-next-line:no-any
	const o = object as any;
	if (!o || 'object' !== typeof o) {
		return o;
	}

	// tslint:disable-next-line:no-any
	let c: any;

	if (Array.isArray(o)) {
		c = [];
	} else {
		c = {};
	}

	let p;
	let v;
	for (p in o) {
		if (o.hasOwnProperty(p)) {
			v = o[p];
			if (v && 'object' === typeof v) {
				c[p] = clone(v);
			} else {
				c[p] = v;
			}
		}
	}

	return c;
}

export function notNull<T>(t: T | null): t is T {
	return t !== null;
}

export function undefinedIfNull<T>(t: T | null): T | undefined {
	return (t === null) ? undefined : t;
}
