import { markerDistance } from '@tradingview/lwc-toolkit/canvas/markers';
import { distanceToRange } from '@tradingview/lwc-toolkit/custom-series/hit-test';
import { candlestickWidth } from '@tradingview/lwc-toolkit/dimensions/candles';
import { gridAndCrosshairBitmapWidth } from '@tradingview/lwc-toolkit/dimensions/crosshair-width';
import { isFiniteNumber } from '@tradingview/lwc-toolkit/numbers';

import { BoxWhiskerData } from './data';

/** Widths of the parts of a box plot, in bitmap pixels. */
export interface BoxWhiskerWidths {
	/** The box, as wide as a candlestick body at the same bar spacing. */
	body: number;
	/** The horizontal caps at the whisker ends. */
	cap: number;
	/** The median line, as wide as the slot and never narrower than the box. */
	median: number;
	/** The vertical whisker line, as thin as the grid. */
	whisker: number;
	/** Thickness of the horizontal lines (caps and median), as thin as the grid. */
	line: number;
	/** Radius of an outlier dot. */
	outlierRadius: number;
}

/**
 * The widths of a box plot's parts at a bar spacing, in bitmap pixels, from
 * the same rules the library uses for a candlestick, so a box plot sits on the
 * same pixel grid as candles do. An outlier dot shrinks with the box but stays
 * at least 1.5 CSS pixels in radius, so it is visible however narrow the box.
 */
export function boxWhiskerWidths(barSpacing: number, horizontalPixelRatio: number, verticalPixelRatio: number): BoxWhiskerWidths {
	const body = candlestickWidth(barSpacing, horizontalPixelRatio);
	const whisker = gridAndCrosshairBitmapWidth(horizontalPixelRatio);
	let median = Math.max(Math.floor(barSpacing * horizontalPixelRatio), body);
	// Same parity as the whisker, so the median line overhangs the whisker by
	// the same number of pixels on both sides, as the box and the caps do.
	if ((median - whisker) % 2 !== 0) {
		median += median - 1 >= body ? -1 : 1;
	}
	return {
		body,
		cap: candlestickWidth(barSpacing / 2, horizontalPixelRatio),
		median,
		whisker,
		line: gridAndCrosshairBitmapWidth(verticalPixelRatio),
		outlierRadius: Math.min(4 * horizontalPixelRatio, Math.max(1.5 * horizontalPixelRatio, body / 2)),
	};
}

/** The five numbers of a box plot, in the order they are drawn from the bottom. */
export type FiveNumbers = readonly [min: number, q1: number, median: number, q3: number, max: number];

type BoxPlotFields = Pick<BoxWhiskerData<unknown>, 'min' | 'q1' | 'median' | 'q3' | 'max'>;

/** The five numbers of a point, which the series reads in this order. */
export function fiveNumbers(point: BoxPlotFields): FiveNumbers {
	return [point.min, point.q1, point.median, point.q3, point.max];
}

/**
 * Whether a point can be drawn: all five numbers are finite. The series treats
 * any other point, a missing or `null` number included, as whitespace. The
 * order of the numbers is not checked: autoscale uses the lowest and the
 * highest of them, and the whiskers end at `min` and `max` as given.
 */
export function isBoxPlot(point: Partial<Record<keyof BoxPlotFields, unknown>>): boolean {
	return isFiniteNumber(point.min)
		&& isFiniteNumber(point.q1)
		&& isFiniteNumber(point.median)
		&& isFiniteNumber(point.q3)
		&& isFiniteNumber(point.max);
}

/** The finite values among a point's outliers, which may be missing or `null`. */
function finiteOutliers(outliers: readonly number[] | null | undefined): number[] {
	return (outliers ?? []).filter(Number.isFinite);
}

/**
 * The values the chart autoscales on: the highest and the lowest of the five
 * numbers, the outliers' extremes, so that every dot is in view, and the
 * median last, which is what the price line and the last value label show.
 */
export function boxWhiskerPlotValues(point: BoxPlotFields & Pick<BoxWhiskerData<unknown>, 'outliers'>): number[] {
	const numbers = fiveNumbers(point);
	const values = [Math.max(...numbers), Math.min(...numbers)];
	const outliers = finiteOutliers(point.outliers);
	if (outliers.length > 0) {
		values.push(Math.max(...outliers), Math.min(...outliers));
	}
	values.push(point.median);
	return values;
}

/** One box plot as drawn, in media coordinates. */
export interface BoxWhiskerShape {
	x: number;
	/** The five numbers as y coordinates, in the order of `fiveNumbers`. */
	ys: readonly number[];
	/** The outliers as y coordinates; `NaN` for one that is not a finite number. */
	outlierYs: readonly number[];
	/**
	 * The widths, taken at a pixel ratio of 1, in CSS pixels: the chart hands a
	 * hit test media coordinates only, so they can differ from what is drawn at
	 * other ratios by a pixel.
	 */
	bodyWidth: number;
	capWidth: number;
	medianWidth: number;
	whiskerWidth: number;
	/** Thickness of the median line and the caps. */
	lineWidth: number;
	outlierRadius: number;
}

/** The part of a box plot under a point, and how far the point is from it. */
export interface BoxWhiskerHit {
	/** `'box'`, `'median'`, `'whisker'` or `'outlier-<index>'`, the index into `outliers`. */
	part: string;
	distance: number;
}

function rectDistance(x: number, y: number, left: number, right: number, top: number, bottom: number): number {
	const dx = distanceToRange(x, left, right);
	const dy = distanceToRange(y, top, bottom);
	return Math.sqrt(dx * dx + dy * dy);
}

/**
 * The part of a box plot nearest to a point, in CSS pixels, `0` when the point
 * is on it. On the median line, which is drawn over the box, the median wins;
 * elsewhere inside the box, the box wins over the whisker line running through
 * it.
 */
export function boxWhiskerHit(shape: BoxWhiskerShape, x: number, y: number): BoxWhiskerHit {
	const [y0, y1, y2, y3, y4] = shape.ys;
	const halfLine = shape.lineWidth / 2;
	const median = rectDistance(x, y, shape.x - shape.medianWidth / 2, shape.x + shape.medianWidth / 2, y2 - halfLine, y2 + halfLine);
	if (median === 0) {
		return { part: 'median', distance: 0 };
	}
	const box = rectDistance(x, y, shape.x - shape.bodyWidth / 2, shape.x + shape.bodyWidth / 2, y1, y3);
	if (box === 0) {
		return { part: 'box', distance: 0 };
	}
	const halfWhisker = shape.whiskerWidth / 2;
	const halfCap = shape.capWidth / 2;
	const whisker = Math.min(
		rectDistance(x, y, shape.x - halfWhisker, shape.x + halfWhisker, y0, y4),
		rectDistance(x, y, shape.x - halfCap, shape.x + halfCap, y0, y0),
		rectDistance(x, y, shape.x - halfCap, shape.x + halfCap, y4, y4)
	);
	let best: BoxWhiskerHit = box <= whisker ? { part: 'box', distance: box } : { part: 'whisker', distance: whisker };
	if (median < best.distance) {
		best = { part: 'median', distance: median };
	}
	shape.outlierYs.forEach((outlierY: number, index: number) => {
		const distance = markerDistance('circle', x - shape.x, y - outlierY, shape.outlierRadius);
		if (distance < best.distance) {
			best = { part: `outlier-${index}`, distance };
		}
	});
	return best;
}
