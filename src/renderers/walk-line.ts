import { Coordinate } from '../model/coordinate';

import { LinePoint } from './draw-line';

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
 * @returns Two control points that can be used as arguments to {@link CanvasRenderingContext2D.bezierCurveTo} to draw a curved line between `points[fromPointIndex]` and `points[toPointIndex]`.
 */
export function getControlPoints(points: readonly LinePoint[], fromPointIndex: number, toPointIndex: number): [LinePoint, LinePoint] {
	const beforeFromPointIndex = Math.max(0, fromPointIndex - 1);
	const afterToPointIndex = Math.min(points.length - 1, toPointIndex + 1);
	const cp1 = add(points[fromPointIndex], divide(subtract(points[toPointIndex], points[beforeFromPointIndex]), curveTension));
	const cp2 = subtract(points[toPointIndex], divide(subtract(points[afterToPointIndex], points[fromPointIndex]), curveTension));

	return [cp1, cp2];
}
