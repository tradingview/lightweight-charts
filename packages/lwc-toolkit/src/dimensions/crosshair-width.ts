/**
 * Default grid / crosshair line width in Bitmap sizing
 * @param horizontalPixelRatio - horizontal pixel ratio
 * @returns default grid / crosshair line width in Bitmap sizing
 */
export function gridAndCrosshairBitmapWidth(
	horizontalPixelRatio: number
): number {
	return Math.max(1, Math.floor(horizontalPixelRatio));
}

/**
 * Default grid / crosshair line width in Media sizing
 * @param horizontalPixelRatio - horizontal pixel ratio
 * @returns default grid / crosshair line width in Media sizing
 */
export function gridAndCrosshairMediaWidth(
	horizontalPixelRatio: number
): number {
	return (
		gridAndCrosshairBitmapWidth(horizontalPixelRatio) / horizontalPixelRatio
	);
}
