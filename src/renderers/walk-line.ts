import { Coordinate } from '../model/coordinate';
import { SeriesItemsIndexesRange } from '../model/time-data';

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

	for (let i = visibleRange.from + 1; i < visibleRange.to; ++i) {
		walkLineSegment(ctx, points, i, lineType);
	}
}

export function walkLineSegment(
	ctx: CanvasRenderingContext2D,
	points: readonly LinePoint[],
	pointIndex: number,
	lineType: LineType
): void {
	const currItem = points[pointIndex];

	switch (lineType) {
		case LineType.Simple:
			ctx.lineTo(currItem.x, currItem.y);
			break;
		case LineType.WithSteps:
			ctx.lineTo(currItem.x, points[pointIndex - 1].y);
			ctx.lineTo(currItem.x, currItem.y);
			break;
		case LineType.Curved: {
			const [cp1, cp2] = getControlPoints(points, pointIndex - 1);
			ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, currItem.x, currItem.y);
			break;
		}
	}
}

const curveTension = 6;

function subtract(p1: LinePoint, p2: LinePoint): LinePoint {
	return { x: p1.x - p2.x as Coordinate, y: p1.y - p2.y as Coordinate };
}

function add(p1: LinePoint, p2: LinePoint): LinePoint {
	return { x: p1.x + p2.x as Coordinate, y: p1.y + p2.y as Coordinate };
}

function divide(p1: LinePoint, n: number): LinePoint {
	return { x: p1.x / n as Coordinate, y: p1.y / n as Coordinate };
}

/**
  * Returns the two control points used to draw a curve between the points at `points[pointIndex]` and `points[pointIndex + 1]`.
  *
  * The control points are calculated using 4 points: `points[pointIndex - 1]`, `points[pointIndex]`, `points[pointIndex + 1]` and `points[pointIndex + 2]`.
  *
  * If any of these indexes would under/overflow the points array (for example `pointIndex + 2` when `pointIndex = points.length - 1`) then they are clamped
  * to 0 or `points.length - 1`.
  *
  * The calculation of the control points is based on a Catmull-Rom spline expressed as a Bezier curve.
  *
  * @param points - The array of points.
  * @param pointIndex - The index in `points` of the point used as the start of the curve.
  */
function getControlPoints(points: readonly LinePoint[], pointIndex: number): [LinePoint, LinePoint] {
	const startPointIndex = pointIndex;
	const endPointIndex = pointIndex + 1;
	const beforeStartPointIndex = Math.max(0, pointIndex - 1);
	const afterEndPointIndex = Math.min(points.length - 1, pointIndex + 2);
	const cp1 = add(points[startPointIndex], divide(subtract(points[endPointIndex], points[beforeStartPointIndex]), curveTension));
	const cp2 = subtract(points[endPointIndex], divide(subtract(points[afterEndPointIndex], points[startPointIndex]), curveTension));

	return [cp1, cp2];
}
