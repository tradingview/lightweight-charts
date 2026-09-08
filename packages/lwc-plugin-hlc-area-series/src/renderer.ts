import { LineStyle, PriceToCoordinateConverter, Time } from 'lightweight-charts';
import {
	LinePathData,
	areaBetween,
	buildLinePath,
	buildStepLinePath,
} from '@tradingview/lwc-toolkit/custom-series/line-paths';
import {
	BitmapCoordinatesRenderingScope,
	CustomSeriesDrawArgs,
	CustomSeriesRendererBase,
} from '@tradingview/lwc-toolkit/custom-series/renderer-base';
import { extendRange, visibleSegments } from '@tradingview/lwc-toolkit/custom-series/visible-bars';
import { setLineStyle } from '@tradingview/lwc-toolkit/line-style';
import type { LineStyle as ToolkitLineStyle } from '@tradingview/lwc-toolkit/line-style';

import { HLCAreaData } from './data';
import { HLCAreaSeriesOptions } from './options';

/**
 * A custom-series hit test result. Declared here rather than imported so that
 * the package still typechecks against `lightweight-charts` 5.0.0, which has
 * no hit testing for custom series.
 */
export interface HLCAreaHitTestResult {
	distance: number;
	objectId?: string;
	type?: 'point' | 'line' | 'range' | 'custom';
	hitTestData?: unknown;
}

/** One bar with its three prices already converted to media coordinates. */
interface HLCAreaBarItem {
	x: number;
	high: number;
	low: number;
	close: number;
	/** Absolute index into `data.bars`. */
	index: number;
	/** Logical time scale index of the bar, which gaps make jump. */
	time: number;
}

/** Default hit test tolerance, in CSS pixels, on hosts which have no option for it. */
const defaultHitTestTolerance = 8;

function distanceToRange(value: number, low: number, high: number): number {
	if (value < low) {
		return low - value;
	}
	if (value > high) {
		return value - high;
	}
	return 0;
}

function hitTestTolerance(options: HLCAreaSeriesOptions): number {
	const tolerance = (options as { hitTestTolerance?: number }).hitTestTolerance;
	return typeof tolerance === 'number' ? tolerance : defaultHitTestTolerance;
}

export class HLCAreaSeriesRenderer<
	HorzScaleItem = Time,
	TData extends HLCAreaData<HorzScaleItem> = HLCAreaData<HorzScaleItem>
> extends CustomSeriesRendererBase<
	HorzScaleItem,
	TData,
	HLCAreaSeriesOptions
