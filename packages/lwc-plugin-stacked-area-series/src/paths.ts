import { LinePathData, Position } from '@tradingview/lwc-toolkit/custom-series/line-paths';
import { StackedAreaLineType } from './options';

/**
 * Builds the path through `points`, which are already in bitmap coordinates,
 * joining them the way `lineType` asks for.
 *
 * The curve of `curved` is a cubic through the horizontal midpoint between
 * each pair of points, which is symmetrical: walking the same points backwards
 * traces the same shape, so the two edges of a filled band always meet. Set
 * `reversed` when the points run right to left, so that a `step` path holds
 * each value over the same interval as the forward path does.
 */
export function buildPath(
	points: readonly Position[],
	lineType: StackedAreaLineType,
	reversed: boolean = false
): LinePathData {
	const path = new Path2D();
	const first: Position = { x: 0, y: 0 };
	const last: Position = { x: 0, y: 0 };
	if (points.length === 0) {
		return { path, first, last };
	}
	path.moveTo(points[0].x, points[0].y);
	first.x = points[0].x;
	first.y = points[0].y;
	for (let i = 1; i < points.length; i++) {
		const from = points[i - 1];
		const to = points[i];
		switch (lineType) {
			case 'step':
				if (reversed) {
					path.lineTo(from.x, to.y);
				} else {
					path.lineTo(to.x, from.y);
				}
				path.lineTo(to.x, to.y);
				break;
			case 'curved': {
				const middle = (from.x + to.x) / 2;
				path.bezierCurveTo(middle, from.y, middle, to.y, to.x, to.y);
				break;
			}
			default:
				path.lineTo(to.x, to.y);
		}
	}
	last.x = points[points.length - 1].x;
	last.y = points[points.length - 1].y;
	return { path, first, last };
}
