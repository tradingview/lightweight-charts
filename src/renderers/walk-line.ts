import { SeriesItemsIndexesRange } from '../model/time-data';

import { curve } from './curve-points';
import { LinePoint, LineType } from './draw-line';

/**
 * BEWARE: The method must be called after beginPath and before stroke/fill/closePath/etc
 */
export function walkLine(
	ctx: CanvasRenderingContext2D,
	points: readonly LinePoint[],
	lineType: LineType,
	visibleRange: SeriesItemsIndexesRange
): void {
	if (points.length === 0) {
		return;
	}

	const x = points[visibleRange.from].x as number;
	const y = points[visibleRange.from].y as number;
	ctx.moveTo(x, y);

	/**
	 *  For Draw smooth curves through points,
	 *  used https://github.com/gdenisov/cardinal-spline-js
	 *  pointsInFlat is array of series items => [x1,y1,x2,y2, ... ,xn,yn]
	 */
	const pointsInFlat: number[] = [];

	for (let i = visibleRange.from + 1; i < visibleRange.to; ++i) {
		const currItem = points[i];
		if (lineType === LineType.Curved) {
			pointsInFlat.push(currItem.x, currItem.y);
		} else {
			//  x---x---x   or   x---x   o   or   start
			if (lineType === LineType.WithSteps) {
				const prevY = points[i - 1].y;
				const currX = currItem.x;
				ctx.lineTo(currX, prevY);
			}

			ctx.lineTo(currItem.x, currItem.y);
		}
	}
	if (lineType === LineType.Curved) {
		curve(ctx, pointsInFlat);
	}
}