> {
	/**
	 * Reports the bar under the cursor, so that the chart can identify it in the
	 * crosshair event and hand it back to `draw` as the hovered item.
	 */
	public hitTest(
		x: number,
		y: number,
		priceConverter: PriceToCoordinateConverter
	): HLCAreaHitTestResult | null {
		const data = this.data;
		const options = this.options;
		if (data === null || options === null || data.visibleRange === null) {
			return null;
		}
		const tolerance = hitTestTolerance(options);
		let best: HLCAreaHitTestResult | null = null;
		// The visible range as it is: the bars outside it have no coordinates.
		const { from, to } = data.visibleRange;
		for (let i = from; i < to; i++) {
			const bar = data.bars[i];
			const dx = Math.abs(x - bar.x);
			if (dx > tolerance) {
				continue;
			}
			const high = priceConverter(bar.originalData.high);
			const low = priceConverter(bar.originalData.low);
			if (high === null || low === null) {
				continue;
			}
			const dy = distanceToRange(y, Math.min(high, low), Math.max(high, low));
			const distance = Math.sqrt(dx * dx + dy * dy);
			if (distance > tolerance) {
				continue;
			}
			if (best === null || distance < best.distance) {
				best = {
					distance,
					objectId: `hlc-${bar.time}`,
					type: 'range',
					hitTestData: i,
				};
			}
		}
		return best;
	}

	protected drawImpl(
		scope: BitmapCoordinatesRenderingScope,
		args: CustomSeriesDrawArgs<HorzScaleItem, TData, HLCAreaSeriesOptions>
	): void {
		const { data, options, priceToCoordinate, from, to, isHovered, hitTestData } = args;
		// The library gives custom series the non-extended visible range, so the
		// first and last segments would stop at the outermost visible point
		// instead of leaving the pane.
		const range = extendRange({ from, to }, data.bars.length);

		// The chart only converts the bars inside the non-extended visible range
		// to coordinates, so the two bars `extendRange` adds carry `NaN`. Bars
		// are evenly spaced by logical index, so their x follows from a visible
		// neighbour.
		const anchor = data.bars[from];
		const barX = (bar: { x: number; time: number }): number =>
			Number.isFinite(bar.x)
				? bar.x
				: anchor.x + (bar.time - anchor.time) * data.barSpacing;

		const bars: HLCAreaBarItem[] = [];
		for (let i = range.from; i < range.to; i++) {
			const bar = data.bars[i];
			const point = bar.originalData;
			const high = priceToCoordinate(point.high);
			const low = priceToCoordinate(point.low);
			const close = priceToCoordinate(point.close);
			// A price off the scale converts to null; drawing it would put NaN
			// into the path and lose the whole line.
			if (high === null || low === null || close === null) {
				continue;
			}
			bars.push({ x: barX(bar), high, low, close, index: i, time: bar.time });
		}

		const ctx = scope.context;
		ctx.save();
		ctx.lineJoin = 'round';

		// Whitespace never reaches a renderer, so a jump in the logical index is
		// the only sign of a gap; each run of consecutive bars is its own path.
		for (const segment of visibleSegments(bars, { from: 0, to: bars.length })) {
			this._drawSegment(scope, options, bars, segment.from, segment.to);
		}

		if (isHovered && typeof hitTestData === 'number') {
			this._drawHoverPoints(scope, options, bars, hitTestData);
		}

		ctx.restore();
	}

	private _drawSegment(
		scope: BitmapCoordinatesRenderingScope,
		options: HLCAreaSeriesOptions,
		bars: readonly HLCAreaBarItem[],
		from: number,
		to: number
	): void {
		if (from >= to) {
			return;
		}
		const build = options.lineType === 'step' ? buildStepLinePath : buildLinePath;
		const highLine = build(bars, from, to, (bar: HLCAreaBarItem) => bar.high, scope);
		const lowLine = build(bars, from, to, (bar: HLCAreaBarItem) => bar.low, scope);
		// Reversed, so that it closes both bands without crossing itself.
		const closeLine = build(
			bars,
			from,
			to,
			(bar: HLCAreaBarItem) => bar.close,
			scope,
			true
		);

		const ctx = scope.context;
		if (options.areaVisible) {
			ctx.fillStyle = this._areaStyle(
				scope,
				options.areaTopColor ?? options.highAreaColor,
				options.highAreaTopColor,
				options.highAreaBottomColor
			);
			ctx.fill(areaBetween(highLine, closeLine));

			ctx.fillStyle = this._areaStyle(
				scope,
				options.areaBottomColor ?? options.lowAreaColor,
				options.lowAreaTopColor,
				options.lowAreaBottomColor
			);
			ctx.fill(areaBetween(lowLine, closeLine));
		}

		this._strokeLine(scope, lowLine, options.lowLineVisible, options.lowLineColor, options.lowLineWidth, options.lowLineStyle);
		this._strokeLine(scope, highLine, options.highLineVisible, options.highLineColor, options.highLineWidth, options.highLineStyle);
		this._strokeLine(scope, closeLine, options.closeLineVisible, options.closeLineColor, options.closeLineWidth, options.closeLineStyle);
	}

	private _strokeLine(
		scope: BitmapCoordinatesRenderingScope,
		line: LinePathData,
		visible: boolean,
		color: string,
		width: number,
		style: LineStyle
	): void {
		if (!visible) {
			return;
		}
		const ctx = scope.context;
		ctx.strokeStyle = color;
		// Line widths follow the horizontal ratio, as the library's own lines do.
		ctx.lineWidth = width * scope.horizontalPixelRatio;
		setLineStyle(ctx, style as unknown as ToolkitLineStyle);
		ctx.stroke(line.path);
		ctx.setLineDash([]);
	}

	/** A flat color, or a vertical gradient across the pane when a pair is set. */
	private _areaStyle(
		scope: BitmapCoordinatesRenderingScope,
		flatColor: string,
		topColor: string,
		bottomColor: string
	): string | CanvasGradient {
		if (topColor === '' || bottomColor === '') {
			return flatColor;
		}
		const gradient = scope.context.createLinearGradient(
			0,
			0,
			0,
			scope.bitmapSize.height
		);
		gradient.addColorStop(0, topColor);
		gradient.addColorStop(1, bottomColor);
		return gradient;
	}

	private _drawHoverPoints(
		scope: BitmapCoordinatesRenderingScope,
		options: HLCAreaSeriesOptions,
		bars: readonly HLCAreaBarItem[],
		index: number
	): void {
		const radius = options.hoverPointRadius;
		if (radius <= 0) {
			return;
		}
		const bar = bars.find((item: HLCAreaBarItem) => item.index === index);
		if (bar === undefined) {
			return;
		}
		const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = scope;
		const x = bar.x * horizontalPixelRatio;
		const points: [number, string][] = [
			[bar.high, options.highLineColor],
			[bar.close, options.closeLineColor],
			[bar.low, options.lowLineColor],
		];
		for (const [y, color] of points) {
			ctx.beginPath();
			ctx.fillStyle = color;
			ctx.arc(x, y * verticalPixelRatio, radius * horizontalPixelRatio, 0, Math.PI * 2);
			ctx.fill();
		}
	}
}
