import { BitmapPositionLength } from './common';

/**
 * Calculates the position and width which will completely full the space for the bar.
 * Useful if you want to draw something that will not have any gaps between surrounding bars.
 * @param xMedia - x coordinate of the bar defined in media sizing
 * @param halfBarSpacingMedia - half the width of the current barSpacing (un-rounded)
 * @param horizontalPixelRatio - horizontal pixel ratio
 * @returns position and width which will completely full the space for the bar
 */
export function fullBarWidth(
	xMedia: number,
	halfBarSpacingMedia: number,
	horizontalPixelRatio: number
): BitmapPositionLength {
	const fullWidthLeftMedia = xMedia - halfBarSpacingMedia;
	const fullWidthRightMedia = xMedia + halfBarSpacingMedia;
	const fullWidthLeftBitmap = Math.round(
		fullWidthLeftMedia * horizontalPixelRatio
	);
	const fullWidthRightBitmap = Math.round(
		fullWidthRightMedia * horizontalPixelRatio
	);
	const fullWidthBitmap = fullWidthRightBitmap - fullWidthLeftBitmap;
	return {
		position: fullWidthLeftBitmap,
		length: fullWidthBitmap,
	};
}
