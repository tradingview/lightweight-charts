import type { ScatterRange, ScatterSizeLimits, ScatterSizeRange, ScatterSizeScale } from './options';

/** Default smallest size of a point (`pointSizeLimits.min`), in CSS pixels, stroke included. */
export const SCATTER_MIN_POINT_SIZE = 5;
/** Default largest size of a point (`pointSizeLimits.max`), in CSS pixels, stroke included. */
export const SCATTER_MAX_POINT_SIZE = 50;

/** Least value of either end of `pointSizeLimits`, in CSS pixels. */
export const POINT_SIZE_LIMITS_FLOOR = 1;
/** Greatest value of either end of `pointSizeLimits`, in CSS pixels. */
export const POINT_SIZE_LIMITS_CEILING = 500;

/** The default `pointSizeLimits`. */
export const DEFAULT_POINT_SIZE_LIMITS: Readonly<ScatterSizeLimits> = Object.freeze({
	min: SCATTER_MIN_POINT_SIZE,
	max: SCATTER_MAX_POINT_SIZE,
});

/**
 * The size limits in use: each end within 1–500 px, an end which is not a
 * finite number at its default (5 or 50), and the smaller end first.
 */
export function normalizeSizeLimits(limits: Partial<ScatterSizeLimits> | null | undefined): ScatterSizeLimits {
	const bound = (value: number | undefined, fallback: number): number =>
		typeof value === 'number' && Number.isFinite(value)
			? Math.min(POINT_SIZE_LIMITS_CEILING, Math.max(POINT_SIZE_LIMITS_FLOOR, value))
			: fallback;
	const a = bound(limits?.min, SCATTER_MIN_POINT_SIZE);
	const b = bound(limits?.max, SCATTER_MAX_POINT_SIZE);
	return a <= b ? { min: a, max: b } : { min: b, max: a };
}

/**
 * Clamps a size to the limits, already normalised with
 * {@link normalizeSizeLimits}. A size which is not a finite number gives the
 * smallest size.
 */
export function clampPointSize(size: number, limits: Readonly<ScatterSizeLimits> = DEFAULT_POINT_SIZE_LIMITS): number {
	if (!Number.isFinite(size)) {
		return limits.min;
	}
	return Math.min(limits.max, Math.max(limits.min, size));
}

/** A size range with both ends clamped to the limits and in increasing order. */
export function normalizeSizeRange(
	range: ScatterSizeRange,
	limits: Readonly<ScatterSizeLimits> = DEFAULT_POINT_SIZE_LIMITS
): ScatterSizeRange {
	const a = clampPointSize(range.min, limits);
	const b = clampPointSize(range.max, limits);
	return a <= b ? { min: a, max: b } : { min: b, max: a };
}

/**
 * Width of the stroke drawn around a marker of `size` pixels: the stroke
 * asked for, but at most a quarter of the size, so that a small marker keeps
 * at least half its diameter for its colour (or, hollow, for its hole) rather
 * than vanishing under its ring.
 */
export function cappedStrokeWidth(size: number, strokeWidth: number): number {
	return Math.min(strokeWidth, size / 4);
}

/** The values mapped to the ends of the size range. */
export interface SizeDomain {
	/** Value drawn at `sizeRange.min`. */
	min: number;
	/** Value drawn at `sizeRange.max`. */
	max: number;
}

/**
 * The size domain: the given ends of `explicit`, the open ones taken from
 * `values`. `null` when an end is open and there is no finite value.
 */
export function resolveSizeDomain(values: Iterable<number>, explicit: ScatterRange): SizeDomain | null {
	let min = explicit.min !== null && Number.isFinite(explicit.min) ? explicit.min : null;
	let max = explicit.max !== null && Number.isFinite(explicit.max) ? explicit.max : null;
	if (min === null || max === null) {
		let low = Number.POSITIVE_INFINITY;
		let high = Number.NEGATIVE_INFINITY;
		for (const value of values) {
			if (Number.isFinite(value)) {
				low = Math.min(low, value);
				high = Math.max(high, value);
			}
		}
		if (low > high) {
			return null;
		}
		min = min ?? low;
		max = max ?? high;
	}
	return { min, max };
}

/** Everything {@link mapSizeValue} needs besides the value. */
export interface SizeScaling {
	/** The values mapped to the ends of the range. */
	domain: SizeDomain;
	/** The sizes, already normalised with {@link normalizeSizeRange}. */
	range: ScatterSizeRange;
	/** Linear in the diameter or in the area. */
	scale: ScatterSizeScale;
}

/**
 * The size of a point whose `sizeValue` is `value`. Values outside the domain
 * are clamped to its ends. A domain of a single value draws every point at the
 * middle of the range — there is nothing to compare.
 *
 * `area` interpolates the area between the areas of the two ends of the
 * range, so the diameter follows a square root. The result is always within
 * the range, which is within the size limits.
 */
export function mapSizeValue(value: number, scaling: SizeScaling): number {
	const { domain, range, scale } = scaling;
	const span = domain.max - domain.min;
	let t: number;
	if (span === 0 || !Number.isFinite(span)) {
		t = 0.5;
	} else {
		t = Math.min(1, Math.max(0, (value - domain.min) / span));
	}
	const size = scale === 'area'
		? Math.sqrt(range.min * range.min + t * (range.max * range.max - range.min * range.min))
		: range.min + t * (range.max - range.min);
	return Math.min(range.max, Math.max(range.min, size));
}
