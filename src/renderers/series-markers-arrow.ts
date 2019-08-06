import { Coordinate } from '../model/coordinate';

import { hitTestSquare } from './series-markers-square';
import { size } from './series-markers-utils';

export function drawArrow(
	up: boolean,
	ctx: CanvasRenderingContext2D,
	centerX: Coordinate,
	centerY: Coordinate,
	color: string,
	barSpacing: number
): void {
	const arrowSize = size(barSpacing, 1);
	const halfArrowSize = (arrowSize - 1) / 2;
	const baseSize = size(barSpacing, 0.5);
	const halfBaseSize = (baseSize - 1) / 2;
	ctx.fillStyle = color;
	ctx.beginPath();
	if (up) {
		ctx.moveTo(centerX - halfArrowSize, centerY);
		ctx.lineTo(centerX, centerY - halfArrowSize);
		ctx.lineTo(centerX + halfArrowSize, centerY);
		ctx.lineTo(centerX + halfBaseSize, centerY);
		ctx.lineTo(centerX + halfBaseSize, centerY + halfArrowSize);
		ctx.lineTo(centerX - halfBaseSize, centerY + halfArrowSize);
		ctx.lineTo(centerX - halfBaseSize, centerY);
	} else {
		ctx.moveTo(centerX - halfArrowSize, centerY);
		ctx.lineTo(centerX, centerY + halfArrowSize);
		ctx.lineTo(centerX + halfArrowSize, centerY);
		ctx.lineTo(centerX + halfBaseSize, centerY);
		ctx.lineTo(centerX + halfBaseSize, centerY - halfArrowSize);
		ctx.lineTo(centerX - halfBaseSize, centerY - halfArrowSize);
		ctx.lineTo(centerX - halfBaseSize, centerY);
	}
	ctx.fill();
}

export function hitTestArrow(
	up: boolean,
	centerX: Coordinate,
	centerY: Coordinate,
	barSpacing: number,
	x: Coordinate,
	y: Coordinate
): boolean {
	// TODO: implement arrow hit test
	return hitTestSquare(centerX, centerY, barSpacing, x, y);
}
