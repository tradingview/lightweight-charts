import { MediaCoordinatesRenderingScope } from 'fancy-canvas';

import { Coordinate } from '../model/coordinate';
import { SeriesItemsIndexesRange } from '../model/time-data';

import { LinePoint, LineType } from './draw-line';

// eslint-disable-next-line max-params, complexity
export function walkLine<TItem extends LinePoint, TStyle>(
	renderingScope: MediaCoordinatesRenderingScope,
	items: readonly TItem[],
	lineType: LineType,
	visibleRange: SeriesItemsIndexesRange,
	barWidth: number,
	// the values returned by styleGetter are compared using the operator !==,
	// so if styleGetter returns objects, then styleGetter should return the same object for equal styles
	styleGetter: (renderingScope: MediaCoordinatesRenderingScope, item: TItem) => TStyle,
	finishStyledArea: (ctx: CanvasRenderingContext2D, style: TStyle, areaFirstItem: LinePoint, newAreaFirstItem: LinePoint) => void
): void {
	if (items.length === 0 || visibleRange.from >= items.length) {
		return;
	}

	const ctx = renderingScope.context;

	const firstItem = items[visibleRange.from];
	let currentStyle = styleGetter(renderingScope, firstItem);
	let currentStyleFirstItem = firstItem;

	if (visibleRange.to - visibleRange.from < 2) {
		const halfBarWidth = barWidth / 2;

		ctx.beginPath();

		const item1: LinePoint = { x: firstItem.x - halfBarWidth as Coordinate, y: firstItem.y };
		const item2: LinePoint = { x: firstItem.x + halfBarWidth as Coordinate, y: firstItem.y };

		ctx.moveTo(item1.x, item1.y);
		ctx.lineTo(item2.x, item2.y);

		finishStyledArea(ctx, currentStyle, item1, item2);

		return;
	}

	const changeStyle = (newStyle: TStyle, currentItem: TItem) => {
		finishStyledArea(ctx, currentStyle, currentStyleFirstItem, currentItem);

		ctx.beginPath();
		currentStyle = newStyle;
		currentStyleFirstItem = currentItem;
	};

	let currentItem = currentStyleFirstItem;

	ctx.beginPath();
	ctx.moveTo(firstItem.x, firstItem.y);

	for (let i = visibleRange.from + 1; i < visibleRange.to; ++i) {
		currentItem = items[i];
		const itemStyle = styleGetter(renderingScope, currentItem);

		switch (lineType) {
			case LineType.Simple:
				ctx.lineTo(currentItem.x, currentItem.y);
				break;
			case LineType.WithSteps:
				ctx.lineTo(currentItem.x, items[i - 1].y);

				if (itemStyle !== currentStyle) {
					changeStyle(itemStyle, currentItem);
					ctx.lineTo(currentItem.x, items[i - 1].y);
				}

				ctx.lineTo(currentItem.x, currentItem.y);
				break;
			case LineType.Curved: {
				const [cp1, cp2] = getControlPoints(items, i - 1, i);
				ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, currentItem.x, currentItem.y);
				break;
			}
		}

		if (lineType !== LineType.WithSteps && itemStyle !== currentStyle) {
			changeStyle(itemStyle, currentItem);
			ctx.moveTo(currentItem.x, currentItem.y);
		}
	}

	if (currentStyleFirstItem !== currentItem || currentStyleFirstItem === currentItem && lineType === LineType.WithSteps) {
		finishStyledArea(ctx, currentStyle, currentStyleFirstItem, currentItem);
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
