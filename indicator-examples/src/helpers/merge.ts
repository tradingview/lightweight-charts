// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mergeImpl(
	dst: Record<string, any>,
	...sources: Record<string, any>[]
): Record<string, any> {
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

			if (
				'object' !== typeof src[i] ||
				dst[i] === undefined ||
				Array.isArray(src[i])
			) {
				dst[i] = src[i];
			} else {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				merge(dst[i], src[i]);
			}
		}
	}

	return dst;
}

export function merge<T>(dst: T, ...sources: Partial<T>[]): T {
	return mergeImpl(dst as never, ...sources) as T;
}
