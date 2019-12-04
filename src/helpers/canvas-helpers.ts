
/** Draw rectangle with outer border defined with parameters. FillStyle is used as color
 * @param ctx context to draw on
 * @param x left outer border of the target rectangle
 * @param y top outer border of the target rectangle
 * @param w width of the target rectangle
 * @param h height of the target rectangle
 * @param lineWidth line width. Must be less than width and height
 */
export function strokeRectInnerWithFill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, lineWidth: number): void {
	ctx.fillRect(x, y, lineWidth, h);
	ctx.fillRect(x, y, w, lineWidth);
	ctx.fillRect(x, y + h - lineWidth, w, lineWidth);
	ctx.fillRect(x + w - lineWidth, y, lineWidth, h);
}
