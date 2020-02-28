import { Coordinate } from '../model/coordinate';

import { shapeSize } from './series-markers-utils';

export function drawCircle(
	ctx: CanvasRenderingContext2D,
	centerX: Coordinate,
	centerY: Coordinate,
	size: number
): void {
	const circleSize = shapeSize('circle', size);
	const halfSize = (circleSize - 1) / 2;

	ctx.beginPath();
	ctx.arc(centerX, centerY, halfSize, 0, 2 * Math.PI, false);

	ctx.fill();
}

export function hitTestCircle(
	centerX: Coordinate,
	centerY: Coordinate,
	size: number,
	x: Coordinate,
	y: Coordinate
): boolean {
	const circleSize = shapeSize('circle', size);
	const tolerance = 2 + circleSize / 2;

	const xOffset = centerX - x;
	const yOffset = centerY - y;

	const dist = Math.sqrt(xOffset * xOffset + yOffset * yOffset);

	return dist <= tolerance;
}
