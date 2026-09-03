import { Coordinate } from '../model/coordinate';
import { HitTestPriority, InternalHitTestCandidate } from '../model/internal-hit-test';
import { SeriesItemsIndexesRange } from '../model/time-data';

import { LinePoint, LineType } from './draw-line';
import { distanceToSegment, hoveredSeriesHitTestResult, isWithinHorizontalSweep, lowerBoundByX, upperBoundByX } from './hit-test-common';
import { getControlPoints } from './walk-line';

const BEZIER_APPROXIMATION_STEPS = 12;

function cubicBezierPoint(
	p0: number,
	p1: number,
	p2: number,
	p3: number,
	t: number
): number {
	const u = 1 - t;
	return u * u * u * p0
		+ 3 * u * u * t * p1
		+ 3 * u * t * t * p2
		+ t * t * t * p3;
}

function distanceToBezierCurve(x: number, y: number, points: [LinePoint, LinePoint, LinePoint, LinePoint]): number {
	let minDistance = Number.POSITIVE_INFINITY;
	let previousPoint = points[0];

	for (let step = 1; step <= BEZIER_APPROXIMATION_STEPS; step++) {
		const t = step / BEZIER_APPROXIMATION_STEPS;
		const currentPoint: LinePoint = {
			x: cubicBezierPoint(points[0].x, points[1].x, points[2].x, points[3].x, t) as Coordinate,
			y: cubicBezierPoint(points[0].y, points[1].y, points[2].y, points[3].y, t) as Coordinate,
		};

		minDistance = Math.min(
			minDistance,
			distanceToSegment(x, y, previousPoint.x, previousPoint.y, currentPoint.x, currentPoint.y)
		);
		previousPoint = currentPoint;
	}

	return minDistance;
}

function lineSegmentHorizontalBounds(
	firstItem: LinePoint,
	secondItem: LinePoint,
	lineType: LineType,
	items: readonly LinePoint[],
	toItemIndex: number
): [number, number] {
	switch (lineType) {
		case LineType.Curved: {
			const [firstControlPoint, secondControlPoint] = getControlPoints(items, toItemIndex);
			const minX = Math.min(firstItem.x, secondItem.x, firstControlPoint.x, secondControlPoint.x);
			const maxX = Math.max(firstItem.x, secondItem.x, firstControlPoint.x, secondControlPoint.x);
			return [minX, maxX];
		}
		case LineType.WithSteps:
		case LineType.Simple:
		default: {
			const minX = Math.min(firstItem.x, secondItem.x);
			const maxX = Math.max(firstItem.x, secondItem.x);
			return [minX, maxX];
		}
	}
}

// eslint-disable-next-line max-params
function hitTestLineSegment(
	x: Coordinate,
	y: Coordinate,
	firstItem: LinePoint,
	secondItem: LinePoint,
	lineType: LineType,
	items: readonly LinePoint[],
	toItemIndex: number,
	radius: number
): number | null {
	switch (lineType) {
		case LineType.WithSteps:
			{
				const horizontalDistance = distanceToSegment(x, y, firstItem.x, firstItem.y, secondItem.x, firstItem.y);
				const verticalDistance = distanceToSegment(x, y, secondItem.x, firstItem.y, secondItem.x, secondItem.y);
				const minDistance = Math.min(horizontalDistance, verticalDistance);
				return minDistance <= radius ? minDistance : null;
			}
		case LineType.Curved: {
			const [firstControlPoint, secondControlPoint] = getControlPoints(items, toItemIndex);
			const distance = distanceToBezierCurve(x, y, [firstItem, firstControlPoint, secondControlPoint, secondItem]);
			return distance <= radius ? distance : null;
		}
		case LineType.Simple:
		default:
			{
				const distance = distanceToSegment(x, y, firstItem.x, firstItem.y, secondItem.x, secondItem.y);
				return distance <= radius ? distance : null;
			}
	}
}

// eslint-disable-next-line max-params, complexity
export function hitTestLineSeries(
	items: readonly LinePoint[],
	visibleRange: SeriesItemsIndexesRange | null,
	x: Coordinate,
	y: Coordinate,
	lineType: LineType,
	lineWidth: number,
	pointMarkersRadius?: number,
	barSpacing: number = 0,
	hitTestTolerance: number = 0
): InternalHitTestCandidate | null {
	if (visibleRange === null || visibleRange.from >= visibleRange.to || items.length === 0) {
		return null;
	}

	const radius = Math.max(lineWidth / 2, pointMarkersRadius ?? 0) + hitTestTolerance;
	let pointMinDistance = Number.POSITIVE_INFINITY;

	if (pointMarkersRadius !== undefined) {
		const pointRadius = pointMarkersRadius + hitTestTolerance;
		const pointCandidateFrom = lowerBoundByX(items, x - pointRadius, visibleRange.from, visibleRange.to);
		const pointCandidateTo = upperBoundByX(items, x + pointRadius, pointCandidateFrom, visibleRange.to);

		for (let itemIndex = pointCandidateFrom; itemIndex < pointCandidateTo; itemIndex++) {
			const item = items[itemIndex];
			if (!isWithinHorizontalSweep(x, item.x, item.x, pointMarkersRadius + hitTestTolerance)) {
				continue;
			}
			const distance = Math.hypot(x - item.x, y - item.y);
			if (distance <= pointMarkersRadius + hitTestTolerance) {
				pointMinDistance = Math.min(pointMinDistance, distance);
			}
		}
	}

	if (visibleRange.to - visibleRange.from < 2) {
		const item = items[visibleRange.from];
		const singlePointHalfWidth = Math.max(barSpacing / 2, radius);
		const distance = distanceToSegment(x, y, item.x - singlePointHalfWidth, item.y, item.x + singlePointHalfWidth, item.y);
		if (distance <= radius) {
			pointMinDistance = Math.min(pointMinDistance, distance);
		}
		return Number.isFinite(pointMinDistance) ? hoveredSeriesHitTestResult(pointMinDistance, HitTestPriority.Point, 'series-point') : null;
	}

	let lineMinDistance = Number.POSITIVE_INFINITY;
	const lineCandidateFrom = lowerBoundByX(items, x - radius, visibleRange.from, visibleRange.to);
	const lineCandidateTo = upperBoundByX(items, x + radius, lineCandidateFrom, visibleRange.to);
	const segmentFrom = Math.max(visibleRange.from + 1, lineCandidateFrom);
	const segmentTo = Math.min(visibleRange.to, lineCandidateTo + 1);

	for (let itemIndex = segmentFrom; itemIndex < segmentTo; itemIndex++) {
		const previousItem = items[itemIndex - 1];
		const currentItem = items[itemIndex];
		const [leftX, rightX] = lineSegmentHorizontalBounds(previousItem, currentItem, lineType, items, itemIndex);
		if (!isWithinHorizontalSweep(x, leftX, rightX, radius)) {
			continue;
		}
		const distance = hitTestLineSegment(x, y, previousItem, currentItem, lineType, items, itemIndex, radius);
		if (distance !== null) {
			lineMinDistance = Math.min(lineMinDistance, distance);
		}
	}

	if (Number.isFinite(pointMinDistance)) {
		return hoveredSeriesHitTestResult(pointMinDistance, HitTestPriority.Point, 'series-point');
	}

	return Number.isFinite(lineMinDistance) ? hoveredSeriesHitTestResult(lineMinDistance, HitTestPriority.Line, 'series-line') : null;
}
