import { CustomBarItemData, PaneRendererCustomData, PriceToCoordinateConverter, Time } from 'lightweight-charts';
import {
	CornerRadii,
	clampCornerRadius,
	drawRoundRectWithBorder,
} from '@tradingview/lwc-toolkit/canvas/round-rect';
import {
	BitmapCoordinatesRenderingScope,
	CustomSeriesDrawArgs,
	CustomSeriesRendererBase,
} from '@tradingview/lwc-toolkit/custom-series/renderer-base';
import { ColumnPosition, ColumnPositionItem, calculateColumnPositionsInPlace } from '@tradingview/lwc-toolkit/dimensions/columns';
import { positionsBox, positionsLine } from '@tradingview/lwc-toolkit/dimensions/positions';
import { getConflationFactor, mapVisibleBars } from '@tradingview/lwc-toolkit/custom-series/visible-bars';
import { stackLevels } from '@tradingview/lwc-toolkit/custom-series/stacking';

import { StackedBarsHitTestResult, isHitTestData } from './compat';
import { StackedBand, bandValues, stackBands } from './stack';
import { StackedBarsData } from './data';
import { StackedBarsSeriesOptions, defaultOptions } from './options';

/**
 * Scrim painted over the rest of the column under the cursor, so that the
 * hovered segment stands out. Neutral grey works on a light and a dark theme
 * alike, and painting it last keeps the segment colours themselves correct
 * even where a negative band overlaps the one below it.
 */
const hoverScrimColor = 'rgba(128, 128, 128, 0.4)';

interface StackedBarsColumnItem extends ColumnPositionItem {
	x: number;
	time: number;
	/** Index of the bar within `data.bars`, which is what a hit test reports. */
	index: number;
	bands: StackedBand[];
	colors?: readonly (string | undefined)[];
	column?: ColumnPosition;
}

interface SegmentRect {
	top: number;
	height: number;
	index: number;
}

/**
 * Bar spacing including the conflation factor, so that conflated columns stay
 * as wide as the space they now cover. `conflationFactor` was added to the
 * library after 5.0.0, hence the guarded read.
 */
function effectiveBarSpacing<HorzScaleItem, TData extends StackedBarsData<HorzScaleItem>>(
	data: PaneRendererCustomData<HorzScaleItem, TData>
): number {
	const factor = (data as { conflationFactor?: number }).conflationFactor;
	return data.barSpacing * (factor !== undefined && factor > 0 ? factor : 1);
}

/** Width of a column in media coordinates, used for hit testing. */
function columnWidthMedia(
	options: StackedBarsSeriesOptions,
	barSpacing: number
): number {
	if (options.columnWidthMode === 'percent') {
		return (barSpacing * Math.min(100, Math.max(0, options.widthPercent))) / 100;
	}
	return barSpacing;
}

function columnGeometry(
	x: number,
	column: ColumnPosition,
	options: StackedBarsSeriesOptions,
	barSpacing: number,
	horizontalPixelRatio: number
): { left: number; width: number } {
	if (options.columnWidthMode === 'percent') {
		const line = positionsLine(
			x,
			horizontalPixelRatio,
			columnWidthMedia(options, barSpacing)
		);
		return { left: line.position, width: Math.max(1, line.length) };
	}
	return { left: column.left, width: Math.max(1, column.right - column.left + 1) };
}

function cornerRadii(
	rect: SegmentRect,
	columnTop: number,
	columnBottom: number,
	radius: number,
	width: number
): CornerRadii {
	if (radius <= 0) {
		return [0, 0, 0, 0];
	}
	const clamped = clampCornerRadius(radius, width, rect.height);
	const top = rect.top === columnTop ? clamped : 0;
	const bottom = rect.top + rect.height === columnBottom ? clamped : 0;
	return [top, top, bottom, bottom];
}

export class StackedBarsSeriesRenderer<
	HorzScaleItem = Time,
	TData extends StackedBarsData<HorzScaleItem> = StackedBarsData<HorzScaleItem>
