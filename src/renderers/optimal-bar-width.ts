export function optimalBarWidth(barSpacing: number, pixelRatio: number): number {
	return Math.floor(barSpacing * 0.3 * pixelRatio);
}

export function optimalCandlestickWidth(barSpacing: number, pixelRatio: number): number {
	const barSpacingSpecialCaseTo = 4;
	if (barSpacing < barSpacingSpecialCaseTo) {
		return Math.max(Math.floor(barSpacing * pixelRatio), 1);
	}
	// coeff should be 1 on small barspacing and go to 0.8 while bar spacing grows
	const barSpacingReducingCoeff = 0.2;
	const coeff = 1 - barSpacingReducingCoeff * Math.atan(Math.max(barSpacingSpecialCaseTo, barSpacing) - barSpacingSpecialCaseTo) / (Math.PI * 0.5);
	const res = Math.floor(barSpacing * coeff * pixelRatio);
	const scaledBarSpacing = Math.floor(barSpacing * pixelRatio);
	const optimal = Math.min(res, scaledBarSpacing);
	return Math.max(Math.floor(pixelRatio), optimal);
}
