import { CustomBarItemData, PriceToCoordinateConverter, Time } from 'lightweight-charts';
import { CustomSeriesHitTestResult } from '@tradingview/lwc-toolkit/custom-series/compat';
import { distanceToRange, nearestBar, seriesHitTestTolerance } from '@tradingview/lwc-toolkit/custom-series/hit-test';
import {
	BitmapCoordinatesRenderingScope,
	CustomSeriesDrawArgs,
	CustomSeriesRendererBase,
} from '@tradingview/lwc-toolkit/custom-series/renderer-base';
import { mapVisibleBars } from '@tradingview/lwc-toolkit/custom-series/visible-bars';
import { ColumnPositionItem, calculateColumnPositionsInPlace } from '@tradingview/lwc-toolkit/dimensions/columns';
import { BitmapPositionLength } from '@tradingview/lwc-toolkit/dimensions/common';
import { positionsBox, positionsLine } from '@tradingview/lwc-toolkit/dimensions/positions';

import { GroupedBarsData } from './data';
import { ColumnSpan, groupWidth, splitGroup } from './layout';
import { GroupedBarsSeriesOptions, defaultOptions } from './options';
import { groupedBarsBase, isDrawnValue } from './values';

/** A visible point, laid out by `calculateColumnPositionsInPlace` in `histogram` mode. */
interface GroupItem extends ColumnPositionItem {
	values: readonly (number | null)[];
	colors: readonly (string | undefined)[] | undefined;
}

/** A column ready to paint: its index within the point and its vertical extent in bitmap pixels. */
interface ColumnBox {
	column: number;
	box: BitmapPositionLength;
}

/** The column of one point nearest the pointer. */
interface ColumnHit {
	column: number;
	distance: number;
}

export class GroupedBarsSeriesRenderer<
	HorzScaleItem = Time,
	TData extends GroupedBarsData<HorzScaleItem> = GroupedBarsData<HorzScaleItem>
> extends CustomSeriesRendererBase<HorzScaleItem, TData, GroupedBarsSeriesOptions> {
	/**
	 * @param _countColumns - The number of columns every group is split into,
	 * for the bars being drawn. Asked on every draw and hit test rather than on
	 * `update`: the chart updates the view while `setData` and `update` are
	 * still running, before the series has the new data to count.
	 */
	public constructor(
		private readonly _countColumns: (bars: readonly CustomBarItemData<HorzScaleItem, TData>[]) => number
	) {
		super();
	}

	/**
	 * Reports the column nearest the cursor, within the series'
	 * `hitTestTolerance`, so that the chart can report it through the
	 * crosshair: `objectId` is `'column-<point>-<index>'`, the point's position
	 * in `series.data()` and the column's index in its `values`. Called by the
	 * library from v5.2 onwards; older hosts never call it.
	 */
	public hitTest(
		x: number,
		y: number,
		priceToCoordinate: PriceToCoordinateConverter
	): CustomSeriesHitTestResult | null {
		const data = this.data;
		const options = this.options;
		if (data === null || options === null) {
			return null;
		}
		const base = groupedBarsBase(options);
		const baseY = priceToCoordinate(base);
		if (baseY === null) {
			return null;
		}
		// The series has no conflation reducer, so the chart never conflates it
		// and every group is one bar spacing apart.
		const count = this._countColumns(data.bars);
		const halfWidth = groupWidth(options, data.barSpacing) / 2;
		const columnWidth = (2 * halfWidth) / count;
		const tolerance = seriesHitTestTolerance(options);
		// Every column of a group, not only the one under the pointer: a
		// neighbor can be nearer, and an empty column is skipped on its own.
		const nearestColumn = (bar: CustomBarItemData<HorzScaleItem, TData>): ColumnHit | null => {
			const values = bar.originalData.values;
			let best: ColumnHit | null = null;
			for (let column = 0; column < Math.min(values.length, count); column++) {
				const value = values[column];
				const valueY = isDrawnValue(value, base) ? priceToCoordinate(value) : null;
				if (valueY === null) {
					continue;
				}
				const left = bar.x - halfWidth + column * columnWidth;
				const dx = distanceToRange(x, left, left + columnWidth);
				const dy = distanceToRange(y, baseY, valueY);
				const distance = Math.sqrt(dx * dx + dy * dy);
				if (best === null || distance < best.distance) {
					best = { column, distance };
				}
			}
			return best;
		};
		const hit = nearestBar(data, x, halfWidth + tolerance, tolerance, bar => nearestColumn(bar)?.distance ?? null);
		const column = hit === null ? null : nearestColumn(data.bars[hit.index]);
		if (hit === null || column === null) {
			return null;
		}
		return {
			distance: hit.distance,
			objectId: `column-${hit.index}-${column.column}`,
			type: 'range',
		};
	}

	protected drawImpl(
		scope: BitmapCoordinatesRenderingScope,
		{ data, options, priceToCoordinate }: CustomSeriesDrawArgs<HorzScaleItem, TData, GroupedBarsSeriesOptions>
	): void {
		const base = groupedBarsBase(options);
		const baseY = priceToCoordinate(base);
		if (baseY === null) {
			return;
		}
		const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = scope;
		const palette = options.colors.length > 0 ? options.colors : defaultOptions.colors;
		const count = this._countColumns(data.bars);
		const items = mapVisibleBars(data, (bar: CustomBarItemData<HorzScaleItem, TData>): GroupItem => ({
			x: bar.x,
			time: bar.time,
			values: bar.originalData.values,
			colors: bar.originalData.colors,
		}));
		const histogram = options.columnWidthMode === 'histogram';
		if (histogram) {
			calculateColumnPositionsInPlace(items, data.barSpacing, horizontalPixelRatio, 0, items.length);
		}
		// Every group the same whole number of device pixels wide, and no wider
		// than the bar spacing covers, so that at 100% neighboring groups touch
		// or are a pixel apart but never overlap.
		const percentWidth = Math.max(1, Math.min(
			Math.round(groupWidth(options, data.barSpacing) * horizontalPixelRatio),
			Math.floor(data.barSpacing * horizontalPixelRatio)
		));
		const boxes: ColumnBox[] = [];
		for (const item of items) {
			const group = histogram && item.column !== undefined
				? { left: item.column.left, width: item.column.right - item.column.left + 1 }
				: lineSpan(positionsLine(item.x, horizontalPixelRatio, percentWidth, true));
			const spans = splitGroup(group.left, group.width, count);
			boxes.length = 0;
			for (let column = 0; column < Math.min(item.values.length, count); column++) {
				const value = item.values[column];
				const valueY = isDrawnValue(value, base) ? priceToCoordinate(value) : null;
				if (valueY !== null) {
					boxes.push({ column, box: positionsBox(baseY, valueY, verticalPixelRatio) });
				}
			}
			if (group.width < count) {
				// Too narrow for one pixel per column, so columns share pixels: the
				// tallest go first, and the shorter ones in front of them stay
				// visible.
				boxes.sort((a: ColumnBox, b: ColumnBox) => b.box.length - a.box.length);
			}
			for (const { column, box } of boxes) {
				ctx.fillStyle = item.colors?.[column] ?? palette[column % palette.length];
				ctx.fillRect(spans[column].left, box.position, spans[column].width, box.length);
			}
		}
	}
}

function lineSpan(line: BitmapPositionLength): ColumnSpan {
	return { left: line.position, width: line.length };
}
