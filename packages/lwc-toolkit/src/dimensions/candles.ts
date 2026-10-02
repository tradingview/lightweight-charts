function optimalCandlestickWidth(
	barSpacing: number,
	pixelRatio: number
): number {
	const barSpacingSpecialCaseFrom = 2.5;
	const barSpacingSpecialCaseTo = 4;
	const barSpacingSpecialCaseCoeff = 3;
	if (
		barSpacing >= barSpacingSpecialCaseFrom &&
		barSpacing <= barSpacingSpecialCaseTo
	) {
		return Math.floor(barSpacingSpecialCaseCoeff * pixelRatio);
	}
	// coeff should be 1 on small barspacing and go to 0.8 while groing bar spacing
	const barSpacingReducingCoeff = 0.2;
	const coeff =
		1 -
		(barSpacingReducingCoeff *
			Math.atan(
				Math.max(barSpacingSpecialCaseTo, barSpacing) - barSpacingSpecialCaseTo
			)) /
			(Math.PI * 0.5);
	const res = Math.floor(barSpacing * coeff * pixelRatio);
	const scaledBarSpacing = Math.floor(barSpacing * pixelRatio);
	const optimal = Math.min(res, scaledBarSpacing);
	return Math.max(Math.floor(pixelRatio), optimal);
}

/**
 * Calculates the candlestick width that the library would use for the current
 * bar spacing.
 * @param barSpacing bar spacing in media coordinates
 * @param horizontalPixelRatio - horizontal pixel ratio
 * @returns The width (in bitmap coordinates) that the chart would use to draw a candle body
 */
export function candlestickWidth(
	barSpacing: number,
	horizontalPixelRatio: number
): number {
	let width = optimalCandlestickWidth(barSpacing, horizontalPixelRatio);
	if (width >= 2) {
		const wickWidth = Math.floor(horizontalPixelRatio);
		if (wickWidth % 2 !== width % 2) {
			width--;
		}
	}
	return width;
}
