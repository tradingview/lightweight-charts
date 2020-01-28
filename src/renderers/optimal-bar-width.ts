export function optimalBarWidth(barSpacing: number, pixelRatio: number): number {
	return Math.floor(barSpacing * 0.3 * pixelRatio);
}

export function optimalCandlestickWidth(barSpacing: number, pixelRatio: number): number {
	const res = Math.floor(barSpacing * 0.8 * pixelRatio);
	const scaledBarSpacing = Math.floor(barSpacing * pixelRatio);
	const optimal = Math.min(res, scaledBarSpacing - 1);
	return Math.max(1, optimal);
}
