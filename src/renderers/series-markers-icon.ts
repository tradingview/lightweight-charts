import { Coordinate } from '../model/coordinate';

import { hitTestSquare } from './series-markers-square';
import { shapeSize } from './series-markers-utils';

export function drawIcon(
	imagesrc: string | null,
	ctx: CanvasRenderingContext2D,
	x: Coordinate,
	y: Coordinate,
	size: number
): void {
	if (imagesrc) {
		const iconSize = shapeSize('icon', size);
		const image = new Image();
		image.src = imagesrc;
		ctx.drawImage(image, x - iconSize / 2, y - iconSize / 2, iconSize, iconSize);
	}
}

export function hitTestIcon(
	centerX: Coordinate,
	centerY: Coordinate,
	size: number,
	x: Coordinate,
	y: Coordinate
): boolean {
	return hitTestSquare(centerX, centerY, size, x, y);
}
