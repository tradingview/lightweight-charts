import { Coordinate } from '../model/coordinate';
import { SeriesItemsIndexesRange } from '../model/time-data';

import { LinePoint } from './draw-line';

const subtract = (p1: LinePoint, p2: LinePoint): LinePoint => {
	return { x: p1.x - p2.x as Coordinate, y: p1.y - p2.y as Coordinate };
};

const add = (p1: LinePoint, p2: LinePoint) => {
	return { x: p1.x + p2.x as Coordinate, y: p1.y + p2.y as Coordinate };
};

const multiply = (p1: LinePoint, n: number) => {
	return { x: p1.x * n as Coordinate, y: p1.y * n as Coordinate };
};

const steps = 25;

/**
 * BEWARE: The method must be called after beginPath and before stroke/fill/closePath/etc
 */
export const walkCurve = (
	ctx: CanvasRenderingContext2D,
	points: readonly LinePoint[],
	tension: number,
	visibleRange: SeriesItemsIndexesRange
): void => {
	const from = visibleRange.from;
	const to = visibleRange.to;

	ctx.moveTo(points[from].x, points[from].y);

	// A curved line with only two points is a special case: we draw a straight line.
	if (to - from === 2) {
		ctx.lineTo(points[to - 1].x, points[to - 1].y);
		return;
	}

	walkInterpolatedCurveBetweenPoints(ctx, tension, points[from], points[from], points[from + 1], points[from + 2]);

	for (let i = from + 1; i < to - 2; i++) {
		walkInterpolatedCurveBetweenPoints(ctx, tension, points[i - 1], points[i], points[i + 1], points[i + 2]);
	}

	walkInterpolatedCurveBetweenPoints(ctx, tension, points[to - 3], points[to - 2], points[to - 1], points[to - 1]);
};

/**
 * Walk a curved line between the `curr` and `next` points.
 * `prev` and `nextNext` are used to calculate the tangents at the start and end of the curve. In other words
 * `prev` and `nextNext` are used to find the angle at which the curve should leave `curr` and arrive at `next`.
 *
 * @param ctx - The rendering context used to draw lines.
 * @param lineTension - The number used to control how curvy the line is. 0 is a straight line, 1 is very curvy.
 * @param prev - The previous point.
 * @param curr - The current point. The curve will start from this point.
 * @param next - The next point. The curve will end at this point.
 * @param nextNext - The point after the next point.
 */
export const walkInterpolatedCurveBetweenPoints = (
	ctx: CanvasRenderingContext2D,
	lineTension: number,
	prev: LinePoint,
	curr: LinePoint,
	next: LinePoint,
	nextNext: LinePoint
): void => {
	const currTangent = multiply(subtract(next, prev), lineTension);
	const nextTangent = multiply(subtract(nextNext, curr), lineTension);

	for (let step = 0; step < steps; step++) {
		const t = step / steps;
		const h1 = 2 * Math.pow(t, 3) - 3 * Math.pow(t, 2) + 1;
		const h2 = Math.pow(t, 3) - 2 * Math.pow(t, 2) + t;
		const h3 = -2 * Math.pow(t, 3) + 3 * Math.pow(t, 2);
		const h4 = Math.pow(t, 3) - Math.pow(t, 2);

		const p = add(
			multiply(curr, h1),
			add(
				multiply(currTangent, h2),
				add(multiply(next, h3), multiply(nextTangent, h4))
			)
		);

		ctx.lineTo(p.x, p.y);
	}

	ctx.lineTo(next.x, next.y);
};
