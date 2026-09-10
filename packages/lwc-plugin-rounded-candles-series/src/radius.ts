/**
 * The corner radius of a candle body: a constant, or computed from the current
 * bar spacing.
 */
export type RoundedCandleRadius = number | ((barSpacing: number) => number);

/** Resolves the `radius` option for one bar spacing. */
export function resolveRadius(
	radius: RoundedCandleRadius,
	barSpacing: number
): number {
	return typeof radius === 'number' ? radius : radius(barSpacing);
}
