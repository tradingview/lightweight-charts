import { PriceToCoordinateConverter, Time } from 'lightweight-charts';

import {
	clampCornerRadius,
	CornerRadii,
	drawRoundRectWithBorder,
} from '@tradingview/lwc-toolkit/canvas/round-rect';
import {
	calculateColumnPositionsInPlace,
	ColumnPositionItem,
} from '@tradingview/lwc-toolkit/dimensions/columns';
import { positionsBox } from '@tradingview/lwc-toolkit/dimensions/positions';
import {
	BitmapCoordinatesRenderingScope,
	CustomSeriesDrawArgs,
	CustomSeriesRendererBase,
} from '@tradingview/lwc-toolkit/custom-series/renderer-base';
import { getConflationFactor, mapVisibleBars } from '@tradingview/lwc-toolkit/custom-series/visible-bars';

import { DualRangeHistogramData } from './data';
import {
	columnOrder,
	DualRangeHistogramColumns,
	DualRangeHistogramSeriesOptions,
} from './options';
import { CustomSeriesHitTestResult, effectiveBarSpacing } from './compat';

interface DualRangeHistogramBarItem extends ColumnPositionItem {
	/** Index of the bar within `data.bars`. */
	index: number;
	values: number[];
	colors: (string | undefined)[] | undefined;
}

/** Everything the columns of one point share, in bitmap coordinates. */
interface PointGeometry {
	left: number;
	width: number;
	borderWidth: number;
	/** The base line in media coordinates. */
	baseCoordinate: number;
	/** Half of the gap between the two halves, in media coordinates. */
	halfGap: number;
	/** Value which fills half of `maxHeight`; `null` in `price` scale mode. */
	scale: number | null;
	priceToCoordinate: PriceToCoordinateConverter;
}

/** The area a point occupies, in media coordinates, for hit testing. */
interface HitArea {
	index: number;
	left: number;
	right: number;
	top: number;
	bottom: number;
	objectId: string;
}

function columnKey(index: number): keyof DualRangeHistogramColumns<unknown> {
	return columnOrder[index % columnOrder.length];
}

function largestAbsolute(values: readonly number[]): number {
	let max = 0;
	for (const value of values) {
		if (Number.isFinite(value)) {
			max = Math.max(max, Math.abs(value));
		}
	}
	return max;
}

export class DualRangeHistogramSeriesRenderer<
	HorzScaleItem = Time,
	TData extends DualRangeHistogramData<HorzScaleItem> = DualRangeHistogramData<HorzScaleItem>
> extends CustomSeriesRendererBase<
	HorzScaleItem,
	TData,
	DualRangeHistogramSeriesOptions
