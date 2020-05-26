
/** Draw rectangle with outer border defined with parameters. FillStyle is used as color
 * @param ctx - context to draw on
 * @param x - left outer border of the target rectangle
 * @param y - top outer border of the target rectangle
 * @param w - width of the target rectangle
 * @param h - height of the target rectangle
 * @param lineWidth - line width. Must be less than width and height
 */
export function strokeRectInnerWithFill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, lineWidth: number): void {
	// should not overlap on corners for semi-transparent colors
	// left
	ctx.fillRect(x, y, lineWidth, h);
	// top
	ctx.fillRect(x + lineWidth, y, w - lineWidth * 2, lineWidth);
	// bottom
	ctx.fillRect(x + lineWidth, y + h - lineWidth, w - lineWidth * 2, lineWidth);
	// right
	ctx.fillRect(x + w - lineWidth, y, lineWidth, h);
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
