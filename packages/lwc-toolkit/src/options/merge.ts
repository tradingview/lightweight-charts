/**
 * Whether an object key must never be copied from options: assigning
 * `__proto__` changes the prototype of the copy, and `JSON.parse` does produce
 * an own `__proto__` key. `constructor` and `prototype` are skipped with it,
 * as the library's own option merging skips them.
 */
export function isUnsafeKey(key: string): boolean {
	return key === '__proto__' || key === 'constructor' || key === 'prototype';
}

/**
 * Whether a value is a plain object: an object literal or `JSON.parse`
 * output, one made with `Object.create(null)`, or either from another realm
 * (an iframe). These are the only objects the option helpers copy and merge
 * into. Arrays, class instances, `Date`s, functions and `null` are not.
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (typeof value !== 'object' || value === null || Object.prototype.toString.call(value) !== '[object Object]') {
		return false;
	}
	// `Object.prototype` of whichever realm, which alone has no prototype of its own.
	const prototype = Object.getPrototypeOf(value) as object | null;
	return prototype === null || Object.getPrototypeOf(prototype) === null;
}

/**
 * A deep copy of the plain objects and arrays of `value`, which shares none of
 * them with it: changing the copy never changes `value`. Everything else —
 * functions, class instances, `Date`s — is kept by reference, and
 * `undefined` values are kept. Keys for which {@link isUnsafeKey} is true
 * are dropped.
 *
 * Unlike `cloneReadonly` from `simple-clone`, which round-trips through
 * JSON, this keeps functions (formatters, callbacks), `undefined`, `NaN` and
 * `Infinity` as they are, so it suits option objects.
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

/**
 * Freezes `value` together with every plain object and array inside it, and
 * returns it: for exported defaults, so that code which forgets to copy them
 * throws (in strict mode) instead of changing the defaults of every later
 * instance. Other objects inside are left as they are.
 */
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
 * Deep-merges partial options over `target` into a new object, the way a
 * plugin's `applyOptions` usually wants: a partial nested option changes only
 * the keys it names, instead of replacing the whole nested object as a spread
 * (`{ ...current, ...partial }`) does.
 *
 * - Plain objects are merged key by key, recursively.
 * - Arrays, functions and every other value replace what is there.
 * - `undefined` is skipped, so an absent key and an `undefined` one both keep
 *   the current value.
 * - `null` replaces what is there, like any other value, unless `defaults`
 *   is given: then a `null` puts the value back to its default — a copy of
 *   the value `defaults` holds at the same place — wherever that default is
 *   neither `null` nor `undefined`. With no such default the `null` is kept.
 *   This is opt-in: whether `null` means "reset" is the plugin's API decision.
 * - Keys for which {@link isUnsafeKey} is true are skipped, at every depth.
 *
 * The result shares no plain object or array with `target`, `source` or
 * `defaults`, so changing it, or them later, changes nothing else. When either
 * `target` or `source` is not a plain object, the result is a copy of
 * `source` (of `target` when `source` is `undefined`).
 *
 * @param target - the current options, or the defaults for a new instance.
 * @param source - the partial options to apply over them.
 * @param defaults - opt-in: the defaults a `null` in `source` resets to.
 */
export function mergeOptions<T>(target: T, source: unknown, defaults?: unknown): T {
	if (source === null && defaults !== undefined && defaults !== null) {
		return cloneOptions(defaults as T);
	}
	if (!isPlainObject(target) || !isPlainObject(source)) {
		return cloneOptions((source === undefined ? target : source) as T);
	}
	const result = cloneOptions(target) as Record<string, unknown>;
	const nestedDefaults = isPlainObject(defaults) ? defaults : undefined;
	for (const key of Object.keys(source)) {
		const value = source[key];
		if (value === undefined || isUnsafeKey(key)) {
			continue;
		}
		// Own keys only: an inherited `toString` is no default.
		const fallback = nestedDefaults !== undefined && Object.prototype.hasOwnProperty.call(nestedDefaults, key)
			? nestedDefaults[key]
			: undefined;
		if (value === null) {
			result[key] = fallback !== undefined && fallback !== null ? cloneOptions(fallback) : null;
		} else {
			result[key] = isPlainObject(value) && isPlainObject(result[key])
				? mergeOptions(result[key], value, fallback)
				: cloneOptions(value);
		}
	}
	return result as T;
}