> {
	/** Areas painted by the last draw, in media coordinates, for `hitTest`. */
	private _hitAreas: HitArea[] = [];
	/** Largest absolute value of the whole data set, for `normalize: 'all'`. */
	private _allScale: { bars: unknown; value: number } | null = null;

	/**
	 * Reports the point under the cursor, so that the chart can highlight it and
	 * report it through the crosshair. Optional in the library before v5.1;
	 * hosts which do not know about it simply never call it.
	 */
	public hitTest(x: number, y: number): CustomSeriesHitTestResult | null {
		for (const area of this._hitAreas) {
			if (x < area.left || x > area.right || y < area.top || y > area.bottom) {
				continue;
			}
			return {
				distance: 0,
				objectId: area.objectId,
				type: 'range',
				hitTestData: area.index,
			};
		}
		return null;
	}

	protected drawImpl(
		scope: BitmapCoordinatesRenderingScope,
		args: CustomSeriesDrawArgs<
			HorzScaleItem,
			TData,
			DualRangeHistogramSeriesOptions
		>
	): void {
		const { data, options, priceToCoordinate, isHovered, hitTestData } = args;
		this._hitAreas = [];

		const baseCoordinate = priceToCoordinate(options.baseValue);
		if (baseCoordinate === null) {
			return;
		}

		const items = mapVisibleBars<
			HorzScaleItem,
			TData,
			DualRangeHistogramBarItem
		>(data, (bar, index) => ({
			x: bar.x,
			time: bar.time,
			index,
			values: bar.originalData.values,
			colors: bar.originalData.colors,
		}));
		if (items.length === 0) {
			return;
		}

		// A pixel-height column needs a value to measure itself against; with no
		// positive scale (an all-zero data set, say) there is nothing to draw.
		const scale =
			options.scaleMode === 'price'
				? null
				: this._pixelScale(options, data.bars, items);
		if (options.scaleMode === 'pixels' && scale === null) {
			return;
		}

		const horizontalPixelRatio = scope.horizontalPixelRatio;
		calculateColumnPositionsInPlace(
			items,
			effectiveBarSpacing(data),
			horizontalPixelRatio,
			0,
			items.length,
			getConflationFactor(data)
		);

		const borderWidth =
			options.borderColor === null
				? 0
				: Math.max(1, Math.round(options.borderWidth * horizontalPixelRatio));
		const hovered =
			isHovered && options.highlightHovered && typeof hitTestData === 'number'
				? hitTestData
				: null;

		const ctx = scope.context;
		ctx.save();
		for (const item of items) {
			const column = item.column;
			if (column === undefined) {
				continue;
			}
			const fullWidth = column.right - column.left + 1;
			const width = Math.max(
				1,
				Math.round((fullWidth * options.widthPercent) / 100)
			);
			ctx.globalAlpha = hovered === null || hovered === item.index ? 1 : 0.35;
			this._drawPoint(scope, item, options, {
				left: column.left + Math.round((fullWidth - width) / 2),
				width,
				borderWidth,
				baseCoordinate,
				halfGap: options.gap / 2,
				scale,
				priceToCoordinate,
			});
		}
		ctx.restore();
	}

	/**
	 * The value which fills half of `maxHeight`, or `null` when the columns
	 * cannot be scaled because every value is zero or not a number.
	 */
	private _pixelScale(
		options: DualRangeHistogramSeriesOptions,
		bars: readonly { originalData: TData }[],
		visible: readonly DualRangeHistogramBarItem[]
	): number | null {
		if (typeof options.normalize === 'number') {
			return options.normalize > 0 ? options.normalize : null;
		}
		if (options.normalize === 'all') {
			// The whole data set is scanned, so the result is kept until the
			// library hands over a different array of bars.
			if (this._allScale === null || this._allScale.bars !== bars) {
				let all = 0;
				for (const bar of bars) {
					all = Math.max(all, largestAbsolute(bar.originalData.values));
				}
				this._allScale = { bars, value: all };
			}
			return this._allScale.value > 0 ? this._allScale.value : null;
		}
		let max = 0;
		for (const item of visible) {
			max = Math.max(max, largestAbsolute(item.values));
		}
		return max > 0 ? max : null;
	}

	private _drawPoint(
		scope: BitmapCoordinatesRenderingScope,
		item: DualRangeHistogramBarItem,
		options: DualRangeHistogramSeriesOptions,
		geometry: PointGeometry
	): void {
		const verticalPixelRatio = scope.verticalPixelRatio;
		const { left, width } = geometry;
		let top = Number.POSITIVE_INFINITY;
		let bottom = Number.NEGATIVE_INFINITY;

		for (let index = 0; index < item.values.length; index++) {
			const value = item.values[index];
			if (!Number.isFinite(value)) {
				continue;
			}
			const endpoint = this._columnEnd(value, geometry.baseCoordinate, options, geometry);
			if (endpoint === null) { continue; }
			const growsUp = endpoint <= geometry.baseCoordinate;
			const shift = growsUp ? -geometry.halfGap : geometry.halfGap;
			const start = geometry.baseCoordinate + shift;
			const end = endpoint + shift;
			const box = positionsBox(start, end, verticalPixelRatio);
			const key = columnKey(index);
			const radius = clampCornerRadius(
				options.borderRadius[key] * scope.horizontalPixelRatio,
				width,
				box.length
			);
			const radii: CornerRadii = growsUp
				? [radius, radius, 0, 0]
				: [0, 0, radius, radius];
			drawRoundRectWithBorder(
				scope.context,
				left,
				box.position,
				width,
				box.length,
				item.colors?.[index] ?? options.colors[key],
				geometry.borderWidth,
				radii,
				options.borderColor ?? undefined
			);
			top = Math.min(top, box.position);
			bottom = Math.max(bottom, box.position + box.length);
		}

		if (top <= bottom) {
			this._hitAreas.push({
				index: item.index,
				left: left / scope.horizontalPixelRatio,
				right: (left + width) / scope.horizontalPixelRatio,
				top: top / verticalPixelRatio,
				bottom: bottom / verticalPixelRatio,
				objectId: `bar-${item.index}`,
			});
		}
	}

	/**
	 * The outer end of a column, in media coordinates, or `null` when the value
	 * has no coordinate on the price scale.
	 */
	private _columnEnd(
		value: number,
		start: number,
		options: DualRangeHistogramSeriesOptions,
		geometry: PointGeometry
	): number | null {
		if (options.scaleMode === 'price') {
			const coordinate = geometry.priceToCoordinate(options.baseValue + value);
			if (coordinate === null) {
				return null;
			}
			return coordinate;
		}
		const height =
			(Math.abs(value) / (geometry.scale as number)) * (options.maxHeight / 2);
		return value >= 0 ? start - height : start + height;
	}
}
