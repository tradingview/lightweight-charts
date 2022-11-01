/**
 * Fills rectangle's inner border (so, all the filled area is limited by the [x, x + width]*[y, y + height] region)
 * ```
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
 * ```
 *
 * @param ctx - Context to draw on
 * @param x - Left side of the target rectangle
 * @param y - Top side of the target rectangle
 * @param width - Width of the target rectangle
 * @param height - Height of the target rectangle
 * @param borderWidth - Width of border to fill, must be less than width and height of the target rectangle
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

export type TopBottomRadii = [number, number];
export type LeftTopRightTopRightBottomLeftBottomRadii = [number, number, number, number];
export type DrawRoundRectRadii = number | TopBottomRadii | LeftTopRightTopRightBottomLeftBottomRadii;

function changeBorderRadius(borderRadius: DrawRoundRectRadii, offset: number): typeof borderRadius {
	if (Array.isArray(borderRadius)) {
		return borderRadius.map((x: number) => x === 0 ? x : x + offset) as typeof borderRadius;
	}
	return borderRadius + offset;
}

export function drawRoundRect(
	// eslint:disable-next-line:max-params
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	radii: DrawRoundRectRadii
): void {
	let radiusLeftTop: number;
	let radiusRightTop: number;
	let radiusRightBottom: number;
	let radiusLeftBottom: number;

	if (!Array.isArray(radii)) {
		const oneRadius = Math.max(0, radii);
		radiusLeftTop = oneRadius;
		radiusRightTop = oneRadius;
		radiusRightBottom = oneRadius;
		radiusLeftBottom = oneRadius;
	} else if (radii.length === 2) {
		const cornerRadius1 = Math.max(0, radii[0]);
		const cornerRadius2 = Math.max(0, radii[1]);
		radiusLeftTop = cornerRadius1;
		radiusRightTop = cornerRadius1;
		radiusRightBottom = cornerRadius2;
		radiusLeftBottom = cornerRadius2;
	} else if (radii.length === 4) {
		radiusLeftTop = Math.max(0, radii[0]);
		radiusRightTop = Math.max(0, radii[1]);
		radiusRightBottom = Math.max(0, radii[2]);
		radiusLeftBottom = Math.max(0, radii[3]);
	} else {
		throw new Error(`Wrong border radius - it should be like css border radius`);
	}

	ctx.beginPath();
	ctx.moveTo(x + radiusLeftTop, y);
	ctx.lineTo(x + w - radiusRightTop, y);
	if (radiusRightTop !== 0) {
		ctx.arcTo(x + w, y, x + w, y + radiusRightTop, radiusRightTop);
	}

	ctx.lineTo(x + w, y + h - radiusRightBottom);
	if (radiusRightBottom !== 0) {
		ctx.arcTo(x + w, y + h, x + w - radiusRightBottom, y + h, radiusRightBottom);
	}

	ctx.lineTo(x + radiusLeftBottom, y + h);
	if (radiusLeftBottom !== 0) {
		ctx.arcTo(x, y + h, x, y + h - radiusLeftBottom, radiusLeftBottom);
	}

	ctx.lineTo(x, y + radiusLeftTop);
	if (radiusLeftTop !== 0) {
		ctx.arcTo(x, y, x + radiusLeftTop, y, radiusLeftTop);
	}
}

// eslint-disable-next-line max-params
export function drawRoundRectWithInnerBorder(
	ctx: CanvasRenderingContext2D,
	left: number,
	top: number,
	width: number,
	height: number,
	backgroundColor: string,
	borderWidth: number = 0,
	borderRadius: DrawRoundRectRadii = 0,
	borderColor: string = ''
): void {
	ctx.save();

	if (!borderWidth || !borderColor || borderColor === backgroundColor) {
		drawRoundRect(ctx, left, top, width, height, borderRadius);
		ctx.fillStyle = backgroundColor;
		ctx.fill();
		ctx.restore();
		return;
	}

	const halfBorderWidth = borderWidth / 2;

	// Draw body
	if (backgroundColor !== 'transparent') {
		const innerRadii = changeBorderRadius(borderRadius, - borderWidth);
		drawRoundRect(ctx, left + borderWidth, top + borderWidth, width - borderWidth * 2, height - borderWidth * 2, innerRadii);

		ctx.fillStyle = backgroundColor;
		ctx.fill();
	}

	// Draw border
	if (borderColor !== 'transparent') {
		const outerRadii = changeBorderRadius(borderRadius, - halfBorderWidth);
		drawRoundRect(ctx, left + halfBorderWidth, top + halfBorderWidth, width - borderWidth, height - borderWidth, outerRadii);

		ctx.lineWidth = borderWidth;
		ctx.strokeStyle = borderColor;
		ctx.closePath();
		ctx.stroke();
	}
}

// eslint-disable-next-line max-params
export function clearRectWithGradient(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, topColor: string, bottomColor: string): void {
	ctx.save();

	ctx.globalCompositeOperation = 'copy';
	const gradient = ctx.createLinearGradient(0, 0, 0, h);
	gradient.addColorStop(0, topColor);
	gradient.addColorStop(1, bottomColor);
	ctx.fillStyle = gradient;
	ctx.fillRect(x, y, w, h);

	ctx.restore();
}
