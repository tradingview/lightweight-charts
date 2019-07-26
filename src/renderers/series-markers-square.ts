import { Coordinate } from '../model/coordinate';

import { shapeSize } from './series-markers-utils';

export function drawSquare(
	ctx: CanvasRenderingContext2D,
	centerX: Coordinate,
	centerY: Coordinate,
	color: string,
	barSpacing: number
): void {
	const size = shapeSize('square', barSpacing);
	const halfSize = (size - 1) / 2;
	const left = centerX - halfSize;
	const top = centerY - halfSize;
	ctx.fillStyle = color;
	ctx.fillRect(left, top, size, size);
}

export function hitTestSquare(
	centerX: Coordinate,
	centerY: Coordinate,
	barSpacing: number,
	x: Coordinate,
	y: Coordinate
): boolean {
	const size = shapeSize('square', barSpacing);
	const halfSize = (size - 1) / 2;
	const left = centerX - halfSize;
	const top = centerY - halfSize;

	return x >= left && x <= left + size &&
		y >= top && y <= top + size;
}
