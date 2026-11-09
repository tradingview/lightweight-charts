import { PriceToCoordinateConverter, Time } from 'lightweight-charts';
import { candlestickWidth } from '@tradingview/lwc-toolkit/dimensions/candles';
import {
	CornerRadii,
	clampCornerRadius,
	drawRoundRect,
	drawRoundRectWithBorder,
} from '@tradingview/lwc-toolkit/canvas/round-rect';
import {
	BitmapCoordinatesRenderingScope,
	CustomSeriesDrawArgs,
	CustomSeriesRendererBase,
} from '@tradingview/lwc-toolkit/custom-series/renderer-base';
import { gridAndCrosshairBitmapWidth } from '@tradingview/lwc-toolkit/dimensions/crosshair-width';
import { CustomSeriesHitTestResult } from '@tradingview/lwc-toolkit/custom-series/compat';
import { nearestVerticalRange, seriesHitTestTolerance } from '@tradingview/lwc-toolkit/custom-series/hit-test';
import { effectiveBarSpacing, mapVisibleBars } from '@tradingview/lwc-toolkit/custom-series/visible-bars';
import { positionsBox, positionsLine } from '@tradingview/lwc-toolkit/dimensions/positions';

import { RoundedCandleData } from './data';
import { RoundedCandleSeriesOptions } from './options';
import { ResolvedCandleColors, isUpCandle, resolveCandleColors } from './colors';
import { resolveRadius } from './radius';

interface BarItem extends ResolvedCandleColors {
	openY: number;
	highY: number;
	lowY: number;
	closeY: number;
	x: number;
	index: number;
}

export class RoundedCandleSeriesRenderer<
	HorzScaleItem = Time,
	TData extends RoundedCandleData<HorzScaleItem> = RoundedCandleData<HorzScaleItem>
> extends CustomSeriesRendererBase<
	HorzScaleItem,
	TData,
	RoundedCandleSeriesOptions
