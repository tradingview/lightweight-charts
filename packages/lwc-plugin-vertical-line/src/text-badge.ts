import { drawRoundRectWithBorder } from '@tradingview/lwc-toolkit/canvas/round-rect';
import { VerticalLineBadgeOptions } from './options';

/**
 * Draws a text badge next to a vertical line, in media (CSS pixel) coordinates.
 *
 * The badge is kept inside the pane: it flips to the other side of the line and
 * is nudged away from the top and bottom edges rather than being clipped.
 *
 * @param ctx - the canvas context to draw on.
 * @param x - horizontal position of the line.
 * @param paneWidth - width of the pane.
 * @param paneHeight - height of the pane.
 * @param options - fully resolved badge options.
 */
export function drawTextBadge(
	ctx: CanvasRenderingContext2D,
	x: number,
	paneWidth: number,
	paneHeight: number,
	options: VerticalLineBadgeOptions
): void {
	if (options.text === '') {
		return;
	}
	ctx.save();
	ctx.font = options.font;
	ctx.textAlign = 'left';
	ctx.textBaseline = 'middle';

	const metrics = ctx.measureText(options.text);
	const textHeight =
		metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
	const width = metrics.width + options.padding * 2;
	const height = textHeight + options.padding * 2;

	let left =
		options.horizontalAlign === 'right'
			? x + options.margin
			: x - options.margin - width;
	// Flip to the other side rather than draw the badge off the pane.
	if (left + width > paneWidth) {
		left = x - options.margin - width;
	}
	if (left < 0) {
		left = Math.min(x + options.margin, Math.max(0, paneWidth - width));
	}

	let top: number;
	switch (options.verticalAlign) {
		case 'top':
			top = options.margin;
			break;
		case 'bottom':
			top = paneHeight - options.margin - height;
			break;
		default:
			top = (paneHeight - height) / 2;
	}
	top = Math.max(0, Math.min(paneHeight - height, top));

	const radius = Math.min(options.borderRadius, width / 2, height / 2);
	drawRoundRectWithBorder(
		ctx,
		left,
		top,
		width,
		height,
		options.backgroundColor,
		options.borderWidth,
		[radius, radius, radius, radius],
		options.borderColor
	);

	ctx.fillStyle = options.color;
	ctx.fillText(options.text, left + options.padding, top + height / 2);
	ctx.restore();
}
