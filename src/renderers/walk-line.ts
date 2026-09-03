import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';

import { Coordinate } from '../model/coordinate';
import { SeriesItemsIndexesRange, TimePointIndex } from '../model/time-data';

import { LinePoint, LineType } from './draw-line';

function distanceByCoordinates(p1x: number, p1y: number, p2x: number, p2y: number): number {
	return Math.hypot(p2x - p1x, p2y - p1y);
}

// eslint-disable-next-line max-params, complexity
export function walkLine<TItem extends LinePoint & { time?: TimePointIndex }, TStyle extends CanvasRenderingContext2D['fillStyle' | 'strokeStyle']>(
	renderingScope: BitmapCoordinatesRenderingScope,
	items: readonly TItem[],
	lineType: LineType,
	visibleRange: SeriesItemsIndexesRange,
	barWidth: number,
	// the values returned by styleGetter are compared using the operator !==,
	// so if styleGetter returns objects, then styleGetter should return the same object for equal styles
	styleGetter: (renderingScope: BitmapCoordinatesRenderingScope, item: TItem) => TStyle,
	finishStyledArea: (renderingScope: BitmapCoordinatesRenderingScope, style: TStyle, areaFirstItem: LinePoint, newAreaFirstItem: LinePoint) => void,
	dashPatternLength: number = 0,
	connectGaps: boolean = true
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

			const prevItem = items[i - 1];
			const isGap = !connectGaps && currentItem.time !== undefined && prevItem.time !== undefined && currentItem.time - prevItem.time > 1;

			if (isGap) {
				finishStyledArea(renderingScope, currentStyle, currentStyleFirstItem, prevItem);
				ctx.beginPath();
				currentStyle = itemStyle;
				currentStyleFirstItem = currentItem;
				ctx.moveTo(currentX, currentY);
				continue;
			}

			switch (lineType) {
				case LineType.Simple: {
					ctx.lineTo(currentX, currentY);
					if (shouldTrackDashOffset) {
						const prevX = prevItem.x * horizontalPixelRatio;
						const prevY = prevItem.y * verticalPixelRatio;
						accumulatedDistance += distanceByCoordinates(prevX, prevY, currentX, currentY);
					}
					break;
				}
				case LineType.WithSteps: {
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
					const [cp1, cp2] = getControlPoints(items, i - 1, i);
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
