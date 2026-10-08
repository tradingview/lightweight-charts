/*
 Numeric options arrive from JavaScript callers as well as TypeScript ones, so
 a `NaN`, a string or `null` can reach a renderer. The canvas ignores such a
 value silently — `ctx.globalAlpha = NaN` or `ctx.lineWidth = NaN` keeps
 whatever the previous draw left — so check numbers where options are read.
 */

/** Whether `value` is a number other than `NaN` and `±Infinity`. */
export function isFiniteNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}

/** `value` when it is a finite number, otherwise `fallback`. */
export function finiteOr(value: unknown, fallback: number): number {
	return isFiniteNumber(value) ? value : fallback;
}

/**
 * `value` raised to at least `0` when it is a finite number, otherwise
 * `fallback` (as it is): for widths, gaps and other pixel sizes.
 */
export function nonNegativeOr(value: unknown, fallback: number): number {
	return isFiniteNumber(value) ? Math.max(0, value) : fallback;
}

/**
 * An opacity for `globalAlpha`: `value`, or `fallback` when `value` is not
 * a finite number, clamped to `0`–`1`.
 */
export function clampOpacity(value: unknown, fallback: number): number {
	return Math.min(1, Math.max(0, finiteOr(value, fallback)));
}
