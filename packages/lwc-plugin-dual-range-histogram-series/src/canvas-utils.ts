export type LeftTopRightTopRightBottomLeftBottomRadii = [
	number,
	number,
	number,
	number
];

function changeBorderRadius(
	borderRadius: LeftTopRightTopRightBottomLeftBottomRadii,
	offset: number
): typeof borderRadius {
	return borderRadius.map((x: number) =>
		x === 0 ? x : x + offset
	) as typeof borderRadius;
}

export function drawRoundRect(
	// eslint-disable-next-line max-params
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	radii: LeftTopRightTopRightBottomLeftBottomRadii
): void {
	/**
	 * As of May 2023, all of the major browsers now support ctx.roundRect() so we should
	 * be able to switch to the native version soon.
	 */
	ctx.beginPath();
	if (ctx.roundRect) {
		ctx.roundRect(x, y, w, h, radii);
		return;
	}
	/*
	 * Deprecate the rest in v5.
	 */
	ctx.lineTo(x + w - radii[1], y);
	if (radii[1] !== 0) {
		ctx.arcTo(x + w, y, x + w, y + radii[1], radii[1]);
	}

	ctx.lineTo(x + w, y + h - radii[2]);
	if (radii[2] !== 0) {
		ctx.arcTo(x + w, y + h, x + w - radii[2], y + h, radii[2]);
	}

	ctx.lineTo(x + radii[3], y + h);
	if (radii[3] !== 0) {
		ctx.arcTo(x, y + h, x, y + h - radii[3], radii[3]);
	}

	ctx.lineTo(x, y + radii[0]);
	if (radii[0] !== 0) {
		ctx.arcTo(x, y, x + radii[0], y, radii[0]);
	}
}

/**
 * Draws a rounded rect with a border.
 *
 * This function assumes that the colors will be solid, without
 * any alpha. (This allows us to fix a rendering artefact.)
 *
 * @param outerBorderRadius - The radius of the border (outer edge)
 */
// eslint-disable-next-line max-params
export function drawRoundRectWithBorder(
	ctx: CanvasRenderingContext2D,
	left: number,
	top: number,
	width: number,
	height: number,
	backgroundColor: string,
	borderWidth: number = 0,
	outerBorderRadius: LeftTopRightTopRightBottomLeftBottomRadii = [0, 0, 0, 0],
	borderColor: string = ''
): void {
	ctx.save();

	if (!borderWidth || !borderColor || borderColor === backgroundColor) {
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

	if (backgroundColor !== 'transparent') {
		ctx.fillStyle = backgroundColor;
		ctx.fill();
	}

	if (borderColor !== 'transparent') {
		ctx.lineWidth = borderWidth;
		ctx.strokeStyle = borderColor;
		ctx.closePath();
		ctx.stroke();
	}

	ctx.restore();
}
