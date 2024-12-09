import { ceiledOdd } from '../../helpers/mathex';

import { Coordinate } from '../../model/coordinate';

import { BitmapShapeItemCoordinates, shapeSize } from './utils';

export function drawArrow(
	up: boolean,
	ctx: CanvasRenderingContext2D,
	coords: BitmapShapeItemCoordinates,
	size: number
): void {
	const arrowSize = shapeSize('arrowUp', size);
	const halfArrowSize = ((arrowSize - 1) / 2) * coords.pixelRatio;
	const baseSize = ceiledOdd(size / 2);
	const halfBaseSize = ((baseSize - 1) / 2) * coords.pixelRatio;

	ctx.beginPath();
	if (up) {
		ctx.moveTo(coords.x - halfArrowSize, coords.y);
		ctx.lineTo(coords.x, coords.y - halfArrowSize);
		ctx.lineTo(coords.x + halfArrowSize, coords.y);
		ctx.lineTo(coords.x + halfBaseSize, coords.y);
		ctx.lineTo(coords.x + halfBaseSize, coords.y + halfArrowSize);
		ctx.lineTo(coords.x - halfBaseSize, coords.y + halfArrowSize);
		ctx.lineTo(coords.x - halfBaseSize, coords.y);
	} else {
		ctx.moveTo(coords.x - halfArrowSize, coords.y);
		ctx.lineTo(coords.x, coords.y + halfArrowSize);
		ctx.lineTo(coords.x + halfArrowSize, coords.y);
		ctx.lineTo(coords.x + halfBaseSize, coords.y);
		ctx.lineTo(coords.x + halfBaseSize, coords.y - halfArrowSize);
		ctx.lineTo(coords.x - halfBaseSize, coords.y - halfArrowSize);
		ctx.lineTo(coords.x - halfBaseSize, coords.y);
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
	const arrowSize = shapeSize('arrowUp', size);
	const halfArrowSize = (arrowSize - 1) / 2;
	const baseSize = ceiledOdd(size / 2);
	const halfBaseSize = (baseSize - 1) / 2;

	const triangleTolerance = 3;
	const rectTolerance = 2;

	const baseLeft = centerX - halfBaseSize - rectTolerance;
	const baseRight = centerX + halfBaseSize + rectTolerance;
	const baseTop = up ? centerY : centerY - halfArrowSize;
	const baseBottom = up ? centerY + halfArrowSize : centerY;

	if (x >= baseLeft && x <= baseRight &&
		y >= baseTop - rectTolerance && y <= baseBottom + rectTolerance) {
		return true;
	}

	const isInTriangleBounds = (): boolean => {
		const headLeft = centerX - halfArrowSize - triangleTolerance;
		const headRight = centerX + halfArrowSize + triangleTolerance;
		const headTop = up ? centerY - halfArrowSize - triangleTolerance : centerY;
		const headBottom = up ? centerY : centerY + halfArrowSize + triangleTolerance;

		if (x < headLeft || x > headRight ||
			y < headTop || y > headBottom) {
			return false;
		}

		const dx = Math.abs(x - centerX);
		const dy = up
			? Math.abs(y - centerY) // up arrow
			: Math.abs(y - centerY); // down arrow

		return dy + triangleTolerance >= dx / 2;
	};

	return isInTriangleBounds();
}
