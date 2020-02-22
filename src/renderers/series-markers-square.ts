import { Coordinate } from '../model/coordinate';

import { shapeSize } from './series-markers-utils';

export function drawSquare(
	ctx: CanvasRenderingContext2D,
	centerX: Coordinate,
	centerY: Coordinate,
	color: string,
	size: number,
	belowBar: boolean,
	text?: string
): void {
	const squareSize = shapeSize('square', size);
	const halfSize = (squareSize - 1) / 2;
	const left = centerX - halfSize;
	const top = centerY - halfSize;

	ctx.fillStyle = color;

	if (text) {
		const textWidth = ctx.measureText(text).width;
		const textHeight = parseInt(ctx.font, 10);
		const textLeft = centerX - (textWidth / 2);
		const textMargin = textHeight / 2;
		const textTop = centerY - squareSize / 2 + (belowBar ? 1 : -1) * (squareSize + textMargin);
		ctx.fillText(text, textLeft, textTop + textHeight);
	}

	ctx.fillRect(left, top, squareSize, squareSize);
}

export function hitTestSquare(
	centerX: Coordinate,
	centerY: Coordinate,
	size: number,
	x: Coordinate,
	y: Coordinate
): boolean {
	const squareSize = shapeSize('square', size);
	const halfSize = (squareSize - 1) / 2;
	const left = centerX - halfSize;
	const top = centerY - halfSize;

	return x >= left && x <= left + squareSize &&
		y >= top && y <= top + squareSize;
}
