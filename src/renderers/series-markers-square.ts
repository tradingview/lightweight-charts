import { Coordinate } from '../model/coordinate';
import { SeriesMarkerText } from '../model/series-markers';

import { shapeSize, textPosition } from './series-markers-utils';

export function drawSquare(
	ctx: CanvasRenderingContext2D,
	centerX: Coordinate,
	centerY: Coordinate,
	color: string,
	size: number,
	text?: SeriesMarkerText
): void {
	const squareSize = shapeSize('square', size);
	const halfSize = (squareSize - 1) / 2;
	const left = centerX - halfSize;
	const top = centerY - halfSize;

	ctx.fillStyle = color;

	if (text !== undefined) {
		ctx.fillText(text.content, ...textPosition(centerX, centerY, text, squareSize));
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