> {
	/**
	 * Reports the candle under the cursor, so that the chart can identify it in
	 * the crosshair event and hand it back to `draw` as the hovered item.
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
		const hit = nearestVerticalRange(
			data,
			x,
			y,
			effectiveBarSpacing(data) / 2,
			seriesHitTestTolerance(options),
			bar => {
				const high = priceConverter(bar.originalData.high);
				const low = priceConverter(bar.originalData.low);
				return high === null || low === null ? null : [high, low];
			}
		);
		if (hit === null) {
			return null;
		}
		return {
			distance: hit.distance,
			objectId: `candle-${data.bars[hit.index].time}`,
			type: 'range',
			hitTestData: hit.index,
		};
	}

	protected drawImpl(
		scope: BitmapCoordinatesRenderingScope,
		args: CustomSeriesDrawArgs<HorzScaleItem, TData, RoundedCandleSeriesOptions>
	): void {
		const { data, options, priceToCoordinate, isHovered, hitTestData } = args;
		const barSpacing = effectiveBarSpacing(data);
		const bars = mapVisibleBars(data, (bar, index): BarItem | null => {
			const point = bar.originalData;
			const openY = priceToCoordinate(point.open);
			const highY = priceToCoordinate(point.high);
			const lowY = priceToCoordinate(point.low);
			const closeY = priceToCoordinate(point.close);
			if (openY === null || highY === null || lowY === null || closeY === null) {
				return null;
			}
			const previous = index > 0 ? data.bars[index - 1].originalData.close : -Infinity;
			const isUp = isUpCandle(point, previous, options.upDownMode);
			return {
				openY,
				highY,
				lowY,
				closeY,
				x: bar.x,
				index,
				...resolveCandleColors(point, isUp, options),
			};
		}).filter((bar: BarItem | null): bar is BarItem => bar !== null);

		const hoveredIndex = isHovered && typeof hitTestData === 'number' ? hitTestData : null;
		const dimOpacity = hoveredIndex === null ? 1 : Math.max(0, Math.min(1, options.hoverDimOpacity));

		const ctx = scope.context;
		ctx.save();
		if (options.wickVisible) {
			this._drawWicks(scope, bars, barSpacing, hoveredIndex, dimOpacity);
		}
		this._drawBodies(scope, bars, barSpacing, hoveredIndex, dimOpacity);
		ctx.restore();
	}

	private _drawWicks(
		scope: BitmapCoordinatesRenderingScope,
		bars: readonly BarItem[],
		barSpacing: number,
		hoveredIndex: number | null,
		dimOpacity: number
	): void {
		const options = this.options;
		if (options === null) {
			return;
		}
		const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = scope;
		const bodyWidth = candlestickWidth(barSpacing, horizontalPixelRatio);
		const wickWidth = Math.min(gridAndCrosshairBitmapWidth(horizontalPixelRatio), bodyWidth);
		const rounded = options.wickLineCap === 'round';

		for (const bar of bars) {
			ctx.globalAlpha = bar.index === hoveredIndex || hoveredIndex === null ? 1 : dimOpacity;
			ctx.fillStyle = bar.wickColor;

			const top = Math.round(Math.min(bar.openY, bar.closeY) * verticalPixelRatio);
			const bottom = Math.round(Math.max(bar.openY, bar.closeY) * verticalPixelRatio);
			const high = Math.round(Math.min(bar.highY, bar.lowY) * verticalPixelRatio);
			const low = Math.round(Math.max(bar.highY, bar.lowY) * verticalPixelRatio);
			const line = positionsLine(bar.x, horizontalPixelRatio, wickWidth, true);

			// Above and below the body rather than one bar behind it, so that a
			// translucent body does not show the wick through itself.
			this._fillWickSegment(ctx, line.position, high, line.length, top - high, rounded);
			this._fillWickSegment(ctx, line.position, bottom + 1, line.length, low - bottom, rounded);
		}
	}

	private _fillWickSegment(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		width: number,
		height: number,
		rounded: boolean
	): void {
		if (height <= 0) {
			return;
		}
		if (!rounded) {
			ctx.fillRect(x, y, width, height);
			return;
		}
		const radius = clampCornerRadius(width / 2, width, height);
		drawRoundRect(ctx, x, y, width, height, [radius, radius, radius, radius]);
		ctx.fill();
	}

	private _drawBodies(
		scope: BitmapCoordinatesRenderingScope,
		bars: readonly BarItem[],
		barSpacing: number,
		hoveredIndex: number | null,
		dimOpacity: number
	): void {
		const options = this.options;
		if (options === null) {
			return;
		}
		const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = scope;
		const bodyWidth = candlestickWidth(barSpacing, horizontalPixelRatio);
		const borderWidth = options.borderVisible
			? Math.max(1, Math.floor(horizontalPixelRatio))
			: 0;
		const radiusBitmap = resolveRadius(options.radius, barSpacing) * horizontalPixelRatio;

		for (const bar of bars) {
			ctx.globalAlpha = bar.index === hoveredIndex || hoveredIndex === null ? 1 : dimOpacity;

			const box = positionsBox(
				Math.min(bar.openY, bar.closeY),
				Math.max(bar.openY, bar.closeY),
				verticalPixelRatio
			);
			const line = positionsLine(bar.x, horizontalPixelRatio, bodyWidth, true);
			const radius = clampCornerRadius(radiusBitmap, line.length, box.length);
			const radii: CornerRadii = [radius, radius, radius, radius];

			// Too narrow to hold a border and a body: the library paints the
			// whole box in the border color instead.
			if (borderWidth > 0 && line.length <= borderWidth * 2) {
				drawRoundRectWithBorder(ctx, line.position, box.position, line.length, box.length, bar.borderColor, 0, radii);
				continue;
			}
			drawRoundRectWithBorder(ctx, line.position, box.position, line.length, box.length, bar.bodyColor, borderWidth, radii, bar.borderColor);
		}
	}
}
