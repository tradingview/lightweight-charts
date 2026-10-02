import { PriceToCoordinateConverter, Time } from 'lightweight-charts';

import {
	clampCornerRadius,
	CornerRadii,
	drawRoundRect,
} from '@tradingview/lwc-toolkit/canvas/round-rect';
import {
	calculateColumnPositionsInPlace,
	ColumnPositionItem,
} from '@tradingview/lwc-toolkit/dimensions/columns';
import { positionsBox, positionsLine } from '@tradingview/lwc-toolkit/dimensions/positions';
import {
	BitmapCoordinatesRenderingScope,
	CustomSeriesDrawArgs,
	CustomSeriesRendererBase,
} from '@tradingview/lwc-toolkit/custom-series/renderer-base';
import { getConflationFactor, mapVisibleBars } from '@tradingview/lwc-toolkit/custom-series/visible-bars';

import { PrettyHistogramData } from './data';
import { PrettyHistogramSeriesOptions } from './options';
import { CustomSeriesHitTestResult, effectiveBarSpacing } from './compat';

interface PrettyHistogramColumnItem extends ColumnPositionItem {
	/** Index of the bar within `data.bars`. */
	index: number;
	value: number;
	/** Per-point color override, when the data item carries one. */
	color: string | undefined;
}

/** A column, ready to paint, in bitmap coordinates. */
interface ColumnRect {
	index: number;
	left: number;
	top: number;
	width: number;
	height: number;
	radii: CornerRadii;
	fill: string;
	/** Whether the column grows upwards from the base line. */
	growsUp: boolean;
}

function shrinkRadii(radii: CornerRadii, offset: number): CornerRadii {
	return radii.map((r: number) => (r === 0 ? 0 : Math.max(0, r - offset))) as CornerRadii;
}

export class PrettyHistogramSeriesRenderer<
	HorzScaleItem = Time,
	TData extends PrettyHistogramData<HorzScaleItem> = PrettyHistogramData<HorzScaleItem>
