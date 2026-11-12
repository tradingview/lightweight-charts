import { BitmapPositionLength } from './common.js';

/**
 * Calculates the position and width which will completely full the space for the bar.
 * Useful if you want to draw something that will not have any gaps between surrounding bars.
 *
 * Unlike `positionsBox` and `positionsLine`, the returned `length` is exclusive
 * of the right edge (`right - left`, not `right - left + 1`), so that one bar's
 * `position + length` is meant to be the next bar's `position`. The shared
 * edge is rounded twice, though, once for each bar, and the chart's x
 * coordinates are not exact: where it falls on a half pixel the two can round
 * apart and leave a one pixel seam or overlap. Draw neighboring columns with
 * {@link fullBarWidthAfter} to round each shared edge once.
 *
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

/**
 * {@link fullBarWidth} for a bar drawn right after its neighbor: the column
 * starts at `previousRight`, the bitmap x where the neighbor's column ended
 * (its `position + length`), so the edge the two share is rounded once and
 * they abut with no seam and no overlap. Pass `null` for a bar with no
 * neighbor just before it, such as the first bar drawn or the first after a
 * gap, and the column starts at its own left edge.
 *
 * @param previousRight - where the neighbor's column ended, in bitmap pixels, or `null`
 * @param xMedia - x coordinate of the bar defined in media sizing
 * @param halfBarSpacingMedia - half the width of the current barSpacing (un-rounded)
 * @param horizontalPixelRatio - horizontal pixel ratio
 * @returns position and width which will completely fill the space for the bar
 */
export function fullBarWidthAfter(
	previousRight: number | null,
	xMedia: number,
	halfBarSpacingMedia: number,
	horizontalPixelRatio: number
): BitmapPositionLength {
	const own = fullBarWidth(xMedia, halfBarSpacingMedia, horizontalPixelRatio);
	if (previousRight === null) {
		return own;
	}
	const right = own.position + own.length;
	return {
		position: previousRight,
		length: Math.max(0, right - previousRight),
	};
}
