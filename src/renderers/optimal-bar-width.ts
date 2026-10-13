export function optimalBarWidth(barSpacing: number, pixelRatio: number): number {
	return Math.floor(barSpacing * 0.3 * pixelRatio);
}

export function optimalCandlestickWidth(barSpacing: number, pixelRatio: number): number {
	const barSpacingSpecialCaseFrom = 2.5;
	const barSpacingSpecialCaseTo = 4;
	const barSpacingSpecialCaseCoeff = 3;
	const scaledBarSpacing = Math.floor(barSpacing * pixelRatio);
	let res: number;
	if (barSpacing >= barSpacingSpecialCaseFrom && barSpacing <= barSpacingSpecialCaseTo) {
		res = Math.floor(barSpacingSpecialCaseCoeff * pixelRatio);
	} else {
		// coeff should be 1 on small barspacing and go to 0.8 while groing bar spacing
		const barSpacingReducingCoeff = 0.2;
		const coeff = 1 - barSpacingReducingCoeff * Math.atan(Math.max(barSpacingSpecialCaseTo, barSpacing) - barSpacingSpecialCaseTo) / (Math.PI * 0.5);
		res = Math.floor(barSpacing * coeff * pixelRatio);
	}
	// the candle must not be wider than the bar spacing, otherwise adjacent candles overlap
	const optimal = Math.min(res, scaledBarSpacing);
	return Math.max(Math.floor(pixelRatio), optimal);
}