> extends CustomSeriesRendererBase<HorzScaleItem, TData, PrettyHistogramSeriesOptions> {
	/**
	 * Reports the column under the cursor, so that the chart can highlight it and
	 * report it through the crosshair. Optional in the library before v5.1; hosts
	 * which do not know about it simply never call it.
	 *
	 * The whole slot of a bar is hoverable, not just the painted column, which
	 * is how the built-in histogram series behaves at narrow widths.
	 */
	public hitTest(
		x: number,
		y: number,
		priceToCoordinate: PriceToCoordinateConverter
	): CustomSeriesHitTestResult | null {
		const data = this.data;
		const options = this.options;
		if (data === null || options === null || data.visibleRange === null) {
			return null;
		}
		const baseCoordinate = priceToCoordinate(options.base);
		if (baseCoordinate === null) {
			return null;
		}
		const halfSlot = effectiveBarSpacing(data) / 2;
		const { from, to } = data.visibleRange;
		for (let i = from; i < to; i++) {
			const bar = data.bars[i];
			if (Math.abs(x - bar.x) > halfSlot) {
				continue;
			}
			const value = bar.originalData.value;
			if (!Number.isFinite(value)) {
				continue;
			}
			const coordinate = priceToCoordinate(value);
			if (coordinate === null) {
				continue;
			}
			const top = Math.min(coordinate, baseCoordinate);
			const bottom = Math.max(coordinate, baseCoordinate);
			if (y < top || y > bottom) {
				continue;
			}
			return {
				distance: 0,
				objectId: `bar-${i}`,
				type: 'range',
				hitTestData: i,
			};
		}
		return null;
	}

	protected drawImpl(
		scope: BitmapCoordinatesRenderingScope,
		args: CustomSeriesDrawArgs<HorzScaleItem, TData, PrettyHistogramSeriesOptions>
	): void {
		const { data, options, priceToCoordinate, isHovered, hitTestData } = args;
		const baseCoordinate = priceToCoordinate(options.base);
		if (baseCoordinate === null) {
			return;
		}

		const horizontalPixelRatio = scope.horizontalPixelRatio;
		const items = mapVisibleBars<HorzScaleItem, TData, PrettyHistogramColumnItem>(
			data,
			(bar, index) => ({
				x: bar.x,
				time: bar.time,
				index,
				value: bar.originalData.value,
				color: bar.originalData.color,
			})
		);
		const barSpacing = effectiveBarSpacing(data);
		const useColumnPositions =
			options.widthMode === 'histogram' || options.widthPercent >= 100;
		if (useColumnPositions) {
			calculateColumnPositionsInPlace(
				items,
				barSpacing,
				horizontalPixelRatio,
				0,
				items.length,
			getConflationFactor(data)
			);
		}

		const minWidth = Math.max(1, Math.round(options.minColumnWidth * horizontalPixelRatio));
		const radius = options.radius * horizontalPixelRatio;
		const rects: ColumnRect[] = [];
		for (const item of items) {
			if (!Number.isFinite(item.value)) {
				continue;
			}
			const coordinate = priceToCoordinate(item.value);
			if (coordinate === null) {
				continue;
			}
			let left: number;
			let width: number;
			if (useColumnPositions) {
				const column = item.column;
				if (column === undefined) {
					continue;
				}
				left = column.left;
				width = column.right - column.left + 1;
			} else {
				const line = positionsLine(
					item.x,
					horizontalPixelRatio,
					(barSpacing * options.widthPercent) / 100
				);
				left = line.position;
				width = line.length;
			}
			if (width < minWidth) {
				left -= Math.round((minWidth - width) / 2);
				width = minWidth;
			}
			const box = positionsBox(baseCoordinate, coordinate, scope.verticalPixelRatio);
			const outer = clampCornerRadius(radius, width, box.length);
			const inner = options.roundInnerCorners ? outer : 0;
			const positive = item.value >= options.base;
			rects.push({
				index: item.index,
				left,
				top: box.position,
				width,
				height: box.length,
				radii: coordinate <= baseCoordinate
					? [outer, outer, inner, inner]
					: [inner, inner, outer, outer],
				fill: this._columnColor(item, options, positive),
				growsUp: coordinate <= baseCoordinate,
			});
		}

		const borderWidth =
			options.borderColor === null
				? 0
				: Math.max(1, Math.round(options.borderWidth * horizontalPixelRatio));
		const hovered =
			isHovered && options.highlightHovered && typeof hitTestData === 'number'
				? hitTestData
				: null;
		if (borderWidth === 0 && options.gradientColor === null && hovered === null) {
			this._drawBatched(scope, rects);
			return;
		}
		this._drawIndividually(scope, rects, options, borderWidth, hovered);
	}

	private _columnColor(
		item: PrettyHistogramColumnItem,
		options: PrettyHistogramSeriesOptions,
		positive: boolean
	): string {
		if (item.color !== undefined) {
			return item.color;
		}
		const twoTone = positive ? options.upColor : options.downColor;
		return twoTone ?? options.color;
	}

	/**
	 * The fast path: consecutive columns of the same color go into a single
	 * path and are filled in one canvas operation.
	 */
	private _drawBatched(
		scope: BitmapCoordinatesRenderingScope,
		rects: readonly ColumnRect[]
	): void {
		const ctx = scope.context;
		let previousFill: string | null = null;
		ctx.beginPath();
		for (const rect of rects) {
			if (previousFill !== null && previousFill !== rect.fill) {
				ctx.fill();
				ctx.beginPath();
			}
			ctx.fillStyle = rect.fill;
			ctx.roundRect(rect.left, rect.top, rect.width, rect.height, rect.radii);
			previousFill = rect.fill;
		}
		ctx.fill();
	}

	private _drawIndividually(
		scope: BitmapCoordinatesRenderingScope,
		rects: readonly ColumnRect[],
		options: PrettyHistogramSeriesOptions,
		borderWidth: number,
		hovered: number | null
	): void {
		const ctx = scope.context;
		ctx.save();
		for (const rect of rects) {
			ctx.globalAlpha = hovered === null || hovered === rect.index ? 1 : 0.35;
			const fill =
				options.gradientColor === null
					? rect.fill
					: this._gradient(ctx, rect, options.gradientColor);
			this._paintColumn(ctx, rect, fill, borderWidth, options.borderColor);
		}
		ctx.restore();
	}

	/** A vertical fade from the column's own color at `base` to `gradientColor`. */
	private _gradient(
		ctx: CanvasRenderingContext2D,
		rect: ColumnRect,
		gradientColor: string
	): CanvasGradient {
		// The fade starts at the base, including on an inverted price scale.
		const gradient = ctx.createLinearGradient(
			0,
			rect.growsUp ? rect.top + rect.height : rect.top,
			0,
			rect.growsUp ? rect.top : rect.top + rect.height
		);
		gradient.addColorStop(0, rect.fill);
		gradient.addColorStop(1, gradientColor);
		return gradient;
	}

	private _paintColumn(
		ctx: CanvasRenderingContext2D,
		rect: ColumnRect,
		fill: string | CanvasGradient,
		borderWidth: number,
		borderColor: string | null
	): void {
		const bordered =
			borderColor !== null &&
			borderWidth > 0 &&
			borderColor !== fill &&
			rect.width > borderWidth &&
			rect.height > borderWidth;
		if (!bordered) {
			drawRoundRect(ctx, rect.left, rect.top, rect.width, rect.height, rect.radii);
			ctx.fillStyle = fill;
			ctx.fill();
			return;
		}
		const half = borderWidth / 2;
		drawRoundRect(
			ctx,
			rect.left + half,
			rect.top + half,
			rect.width - borderWidth,
			rect.height - borderWidth,
			shrinkRadii(rect.radii, half)
		);
		ctx.fillStyle = fill;
		ctx.fill();
		ctx.lineWidth = borderWidth;
		ctx.strokeStyle = borderColor as string;
		ctx.stroke();
	}
}
