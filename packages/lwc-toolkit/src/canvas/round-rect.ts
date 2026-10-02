/**
 * Corner radii of a rectangle, in the order used by `CanvasRenderingContext2D.roundRect`:
 * top-left, top-right, bottom-right, bottom-left.
 */
export type CornerRadii = [number, number, number, number];

function changeBorderRadius(borderRadius: CornerRadii, offset: number): CornerRadii {
	return borderRadius.map((x: number) => Math.max(0, x + offset)) as CornerRadii;
}

/**
 * Clamps a desired corner radius so that it can never exceed the rectangle it is
 * drawn on: no more than half the width, and no more than the height. The result
 * is floored to a whole bitmap pixel, which keeps the rounded corner crisp.
 *
 * Pass bitmap (not media) values: multiply the media radius by the pixel ratio first.
 *
 * @param radius - the desired corner radius.
 * @param width - the width of the rectangle.
 * @param height - the height of the rectangle; a negative height (a box drawn
 * upwards from its origin) is handled by taking the absolute value.
 * @returns a radius which is safe to pass to {@link drawRoundRect}.
 */
export function clampCornerRadius(radius: number, width: number, height: number): number {
	return Math.floor(Math.min(radius, width / 2, Math.abs(height)));
}

/**
 * Starts a new path on the context and adds a rounded rectangle to it. The path is
 * left unfilled and unstroked so that the caller can decide how to paint it.
 *
 * @param ctx - the canvas context to draw on.
 * @param x - left edge of the rectangle.
 * @param y - top edge of the rectangle.
 * @param w - width of the rectangle.
 * @param h - height of the rectangle.
 * @param radii - corner radii, see {@link CornerRadii}. Use
 * {@link clampCornerRadius} if the radius may be larger than the rectangle.
 */
export function drawRoundRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	radii: CornerRadii
): void {
	ctx.beginPath();
	ctx.roundRect(x, y, w, h, radii);
}

/**
 * Fills a rounded rect, and strokes a border inside it when one is requested.
 *
 * The border is drawn centred on a path inset by half its width, so that the
 * outer edge of the stroke lines up with the requested rectangle. This assumes
 * both colours are opaque: with a translucent background the inset fill and the
 * stroke overlap and the seam becomes visible.
 *
 * The border is skipped entirely - and the full rectangle simply filled - when
 * `borderWidth` is 0, when `borderColor` is undefined, or when the border colour
 * matches the background (in which case there is nothing to see but a seam).
 *
 * @param ctx - the canvas context to draw on.
 * @param left - left edge of the rectangle.
 * @param top - top edge of the rectangle.
 * @param width - width of the rectangle.
 * @param height - height of the rectangle.
 * @param backgroundColor - fill colour.
 * @param borderWidth - width of the border, 0 for no border.
 * @param outerBorderRadius - corner radii measured on the outer edge of the border.
 * @param borderColor - border colour, undefined for no border.
 */
export function drawRoundRectWithBorder(
	ctx: CanvasRenderingContext2D,
	left: number,
	top: number,
	width: number,
	height: number,
	backgroundColor: string,
	borderWidth: number = 0,
	outerBorderRadius: CornerRadii = [0, 0, 0, 0],
	borderColor?: string
): void {
	if (width === 0 || height === 0) { return; }
	borderWidth = Math.min(Math.max(0, borderWidth), Math.abs(width), Math.abs(height));
	ctx.save();

	if (borderWidth === 0 || borderColor === undefined || borderColor === backgroundColor) {
		drawRoundRect(ctx, left, top, width, height, outerBorderRadius);
		ctx.fillStyle = backgroundColor;
		ctx.fill();
		ctx.restore();
		return;
	}

	const halfBorderWidth = borderWidth / 2;
	const radii = changeBorderRadius(outerBorderRadius, -halfBorderWidth);

	drawRoundRect(
		ctx,
		left + halfBorderWidth,
		top + halfBorderWidth,
		width - borderWidth,
		height - borderWidth,
		radii
	);

	ctx.fillStyle = backgroundColor;
	ctx.fill();

	ctx.lineWidth = borderWidth;
	ctx.strokeStyle = borderColor;
	ctx.stroke();

	ctx.restore();
}
