import { isFiniteNumber } from '@tradingview/lwc-toolkit/numbers';

import type { ScatterSizeMapping } from './data';
import type { ScatterRange, ScatterSizeLimits, ScatterSizeRange, ScatterSizeScale } from './options';

/** Least value of either end of `pointSizeLimits`, in CSS pixels. */
export const POINT_SIZE_LIMITS_FLOOR = 1;
/** Greatest value of either end of `pointSizeLimits`, in CSS pixels. */
export const POINT_SIZE_LIMITS_CEILING = 500;

/**
 * The default `pointSizeLimits`, in CSS pixels, stroke included: the one
 * source of the default sizes, published as `defaultOptions.pointSizeLimits`.
 */
export const DEFAULT_POINT_SIZE_LIMITS: Readonly<ScatterSizeLimits> = Object.freeze({ min: 5, max: 50 });

/**
 * The size limits in use: each end within 1–500 px, an end which is not a
 * finite number at its default (5 or 50), and the smaller end first.
 */
export function normalizeSizeLimits(limits: Partial<ScatterSizeLimits> | null | undefined): ScatterSizeLimits {
	const bound = (value: number | undefined, fallback: number): number =>
		isFiniteNumber(value)
			? Math.min(POINT_SIZE_LIMITS_CEILING, Math.max(POINT_SIZE_LIMITS_FLOOR, value))
			: fallback;
	const a = bound(limits?.min, DEFAULT_POINT_SIZE_LIMITS.min);
	const b = bound(limits?.max, DEFAULT_POINT_SIZE_LIMITS.max);
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
 * `values`. An open end the values put on the wrong side of the given one
 * (every value below a given `min`, say) is the given end: the domain is
 * that single value, and the values are beyond it — not a reversed domain,
 * which only two given ends make. `null` when an end is open and there is no
 * finite value.
 */
export function resolveSizeDomain(values: Iterable<number>, explicit: ScatterRange): SizeDomain | null {
	let min = isFiniteNumber(explicit.min) ? explicit.min : null;
	let max = isFiniteNumber(explicit.max) ? explicit.max : null;
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
		if (min !== null) {
			max = Math.max(min, high);
		} else if (max !== null) {
			min = Math.min(max, low);
		} else {
			min = low;
			max = high;
		}
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
 * are clamped to its ends. A domain of a single value draws that value at the
 * middle of the range — there is nothing to compare — and the values below
 * and above it at the ends.
 *
 * `area` interpolates the area between the areas of the two ends of the
 * range, so the diameter follows a square root. The result is always within
 * the range, which is within the size limits.
 */
export function mapSizeValue(value: number, scaling: SizeScaling): number {
	const { domain, range, scale } = scaling;
	// In halves, so that no span of finite values overflows.
	const span = domain.max / 2 - domain.min / 2;
	let t: number;
	if (span === 0) {
		t = value < domain.min ? 0 : value > domain.max ? 1 : 0.5;
	} else {
		t = Math.min(1, Math.max(0, (value / 2 - domain.min / 2) / span));
	}
	const size = scale === 'area'
		? Math.sqrt(range.min * range.min + t * (range.max * range.max - range.min * range.min))
		: range.min + t * (range.max - range.min);
	return Math.min(range.max, Math.max(range.min, size));
}

/** The size mapping as a host's bubble-size legend sees it: a snapshot, with the function the points are sized with. */
export function describeSizeMapping(scaling: SizeScaling): ScatterSizeMapping {
	return {
		domain: { ...scaling.domain },
		range: { ...scaling.range },
		scale: scaling.scale,
		sizeFor: (value: number): number => (Number.isFinite(value) ? mapSizeValue(value, scaling) : Number.NaN),
	};
}
