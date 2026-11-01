export function optimalBarWidth(barSpacing: number, pixelRatio: number): number {
	return Math.floor(barSpacing * 0.3 * pixelRatio);
}

/**
 * The width of a candlestick body, in device pixels.
 *
 * Without an explicit `candleWidth` the body is derived from the bar
 * spacing: the wider the spacing, the wider the body, with a special
 * case that keeps small spacings readable.
 *
 * `candleWidth` (in CSS pixels) pins the body width instead. It is
 * clamped to the bar spacing — a body wider than the space between
 * two candles would overlap its neighbours.
 */
export function optimalCandlestickWidth(barSpacing: number, pixelRatio: number, candleWidth?: number): number {
	if (candleWidth !== undefined && Number.isFinite(candleWidth) && candleWidth > 0) {
		const scaledBarSpacing = Math.floor(barSpacing * pixelRatio);
		return Math.max(Math.floor(pixelRatio), Math.min(Math.floor(candleWidth * pixelRatio), scaledBarSpacing));
	}

	const barSpacingSpecialCaseFrom = 2.5;
	const barSpacingSpecialCaseTo = 4;
	const barSpacingSpecialCaseCoeff = 3;
	if (barSpacing >= barSpacingSpecialCaseFrom && barSpacing <= barSpacingSpecialCaseTo) {
		return Math.floor(barSpacingSpecialCaseCoeff * pixelRatio);
	}
	// coeff should be 1 on small barspacing and go to 0.8 while groing bar spacing
	const barSpacingReducingCoeff = 0.2;
	const coeff = 1 - barSpacingReducingCoeff * Math.atan(Math.max(barSpacingSpecialCaseTo, barSpacing) - barSpacingSpecialCaseTo) / (Math.PI * 0.5);
	const res = Math.floor(barSpacing * coeff * pixelRatio);
	const scaledBarSpacing = Math.floor(barSpacing * pixelRatio);
	const optimal = Math.min(res, scaledBarSpacing);
	return Math.max(Math.floor(pixelRatio), optimal);
}
