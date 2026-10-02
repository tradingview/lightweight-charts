import { BitmapCoordinatesRenderingScope } from './renderer-base.js';

/** A point in bitmap coordinates. */
export interface Position {
	/** Horizontal bitmap coordinate. */
	x: number;
	/** Vertical bitmap coordinate. */
	y: number;
}

/** A built line path together with the points it starts and ends at. */
export interface LinePathData {
	/** The path itself, in bitmap coordinates. */
	path: Path2D;
	/** First point of the path, in the order the path was built. */
	first: Position;
	/** Last point of the path, in the order the path was built. */
	last: Position;
}

/** The minimum a bar has to provide to be placed horizontally. */
export interface XPositioned {
	/** Horizontal position of the bar, in media coordinates. */
	x: number;
}

/**
 * Builds a polyline through the bars in `[from, to)`, scaling the media
 * coordinates of the bars into the bitmap coordinates of `scope`.
 *
 * `getY` returns the media vertical coordinate for a bar — typically the result
 * of `priceToCoordinate` — and receives the absolute bar index so a series with
 * several lines per bar can pick the right one. Pass `reverse` to walk the bars
 * from `to - 1` down to `from`, which is how the returning edge of a filled
 * area is built (see {@link areaBetween}).
 *
 * The range must be non-empty; for an empty range the returned path is empty
 * and `first`/`last` are the origin. `Path2D` is only constructed when this is
 * called, so importing the module in a non-browser environment is safe.
 */
export function buildLinePath<TBar extends XPositioned>(
	bars: readonly TBar[],
	from: number,
	to: number,
	getY: (bar: TBar, index: number) => number,
	scope: BitmapCoordinatesRenderingScope,
	reverse: boolean = false
): LinePathData {
	const { horizontalPixelRatio, verticalPixelRatio } = scope;
	const path = new Path2D();
	const first: Position = { x: 0, y: 0 };
	const last: Position = { x: 0, y: 0 };
	if (from >= to) {
		return { path, first, last };
	}
	const start = reverse ? to - 1 : from;
	const end = reverse ? from - 1 : to;
	const step = reverse ? -1 : 1;
	for (let i = start; i !== end; i += step) {
		const bar = bars[i];
		const x = bar.x * horizontalPixelRatio;
		const y = getY(bar, i) * verticalPixelRatio;
		if (i === start) {
			path.moveTo(x, y);
			first.x = x;
			first.y = y;
		} else {
			path.lineTo(x, y);
		}
		last.x = x;
		last.y = y;
	}
	return { path, first, last };
}

/**
 * Builds a stepped polyline through the bars in `[from, to)`: each bar is
 * reached by a horizontal segment at the previous bar's level followed by a
 * vertical one, which is what the chart's own `LineType.WithSteps` draws.
 *
 * The arguments are those of {@link buildLinePath}, and `reverse` produces the
 * mirror image of the forward path — the same corners in the opposite order —
 * so a forward and a reverse stepped path can be closed into a band with
 * {@link areaBetween} without the two edges crossing.
 */
export function buildStepLinePath<TBar extends XPositioned>(
	bars: readonly TBar[],
	from: number,
	to: number,
	getY: (bar: TBar, index: number) => number,
	scope: BitmapCoordinatesRenderingScope,
	reverse: boolean = false
): LinePathData {
	const { horizontalPixelRatio, verticalPixelRatio } = scope;
	const path = new Path2D();
	const first: Position = { x: 0, y: 0 };
	const last: Position = { x: 0, y: 0 };
	if (from >= to) {
		return { path, first, last };
	}
	const start = reverse ? to - 1 : from;
	const end = reverse ? from - 1 : to;
	const step = reverse ? -1 : 1;
	let previousX = 0;
	let previousY = 0;
	for (let i = start; i !== end; i += step) {
		const bar = bars[i];
		const x = bar.x * horizontalPixelRatio;
		const y = getY(bar, i) * verticalPixelRatio;
		if (i === start) {
			path.moveTo(x, y);
			first.x = x;
			first.y = y;
		} else {
			// Walking forwards the corner sits above or below the new bar;
			// walking backwards it sits above or below the previous one, which
			// retraces the very same outline.
			path.lineTo(reverse ? previousX : x, reverse ? y : previousY);
			path.lineTo(x, y);
		}
		previousX = x;
		previousY = y;
		last.x = x;
		last.y = y;
	}
	return { path, first, last };
}

/**
 * Closes the band between two line paths into a fillable path: the `upper`
 * path, a straight edge across to the start of the `lower` path, the `lower`
 * path, and a straight edge back to where `upper` began.
 *
 * The two lines therefore have to run in opposite directions — build the
 * `lower` one with `reverse` set in {@link buildLinePath} — otherwise the band
 * is filled as a bow tie.
 */
export function areaBetween(upper: LinePathData, lower: LinePathData): Path2D {
	const area = new Path2D(upper.path);
	area.lineTo(lower.first.x, lower.first.y);
	area.addPath(lower.path);
	area.lineTo(upper.first.x, upper.first.y);
	area.closePath();
	return area;
}

/** Stroke settings for one run of a styled polyline. */
export interface PolylineStroke {
	/** Value assigned to `ctx.strokeStyle`. */
	strokeStyle: string | CanvasGradient | CanvasPattern;
	/** Value assigned to `ctx.lineWidth`, in the coordinate space of the points. */
	lineWidth: number;
}

/**
 * Strokes a polyline whose style changes along its length, for example a line
 * series with highlighted ranges.
 *
 * `styleAt(i)` gives the style of the segment from `points[i - 1]` to
 * `points[i]`, and is called exactly once for each `i` from 1 upwards, so a
 * resolver may build a fresh style object per call. Consecutive segments
 * whose style is the *same object* (compared by identity) are stroked as one
 * path, so a resolver that hands out a shared object per range keeps the number
 * of strokes down to the number of runs. Points with fewer than two entries
 * draw nothing.
 */
export function strokeStyledPolyline(
	ctx: CanvasRenderingContext2D,
	points: readonly Position[],
	styleAt: (index: number) => PolylineStroke
): void {
	if (points.length < 2) {
		return;
	}
	const strokeRun = (style: PolylineStroke): void => {
		ctx.strokeStyle = style.strokeStyle;
		ctx.lineWidth = style.lineWidth;
		ctx.stroke();
	};
	let runStyle = styleAt(1);
	ctx.beginPath();
	ctx.moveTo(points[0].x, points[0].y);
	ctx.lineTo(points[1].x, points[1].y);
	for (let i = 2; i < points.length; i++) {
		const style = styleAt(i);
		if (style !== runStyle) {
			strokeRun(runStyle);
			runStyle = style;
			ctx.beginPath();
			ctx.moveTo(points[i - 1].x, points[i - 1].y);
		}
		ctx.lineTo(points[i].x, points[i].y);
	}
	strokeRun(runStyle);
}
