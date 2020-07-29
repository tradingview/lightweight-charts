/**
 * (x, y)
 * O***********************|*****
 * |        border         |  ^
 * |   *****************   |  |
 * |   |               |   |  |
 * | b |               | b |  h
 * | o |               | o |  e
 * | r |               | r |  i
 * | d |               | d |  g
 * | e |               | e |  h
 * | r |               | r |  t
 * |   |               |   |  |
 * |   *****************   |  |
 * |        border         |  v
 * |***********************|*****
 * |                       |
 * |<------- width ------->|
 *
 * Fills rectangle's inner border (so, all the filled area is limited by the [x, x + width]*[y, y + height] region)
 *
 * @param ctx context to draw on
 * @param x left side of the target rectangle
 * @param y top side of the target rectangle
 * @param width width of the target rectangle
 * @param height height of the target rectangle
 * @param borderWidth width of border to fill, must be less than width and height of the target rectangle
 */
export function fillRectInnerBorder(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, borderWidth: number): void {
	// horizontal (top and bottom) edges
	ctx.fillRect(x + borderWidth, y, width - borderWidth * 2, borderWidth);
	ctx.fillRect(x + borderWidth, y + height - borderWidth, width - borderWidth * 2, borderWidth);
	// vertical (left and right) edges
	ctx.fillRect(x, y, borderWidth, height);
	ctx.fillRect(x + width - borderWidth, y, borderWidth, height);
}

export function drawScaled(ctx: CanvasRenderingContext2D, ratio: number, func: () => void): void {
	ctx.save();
	ctx.scale(ratio, ratio);
	func();
	ctx.restore();
}

export function clearRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, clearColor: string): void {
	ctx.save();
	ctx.globalCompositeOperation = 'copy';
	ctx.fillStyle = clearColor;
	ctx.fillRect(x, y, w, h);
	ctx.restore();
}
