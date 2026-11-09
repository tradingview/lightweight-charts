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
import { CustomSeriesHitTestResult } from '@tradingview/lwc-toolkit/custom-series/compat';
import { nearestVerticalRange, seriesHitTestTolerance } from '@tradingview/lwc-toolkit/custom-series/hit-test';
import { GapCheck, barCoordinate, extendRange, getConflationFactor, visibleSegments } from '@tradingview/lwc-toolkit/custom-series/visible-bars';
import { setLineStyle } from '@tradingview/lwc-toolkit/line-style';
import type { LineStyle as ToolkitLineStyle } from '@tradingview/lwc-toolkit/line-style';

import { HLCAreaData } from './data';
import { HLCAreaSeriesOptions } from './options';

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

export class HLCAreaSeriesRenderer<
	HorzScaleItem = Time,
	TData extends HLCAreaData<HorzScaleItem> = HLCAreaData<HorzScaleItem>
> extends CustomSeriesRendererBase<
	HorzScaleItem,
	TData,
	HLCAreaSeriesOptions
> {
	public constructor(private readonly _isGap?: GapCheck<HorzScaleItem, TData>) {
		super();
	}

	/**
	 * Reports the bar under the cursor, so that the chart can identify it in the
	 * crosshair event and hand it back to `draw` as the hovered item.
	 */
	public hitTest(
		x: number,
		y: number,
		priceConverter: PriceToCoordinateConverter
	): CustomSeriesHitTestResult | null {
		const data = this.data;
		const options = this.options;
		if (data === null || options === null) {
			return null;
		}
		// The visible range as it is: the bars outside it have no coordinates.
		// A bar is a vertical line, so it has no width of its own.
		const hit = nearestVerticalRange(data, x, y, 0, seriesHitTestTolerance(options), bar => {
			const high = priceConverter(bar.originalData.high);
			const low = priceConverter(bar.originalData.low);
			return high === null || low === null ? null : [high, low];
		});
		if (hit === null) {
			return null;
		}
		return {
			distance: hit.distance,
			objectId: `hlc-${data.bars[hit.index].time}`,
			type: 'range',
			hitTestData: hit.index,
		};
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
			bars.push({ x: barCoordinate(bar, data.bars[from], data.barSpacing), high, low, close, index: i, time: bar.time });
		}

		const ctx = scope.context;
		ctx.save();
		ctx.lineJoin = 'round';

		// Break at explicit whitespace or a point that could not be converted.
		// Under conflation a run shorter than one bucket is absorbed into it,
		// since a conflated chunk spans more logical indices than it has rows.
		const minGap = getConflationFactor(data);
		for (const segment of visibleSegments(bars, { from: 0, to: bars.length }, (left, right) =>
			right.index !== left.index + 1 || (this._isGap?.(data.bars[left.index], data.bars[right.index], minGap) ?? false)
		)) {
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
