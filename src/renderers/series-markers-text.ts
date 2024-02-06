import { Coordinate } from '../model/coordinate';

export function drawText(
	ctx: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	horizontalPixelRatio: number,
	verticalPixelRatio: number
): void {
	ctx.save();
	ctx.scale(horizontalPixelRatio, verticalPixelRatio);
	ctx.fillText(text, x, y);
	ctx.restore();
}

export function hitTestText(
	textX: number,
	textY: number,
	textWidth: number,
	textHeight: number,
	x: Coordinate,
	y: Coordinate
): boolean {
	const halfHeight = textHeight / 2;

	return x >= textX && x <= textX + textWidth &&
		y >= textY - halfHeight && y <= textY + halfHeight;
}