> extends CustomSeriesRendererBase<HorzScaleItem, TData, StackedBarsSeriesOptions>
{
	/**
	 * Reports the segment under the cursor. Optional on
	 * `ICustomSeriesPaneRenderer` from `lightweight-charts` 5.1; on 5.0.0 it is
	 * simply an extra method the chart never calls.
	 */
	public hitTest(
		x: number,
		y: number,
		priceToCoordinate: PriceToCoordinateConverter
	): StackedBarsHitTestResult | null {
		const data = this.data;
		const options = this.options;
		if (data === null || options === null || data.visibleRange === null) {
			return null;
		}
		const { from, to } = data.visibleRange;
		let hitIndex = -1;
		let hitDistance = Number.POSITIVE_INFINITY;
		for (let i = from; i < to; i++) {
			const distance = Math.abs(data.bars[i].x - x);
			if (distance < hitDistance) {
				hitDistance = distance;
				hitIndex = i;
			}
		}
		const barSpacing = effectiveBarSpacing(data);
		if (hitIndex < 0 || hitDistance > columnWidthMedia(options, barSpacing) / 2) {
			return null;
		}
		const bands = stackBands(data.bars[hitIndex].originalData.values, options);
		const levels = stackLevels(bandValues(bands), options.base);
		let previousY = priceToCoordinate(options.base);
		if (previousY === null) {
			return null;
		}
		for (let i = 0; i < bands.length; i++) {
			const levelY = priceToCoordinate(levels[i]);
			if (levelY === null) {
				continue;
			}
			const top = Math.min(previousY, levelY);
			const bottom = Math.max(previousY, levelY);
			previousY = levelY;
			if (y >= top && y <= bottom) {
				return {
					distance: 0,
					objectId: String(bands[i].index),
					type: 'range',
					hitTestData: { barIndex: hitIndex, segmentIndex: bands[i].index },
				};
			}
		}
		return null;
	}

	protected drawImpl(
		scope: BitmapCoordinatesRenderingScope,
		args: CustomSeriesDrawArgs<HorzScaleItem, TData, StackedBarsSeriesOptions>
	): void {
		const { data, options, priceToCoordinate, isHovered, hitTestData } = args;
		const baseY = priceToCoordinate(options.base);
		if (baseY === null) {
			return;
		}
		const ctx = scope.context;
		const { horizontalPixelRatio, verticalPixelRatio } = scope;
		const barSpacing = effectiveBarSpacing(data);
		const items = mapVisibleBars(
			data,
			(bar: CustomBarItemData<HorzScaleItem, TData>, index: number): StackedBarsColumnItem => ({
				x: bar.x,
				time: bar.time,
				index,
				bands: stackBands(bar.originalData.values, options),
				colors: bar.originalData.colors,
			})
		);
		calculateColumnPositionsInPlace(
			items,
			barSpacing,
			horizontalPixelRatio,
			0,
			items.length,
			getConflationFactor(data)
		);
		const palette = options.colors.length > 0 ? options.colors : defaultOptions.colors;
		const borderWidth = options.segmentBorderWidth > 0
			? Math.max(1, Math.round(options.segmentBorderWidth * horizontalPixelRatio))
			: 0;
		const radius = options.radius * horizontalPixelRatio;
		const hovered = isHovered && isHitTestData(hitTestData) ? hitTestData : null;

		for (const item of items) {
			const column = item.column;
			if (column === undefined) {
				continue;
			}
			const { left, width } = columnGeometry(
				item.x,
				column,
				options,
				barSpacing,
				horizontalPixelRatio
			);
			const levels = stackLevels(bandValues(item.bands), options.base);
			const rects: SegmentRect[] = [];
			let columnTop = Number.POSITIVE_INFINITY;
			let columnBottom = Number.NEGATIVE_INFINITY;
			let previousY = baseY;
			for (let i = 0; i < item.bands.length; i++) {
				const levelY = priceToCoordinate(levels[i]);
				if (levelY === null) {
					continue;
				}
				const box = positionsBox(previousY, levelY, verticalPixelRatio);
				previousY = levelY;
				if (item.bands[i].value === 0) {
					continue;
				}
				rects.push({ top: box.position, height: box.length, index: item.bands[i].index });
				columnTop = Math.min(columnTop, box.position);
				columnBottom = Math.max(columnBottom, box.position + box.length);
			}
			for (const rect of rects) {
				drawRoundRectWithBorder(
					ctx,
					left,
					rect.top,
					width,
					rect.height,
					item.colors?.[rect.index] ?? palette[rect.index % palette.length],
					borderWidth,
					cornerRadii(rect, columnTop, columnBottom, radius, width),
					borderWidth > 0 ? options.segmentBorderColor : undefined
				);
			}
			if (hovered !== null && hovered.barIndex === item.index && rects.length > 0) {
				const hoveredRect = rects.find(
					(rect: SegmentRect) => rect.index === hovered.segmentIndex
				);
				ctx.beginPath();
				ctx.rect(left, columnTop, width, columnBottom - columnTop);
				if (hoveredRect !== undefined) {
					ctx.rect(left, hoveredRect.top, width, hoveredRect.height);
				}
				ctx.fillStyle = hoverScrimColor;
				ctx.fill('evenodd');
			}
		}
	}
}
