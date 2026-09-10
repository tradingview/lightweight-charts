import { LineStyle, LineType } from 'lightweight-charts';
import {
	BitmapCoordinatesRenderingScope,
	CustomSeriesDrawArgs,
	CustomSeriesRendererBase,
} from '@tradingview/lwc-toolkit/custom-series/renderer-base';
import {
	GapCheck, barCoordinate, extendRange,
	visibleSegments,
} from '@tradingview/lwc-toolkit/custom-series/visible-bars';
import {
	setLineStyle,
	type LineStyle as ToolkitLineStyle,
} from '@tradingview/lwc-toolkit/line-style';
import { BrushableAreaData } from './data';
import { BrushableAreaSeriesOptions, BrushableAreaStyle } from './options';
import { createStyleResolver } from './style';

interface BrushableAreaPoint {
	x: number;
	y: number;
	style: BrushableAreaStyle;
}

const CURVE_TENSION = 6;

// Control points of the cubic between `points[i - 1]` and `points[i]`, the same
// construction the chart's own curved lines use.
function controlPoints(
	points: readonly BrushableAreaPoint[],
	index: number
): [number, number, number, number] {
	const before = points[Math.max(0, index - 2)];
	const from = points[index - 1];
	const to = points[index];
	const after = points[Math.min(points.length - 1, index + 1)];
	return [
		from.x + (to.x - before.x) / CURVE_TENSION,
		from.y + (to.y - before.y) / CURVE_TENSION,
		to.x - (after.x - from.x) / CURVE_TENSION,
		to.y - (after.y - from.y) / CURVE_TENSION,
	];
}

// Appends the shape of the line between `points[index - 1]` and `points[index]`
// to the current path, which must already be at `points[index - 1]`.
function appendSegment(
	ctx: CanvasRenderingContext2D,
	points: readonly BrushableAreaPoint[],
	index: number,
	lineType: LineType
): void {
	const to = points[index];
	switch (lineType) {
		case LineType.WithSteps:
			ctx.lineTo(to.x, points[index - 1].y);
			ctx.lineTo(to.x, to.y);
			break;
		case LineType.Curved: {
			const [cp1x, cp1y, cp2x, cp2y] = controlPoints(points, index);
			ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, to.x, to.y);
			break;
		}
		default:
			ctx.lineTo(to.x, to.y);
	}
}

export class BrushableAreaSeriesRenderer<
	HorzScaleItem,
	TData extends BrushableAreaData<HorzScaleItem>,
> extends CustomSeriesRendererBase<
	HorzScaleItem,
	TData,
	BrushableAreaSeriesOptions
