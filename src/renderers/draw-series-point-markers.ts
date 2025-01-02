import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';

import { SeriesItemsIndexesRange } from '../model/time-data';

import { LinePoint } from './draw-line';

export function drawSeriesPointMarkers<TItem extends LinePoint, TStyle extends CanvasRenderingContext2D['fillStyle']>(
	renderingScope: BitmapCoordinatesRenderingScope,
	items: readonly TItem[],
	pointMarkersRadius: number,
	visibleRange: SeriesItemsIndexesRange,
	// the values returned by styleGetter are compared using the operator !==,
	// so if styleGetter returns objects, then styleGetter should return the same object for equal styles
	styleGetter: (renderingScope: BitmapCoordinatesRenderingScope, item: TItem) => TStyle
): void {
	if (visibleRange.to - visibleRange.from <= 0) {
		return;
	}

	const { horizontalPixelRatio, verticalPixelRatio, context } = renderingScope;
	let prevStyle: TStyle | null = null;

	const tickWidth = Math.max(1, Math.floor(horizontalPixelRatio));
	const correction = (tickWidth % 2) / 2;

	const radius = pointMarkersRadius * verticalPixelRatio + correction;
	for (let i = visibleRange.to - 1; i >= visibleRange.from; --i) {
		const point = items[i];
		if (point) {
			const style = styleGetter(renderingScope, point);
			if (style !== prevStyle) {
				context.beginPath();
				if (prevStyle !== null) {
					context.fill();
				}

				context.fillStyle = style;
				prevStyle = style;
			}

			const centerX = Math.round(point.x * horizontalPixelRatio) + correction; // correct x coordinate only
			const centerY = point.y * verticalPixelRatio;

			context.moveTo(centerX, centerY);
			context.arc(centerX, centerY, radius, 0, Math.PI * 2);
		}
	}

	context.fill();
}
