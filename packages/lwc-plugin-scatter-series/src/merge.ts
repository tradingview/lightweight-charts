/**
 * Keys never copied from options: assigning `__proto__` would change the
 * prototype of the copy (an own `__proto__` key comes from `JSON.parse`).
 */
export function isUnsafeKey(key: string): boolean {
	return key === '__proto__' || key === 'constructor' || key === 'prototype';
}

/** Whether a value is a plain object literal, which option merging recurses into. */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value) &&
		Object.getPrototypeOf(value) === Object.prototype;
}

/**
 * A deep copy of the plain objects and arrays of `value`, so that the copy
 * shares none of them with it. Functions and other objects are kept as they
 * are.
 */
export function cloneOptions<T>(value: T): T {
	if (Array.isArray(value)) {
		return value.map((item: unknown) => cloneOptions(item)) as T;
	}
	if (isPlainObject(value)) {
		const result: Record<string, unknown> = {};
		for (const key of Object.keys(value)) {
			if (!isUnsafeKey(key)) {
				result[key] = cloneOptions(value[key]);
			}
		}
		return result as T;
	}
	return value;
}

/** Freezes `value` and its plain objects and arrays, for defaults that must never change. */
export function freezeOptions<T>(value: T): T {
	if (Array.isArray(value) || isPlainObject(value)) {
		for (const item of Object.values(value as object)) {
			freezeOptions(item);
		}
		Object.freeze(value);
	}
	return value;
}

/**
 * Deep merge of plain objects into a new object, which shares no plain object
 * or array with either argument: changing it never changes them. Arrays,
 * functions and `null` replace what is there; `__proto__`, `constructor` and
 * `prototype` keys are skipped.
 */
export function mergeOptions<T>(target: T, source: unknown): T {
	if (!isPlainObject(target) || !isPlainObject(source)) {
		return cloneOptions((source === undefined ? target : source) as T);
	}
	const result = cloneOptions(target) as Record<string, unknown>;
	for (const key of Object.keys(source)) {
		const value = source[key];
		if (value === undefined || isUnsafeKey(key)) {
			continue;
		}
		result[key] = isPlainObject(value) && isPlainObject(result[key])
			? mergeOptions(result[key], value)
			: cloneOptions(value);
	}
	return result as T;
}