> {
	public constructor(private readonly _isGap?: GapCheck<HorzScaleItem, TData>) {
		super();
	}

	protected drawImpl(
		scope: BitmapCoordinatesRenderingScope,
		args: CustomSeriesDrawArgs<HorzScaleItem, TData, BrushableAreaSeriesOptions>
	): void {
		const { data, options, priceToCoordinate, from, to } = args;
		const ctx = scope.context;
		const paneHeight = scope.bitmapSize.height;
		const resolveStyle = createStyleResolver(options);

		// The custom pane view hands over the non-extended visible range, so the
		// first and last segments would stop at the first and last visible point
		// instead of leaving the pane.
		const range = extendRange({ from, to }, data.bars.length);

		// Only explicit whitespace breaks the line; other series may fill the
		// logical indices between these bars.
		const segments: BrushableAreaPoint[][] = [];
		for (const segment of visibleSegments(data.bars, range, this._isGap)) {
			let points: BrushableAreaPoint[] = [];
			for (let i = segment.from; i < segment.to; i++) {
				const bar = data.bars[i];
				const y = priceToCoordinate(bar.originalData.value);
				if (y === null) {
					// Off the price scale: break the line rather than draw to NaN.
					if (points.length > 0) {
						segments.push(points);
						points = [];
					}
					continue;
				}
				points.push({
					x: barCoordinate(bar, data.bars[from], data.barSpacing) * scope.horizontalPixelRatio,
					y: y * scope.verticalPixelRatio,
					// `bar.time` is the logical index; `i` is the position in the
					// bars array, and the two differ as soon as another series
					// starts earlier or the data has gaps.
					style: resolveStyle(bar.time),
				});
			}
			if (points.length > 0) {
				segments.push(points);
			}
		}
		if (segments.length === 0) {
			return;
		}

		const baseCoordinate = priceToCoordinate(options.basePrice);
		// The base price is often outside the visible price range, in which case
		// the fill simply reaches the edge of the pane.
		const basePriceY =
			baseCoordinate === null
				? paneHeight
				: Math.max(
						0,
						Math.min(paneHeight, baseCoordinate * scope.verticalPixelRatio)
					);
		const baseY = options.invertFilledArea ? 0 : basePriceY;

		let minPointY = segments[0][0].y;
		let maxPointY = minPointY;
		for (const points of segments) {
			for (const point of points) {
				minPointY = Math.min(minPointY, point.y);
				maxPointY = Math.max(maxPointY, point.y);
			}
		}
		// The gradient runs from `bottomColor` at the base out to `topColor` at
		// the far edge of the pane — or at the outermost point in view with
		// `relativeGradient` — on whichever side of the base the fill extends,
		// which is both sides when the base sits inside the data.
		const gradientTop = options.relativeGradient
			? Math.min(minPointY, baseY)
			: 0;
		const gradientBottom = options.relativeGradient
			? Math.max(maxPointY, baseY)
			: paneHeight;
		const gradientSpan = gradientBottom - gradientTop;
		const basePosition =
			gradientSpan <= 0 ? 1 : (baseY - gradientTop) / gradientSpan;

		const gradients: Map<string, CanvasGradient> = new Map();
		const gradientFor = (style: BrushableAreaStyle): CanvasGradient => {
			const key = style.bottomColor + '|' + style.topColor;
			const cached = gradients.get(key);
			if (cached !== undefined) {
				return cached;
			}
			const gradient = ctx.createLinearGradient(
				0,
				gradientTop,
				0,
				gradientBottom
			);
			gradient.addColorStop(0, style.topColor);
			gradient.addColorStop(
				Math.max(0, Math.min(1, basePosition)),
				style.bottomColor
			);
			gradient.addColorStop(1, style.topColor);
			gradients.set(key, gradient);
			return gradient;
		};

		ctx.save();
		ctx.lineJoin = 'round';
		for (const points of segments) {
			this._drawArea(ctx, points, options.lineType, baseY, gradientFor);
			if (options.lineVisible) {
				this._drawLine(ctx, points, options.lineType, scope);
			}
		}
		ctx.restore();
	}

	// Consecutive points sharing a style are filled as one path, so that no
	// seam shows between two segments of the same colour.
	private _drawArea(
		ctx: CanvasRenderingContext2D,
		points: readonly BrushableAreaPoint[],
		lineType: LineType,
		baseY: number,
		gradientFor: (style: BrushableAreaStyle) => CanvasGradient
	): void {
		if (points.length < 2) {
			return;
		}
		const fillRun = (style: BrushableAreaStyle, fromX: number, toX: number) => {
			ctx.lineTo(toX, baseY);
			ctx.lineTo(fromX, baseY);
			ctx.closePath();
			ctx.fillStyle = gradientFor(style);
			ctx.fill();
		};
		let runStyle = points[1].style;
		let runStartX = points[0].x;
		ctx.beginPath();
		ctx.moveTo(points[0].x, points[0].y);
		appendSegment(ctx, points, 1, lineType);
		for (let i = 2; i < points.length; i++) {
			if (points[i].style !== runStyle) {
				fillRun(runStyle, runStartX, points[i - 1].x);
				runStyle = points[i].style;
				runStartX = points[i - 1].x;
				ctx.beginPath();
				ctx.moveTo(points[i - 1].x, points[i - 1].y);
			}
			appendSegment(ctx, points, i, lineType);
		}
		fillRun(runStyle, runStartX, points[points.length - 1].x);
	}

	private _drawLine(
		ctx: CanvasRenderingContext2D,
		points: readonly BrushableAreaPoint[],
		lineType: LineType,
		scope: BitmapCoordinatesRenderingScope
	): void {
		const strokeRun = (style: BrushableAreaStyle) => {
			ctx.strokeStyle = style.lineColor;
			// Line widths follow the horizontal ratio, as the chart's own do.
			ctx.lineWidth = style.lineWidth * scope.horizontalPixelRatio;
			// Round caps close the joint between two runs of different styles;
			// a dashed line keeps butt caps so the dashes stay the right length.
			ctx.lineCap = style.lineStyle === LineStyle.Solid ? 'round' : 'butt';
			setLineStyle(ctx, style.lineStyle as unknown as ToolkitLineStyle);
			ctx.stroke();
		};
		if (points.length < 2) {
			// A single visible point still deserves a mark: a dot of line width.
			const point = points[0];
			ctx.beginPath();
			ctx.moveTo(point.x, point.y);
			ctx.lineTo(point.x, point.y);
			strokeRun(point.style);
			return;
		}
		let runStyle = points[1].style;
		ctx.beginPath();
		ctx.moveTo(points[0].x, points[0].y);
		appendSegment(ctx, points, 1, lineType);
		for (let i = 2; i < points.length; i++) {
			if (points[i].style !== runStyle) {
				strokeRun(runStyle);
				runStyle = points[i].style;
				ctx.beginPath();
				ctx.moveTo(points[i - 1].x, points[i - 1].y);
			}
			appendSegment(ctx, points, i, lineType);
		}
		strokeRun(runStyle);
	}
}
