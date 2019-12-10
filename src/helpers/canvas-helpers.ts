/** Draw rectangle with outer border defined with parameters. FillStyle is used as color
 * @param ctx context to draw on
 * @param x left outer border of the target rectangle
 * @param y top outer border of the target rectangle
 * @param w width of the target rectangle
 * @param h height of the target rectangle
 * @param lineWidth line width. Must be less than width and height
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

/**
 * Draw vertical line with pixel-perfect rendering on Hi-DPI
 * @param ctx context to draw on
 * @param x horizontal coordinate of the line
 * @param top top coordinate of the line
 * @param bottom bottom coordinate of the line
 * @param lineWidth width ot the line
 */
// tslint:disable-next-line: max-params
export function drawVerticalLine(ctx: CanvasRenderingContext2D, x: number, top: number, bottom: number, lineWidth: number): void {
	const compensation = 0.5;
	ctx.translate(compensation, 0);
	ctx.lineCap = 'butt';
	ctx.beginPath();
	ctx.moveTo(x, top);
	ctx.lineTo(x, bottom);
	ctx.stroke();
	ctx.translate(-compensation, 0);
}

/**
 * Draw horizontal line with pixel-perfect rendering on Hi-DPI
 * @param ctx context to draw on
 * @param y vertical coordinate of the line
 * @param left left coordinate of the line
 * @param right rigth coordinate of the line
 * @param lineWidth width ot the line
 * @param color color of the line
 * @param style style of the line
 */
// tslint:disable-next-line: max-params
export function drawHorizontalLine(ctx: CanvasRenderingContext2D, y: number, left: number, right: number, lineWidth: number): void {
	const compensation = 0.5;
	ctx.translate(compensation, 0);
	ctx.translate(0, compensation);
	ctx.lineCap = 'butt';
	ctx.beginPath();
	ctx.moveTo(left, y);
	ctx.lineTo(right, y);
	ctx.stroke();
	ctx.translate(0, -compensation);
}
