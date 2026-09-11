import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';

import { Coordinate } from '../model/coordinate';
import { SeriesItemsIndexesRange } from '../model/time-data';

import { LinePoint, LineType } from './draw-line';

function distanceByCoordinates(p1x: number, p1y: number, p2x: number, p2y: number): number {
	return Math.hypot(p2x - p1x, p2y - p1y);
}

// eslint-disable-next-line max-params, complexity
export function walkLine<TItem extends LinePoint, TStyle extends CanvasRenderingContext2D['fillStyle' | 'strokeStyle']>(
	renderingScope: BitmapCoordinatesRenderingScope,
	items: readonly TItem[],
	lineType: LineType,
	visibleRange: SeriesItemsIndexesRange,
	barWidth: number,
	// the values returned by styleGetter are compared using the operator !==,
	// so if styleGetter returns objects, then styleGetter should return the same object for equal styles
	styleGetter: (renderingScope: BitmapCoordinatesRenderingScope, item: TItem) => TStyle,
	finishStyledArea: (renderingScope: BitmapCoordinatesRenderingScope, style: TStyle, areaFirstItem: LinePoint, newAreaFirstItem: LinePoint) => void,
	dashPatternLength: number = 0
): void {
	if (items.length === 0 || visibleRange.from >= items.length || visibleRange.to <= 0) {
		return;
	}

	const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = renderingScope;

	const firstItem = items[visibleRange.from];
	let currentStyle = styleGetter(renderingScope, firstItem);
	let currentStyleFirstItem = firstItem;

	if (visibleRange.to - visibleRange.from < 2) {
		const halfBarWidth = barWidth / 2;

		ctx.beginPath();

		const item1: LinePoint = { x: firstItem.x - halfBarWidth as Coordinate, y: firstItem.y };
		const item2: LinePoint = { x: firstItem.x + halfBarWidth as Coordinate, y: firstItem.y };

		ctx.moveTo(item1.x * horizontalPixelRatio, item1.y * verticalPixelRatio);
		ctx.lineTo(item2.x * horizontalPixelRatio, item2.y * verticalPixelRatio);

		finishStyledArea(renderingScope, currentStyle, item1, item2);
	} else {
		const shouldTrackDashOffset = dashPatternLength > 0;
		let accumulatedDistance = 0;

		const changeStyle = (newStyle: TStyle, currentItem: TItem) => {
			finishStyledArea(renderingScope, currentStyle, currentStyleFirstItem, currentItem);

			ctx.beginPath();
			currentStyle = newStyle;
			currentStyleFirstItem = currentItem;

			if (shouldTrackDashOffset) {
				const offset = accumulatedDistance % dashPatternLength;
				ctx.lineDashOffset = offset;
				// reset to the remainder to avoid floating-point precision drift over very long series.
				accumulatedDistance = offset;
			}
		};

		let currentItem = currentStyleFirstItem;

		ctx.beginPath();
		ctx.moveTo(firstItem.x * horizontalPixelRatio, firstItem.y * verticalPixelRatio);

		for (let i = visibleRange.from + 1; i < visibleRange.to; ++i) {
			currentItem = items[i];
			const currentX = currentItem.x * horizontalPixelRatio;
			const currentY = currentItem.y * verticalPixelRatio;
			const itemStyle = styleGetter(renderingScope, currentItem);

			switch (lineType) {
				case LineType.Simple: {
					ctx.lineTo(currentX, currentY);
					if (shouldTrackDashOffset) {
						const prevItem = items[i - 1];
						const prevX = prevItem.x * horizontalPixelRatio;
						const prevY = prevItem.y * verticalPixelRatio;
						accumulatedDistance += distanceByCoordinates(prevX, prevY, currentX, currentY);
					}
					break;
				}
				case LineType.WithSteps: {
					const prevItem = items[i - 1];
					const prevY = prevItem.y * verticalPixelRatio;
					ctx.lineTo(currentX, prevY);
					if (shouldTrackDashOffset) {
						accumulatedDistance += Math.abs(currentItem.x - prevItem.x) * horizontalPixelRatio;
					}

					if (itemStyle !== currentStyle) {
						changeStyle(itemStyle, currentItem);
						ctx.lineTo(currentX, prevY);
					}

					ctx.lineTo(currentX, currentY);
					if (shouldTrackDashOffset) {
						accumulatedDistance += Math.abs(currentItem.y - prevItem.y) * verticalPixelRatio;
					}
					break;
				}
				case LineType.Curved: {
					const [cp1, cp2] = getControlPoints(items, i);
					const cp1x = cp1.x * horizontalPixelRatio;
					const cp1y = cp1.y * verticalPixelRatio;
					const cp2x = cp2.x * horizontalPixelRatio;
					const cp2y = cp2.y * verticalPixelRatio;
					ctx.bezierCurveTo(
						cp1x,
						cp1y,
						cp2x,
						cp2y,
						currentX,
						currentY
					);

					if (shouldTrackDashOffset) {
						const prevItem = items[i - 1];
						const prevX = prevItem.x * horizontalPixelRatio;
						const prevY = prevItem.y * verticalPixelRatio;
						const chord = distanceByCoordinates(prevX, prevY, currentX, currentY);
						const controlPolygon = distanceByCoordinates(prevX, prevY, cp1x, cp1y) +
							distanceByCoordinates(cp1x, cp1y, cp2x, cp2y) +
							distanceByCoordinates(cp2x, cp2y, currentX, currentY);
						accumulatedDistance += (chord + controlPolygon) / 2;
					}
					break;
				}
			}

			if (lineType !== LineType.WithSteps && itemStyle !== currentStyle) {
				changeStyle(itemStyle, currentItem);
				ctx.moveTo(currentX, currentY);
			}
		}

		if (currentStyleFirstItem !== currentItem || currentStyleFirstItem === currentItem && lineType === LineType.WithSteps) {
			finishStyledArea(renderingScope, currentStyle, currentStyleFirstItem, currentItem);
		}

		if (shouldTrackDashOffset) {
			ctx.lineDashOffset = 0;
		}
	}
}

