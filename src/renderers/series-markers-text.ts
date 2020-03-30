import { Coordinate } from '../model/coordinate';
import { SeriesMarkerText } from '../model/series-markers';

export function drawText(
	ctx: CanvasRenderingContext2D,
	text: SeriesMarkerText
): void {
	ctx.fillText(text.content, text.x, text.y);
}

export function hitTestText(
	text: SeriesMarkerText,
	x: Coordinate,
	y: Coordinate
): boolean {
	const halfHeight = text.height / 2;

	return x >= text.x && x <= text.x + text.width &&
		y >= text.y - halfHeight && y <= text.y + halfHeight;
}
