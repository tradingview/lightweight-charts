import { SeriesItemsIndexesRange } from '../model/time-data';

import { LinePoint, LineType } from './draw-line';
import { walkCurve } from './walk-curve';

/**
 * BEWARE: The method must be called after beginPath and before stroke/fill/closePath/etc
 */
export function walkLine(
	ctx: CanvasRenderingContext2D,
	points: readonly LinePoint[],
	lineType: LineType,
	lineTension: number,
	visibleRange: SeriesItemsIndexesRange
): void {
	if (points.length === 0) {
		return;
	}

	if (lineTension > 0 && visibleRange.to - visibleRange.from > 2) {
		walkCurve(ctx, points, lineTension, visibleRange);
		return;
	}

	const x = points[visibleRange.from].x as number;
	const y = points[visibleRange.from].y as number;
	ctx.moveTo(x, y);

	for (let i = visibleRange.from + 1; i < visibleRange.to; ++i) {
		const currItem = points[i];

		//  x---x---x   or   x---x   o   or   start
		if (lineType === LineType.WithSteps) {
			const prevY = points[i - 1].y;
			const currX = currItem.x;
			ctx.lineTo(currX, prevY);
		}

		ctx.lineTo(currItem.x, currItem.y);
	}
}
