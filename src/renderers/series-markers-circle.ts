import { Coordinate } from '../model/coordinate';

import { shapeSize } from './series-markers-utils';

export function drawCircle(
	ctx: CanvasRenderingContext2D,
	centerX: Coordinate,
	centerY: Coordinate,
	color: string,
	barSpacing: number
): void {
	const size = shapeSize('circle', barSpacing);
	const halfSize = (size - 1) / 2;
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(centerX, centerY, halfSize, 0, 2 * Math.PI, false);
	ctx.fill();
}

export function hitTestCircle(
	centerX: Coordinate,
	centerY: Coordinate,
	barSpacing: number,
	x: Coordinate,
	y: Coordinate
): boolean {
	const diameter = shapeSize('circle', barSpacing);
	const tolerance = 2 + diameter * 0.5;

	const xOffset = centerX - x;
	const yOffset = centerY - y;

	const dist = Math.sqrt(xOffset * xOffset + yOffset * yOffset);

	return dist <= tolerance;
}
