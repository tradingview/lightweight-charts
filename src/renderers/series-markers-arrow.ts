import { ceiledOdd } from '../helpers/mathex';

import { Coordinate } from '../model/coordinate';
import { SeriesMarkerText } from '../model/series-markers';

import { hitTestSquare } from './series-markers-square';
import { shapeSize } from './series-markers-utils';

export function drawArrow(
	// tslint:disable-next-line:max-params
	up: boolean,
	ctx: CanvasRenderingContext2D,
	centerX: Coordinate,
	centerY: Coordinate,
	color: string,
	size: number,
	text?: SeriesMarkerText
): void {
	const arrowSize = shapeSize('arrowUp', size);
	const halfArrowSize = (arrowSize - 1) / 2;
	const baseSize = ceiledOdd(size / 2);
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

	if (text !== undefined) {
		ctx.fillText(text.content, text.x, text.y);
	}

	ctx.fill();
}

export function hitTestArrow(
	up: boolean,
	centerX: Coordinate,
	centerY: Coordinate,
	size: number,
	x: Coordinate,
	y: Coordinate
): boolean {
	// TODO: implement arrow hit test
	return hitTestSquare(centerX, centerY, size, x, y);
}