function segmentSlope(p1: LinePoint, p2: LinePoint): number {
	const width = p2.x - p1.x;
	return width !== 0 ? (p2.y - p1.y) / width : 0;
}

/**
 * This is the Fritsch-Carlson formula for monotone interpolation.
 * https://en.wikipedia.org/wiki/Monotone_cubic_interpolation
 */
function monotoneSlope(
	leftWidth: number,
	leftSlope: number,
	rightWidth: number,
	rightSlope: number
): number {
	// Points on a line always have increasing x coordinates, so segments always have a width that is greater than zero.
	// If the input does not obey this rule a slope calculation is not possible so we make the curve horizontal at the shared point.
	if (leftWidth <= 0 || rightWidth <= 0) {
		return 0;
	}

	// The slope of a segment is a good estimate of the slope of the curve at the center of that
	// segment. Thus the two segment slopes give the slope of the curve at two known positions.
	// A linear interpolation between the two known slopes gives the slope at the shared point.
	// The center of the narrow segment is nearer to the shared point than the center of the wide
	// segment. Thus the slope of the narrow segment must get the larger weight. This is the
	// reason that each slope is multiplied by the width of the other segment.
	const weightedSlope =
		(leftSlope * rightWidth + rightSlope * leftWidth) /
		(leftWidth + rightWidth);
	// `Math.sign(left) + Math.sign(right)` is +2 or -2 when the slopes are in the same up/down direction, and 0 when they don't.
	return (
		(Math.sign(leftSlope) + Math.sign(rightSlope)) *
		Math.min(Math.abs(leftSlope), Math.abs(rightSlope), 0.5 * Math.abs(weightedSlope))
	);
}

/**
 * Calculates the control points needed to draw the curve between the point at `endPointIndex - 1` and the point at `endPointIndex`.
 *
 * @returns Two control points that can be used as arguments to {@link CanvasRenderingContext2D.bezierCurveTo} to draw the curve segment.
 */
export function getControlPoints(
	points: readonly LinePoint[],
	endPointIndex: number
): [LinePoint, LinePoint] {
	// The segment (line between two points) being drawn...
	const startPoint = points[endPointIndex - 1];
	const endPoint = points[endPointIndex];
	const width = endPoint.x - startPoint.x;
	const slope = segmentSlope(startPoint, endPoint);

	// ...and its neighbouring points. Where the line begins or ends there is no neighbouring segment so
	// we pretend the line continues with a copy of the drawn segment, which makes `monotoneSlope` return
	// the drawn segment's slope, so the curve enters/leaves the line pointing straight along its first/last
	// segment (and a two point series is a straight line).
	const pointBeforeStart = endPointIndex > 1 ? points[endPointIndex - 2] : null;
	const pointAfterEnd = endPointIndex < points.length - 1 ? points[endPointIndex + 1] : null;
	const widthBefore = pointBeforeStart !== null ? startPoint.x - pointBeforeStart.x : width;
	const slopeBefore = pointBeforeStart !== null ? segmentSlope(pointBeforeStart, startPoint) : slope;
	const widthAfter = pointAfterEnd !== null ? pointAfterEnd.x - endPoint.x : width;
	const slopeAfter = pointAfterEnd !== null ? segmentSlope(endPoint, pointAfterEnd) : slope;

	// The slope the curve has as it passes through each end of the segment.
	const startPointSlope = monotoneSlope(widthBefore, slopeBefore, width, slope);
	const endPointSlope = monotoneSlope(width, slope, widthAfter, slopeAfter);

	// Each control point sits a third of the way into the segment, shifted vertically so that the
	// curve leaves `startPoint` and arrives at `endPoint` with the slopes chosen above.
	const cp1: LinePoint = {
		x: (startPoint.x + width / 3) as Coordinate,
		y: (startPoint.y + (startPointSlope * width) / 3) as Coordinate,
	};
	const cp2: LinePoint = {
		x: (endPoint.x - width / 3) as Coordinate,
		y: (endPoint.y - (endPointSlope * width) / 3) as Coordinate,
	};

	return [cp1, cp2];
}
