import { PaneRendererCustomData, PriceToCoordinateConverter, Time } from 'lightweight-charts';
import { CustomSeriesHitTestResult } from '@tradingview/lwc-toolkit/custom-series/compat';
import { nearestBar, seriesHitTestTolerance } from '@tradingview/lwc-toolkit/custom-series/hit-test';
import {
	BitmapCoordinatesRenderingScope,
	CustomSeriesDrawArgs,
	CustomSeriesRendererBase,
} from '@tradingview/lwc-toolkit/custom-series/renderer-base';
import { forEachVisibleBar } from '@tradingview/lwc-toolkit/custom-series/visible-bars';
import { fullBarWidthAfter } from '@tradingview/lwc-toolkit/dimensions/full-width';
import { nonNegativeOr } from '@tradingview/lwc-toolkit/numbers';

import { isCanvasColor } from './color';
import { HeatmapData } from './data';
import { Span, addAmounts, edgeSpan, fitsInside, gapSpan, insetSpan, isDrawnCell, nearestCell } from './geometry';
import { HeatmapAmountRange, HeatmapSeriesOptions, defaultOptions } from './options';

/**
 * How many colors the renderer remembers the validity of: as many as the
 * largest `createColorScale` holds, so a scale's colors are each checked once.
 */
const VALID_COLORS_CACHE_SIZE = 1024;

/** The range of the amounts of the drawn cells of the points in view, or `null` when there are none. */
function amountRangeInView<HorzScaleItem, TData extends HeatmapData<HorzScaleItem>>(
	data: PaneRendererCustomData<HorzScaleItem, TData>
): HeatmapAmountRange | null {
	let range: HeatmapAmountRange | null = null;
	forEachVisibleBar(data, bar => {
		range = addAmounts(range, bar.originalData.cells);
	});
	return range;
}

/**
 * Adds the frame between a cell's outer and inner box to `rects`, as up to
 * four rectangles: the strips above and below the inner box, full width, and
 * the strips left and right of it.
 */
function pushFrame(rects: number[], column: Span, row: Span, innerColumn: Span, innerRow: Span): void {
	const top = innerRow.position - row.position;
	const bottom = row.position + row.length - (innerRow.position + innerRow.length);
	const left = innerColumn.position - column.position;
	const right = column.position + column.length - (innerColumn.position + innerColumn.length);
	if (top > 0) {
		rects.push(column.position, row.position, column.length, top);
	}
	if (bottom > 0) {
		rects.push(column.position, innerRow.position + innerRow.length, column.length, bottom);
	}
	if (left > 0) {
		rects.push(column.position, innerRow.position, left, innerRow.length);
	}
	if (right > 0) {
		rects.push(innerColumn.position + innerColumn.length, innerRow.position, right, innerRow.length);
	}
}

/** Fills the rectangles in `rects`, four numbers each, as one path. */
function fillRects(ctx: CanvasRenderingContext2D, color: string, rects: readonly number[]): void {
	ctx.fillStyle = color;
	ctx.beginPath();
	for (let i = 0; i < rects.length; i += 4) {
		ctx.rect(rects[i], rects[i + 1], rects[i + 2], rects[i + 3]);
	}
	ctx.fill();
}

export class HeatmapSeriesRenderer<
	HorzScaleItem = Time,
	TData extends HeatmapData<HorzScaleItem> = HeatmapData<HorzScaleItem>
> extends CustomSeriesRendererBase<HorzScaleItem, TData, HeatmapSeriesOptions> {
	/** Whether the canvas accepts a color, by color string. */
	private readonly _validColors = new Map<string, boolean>();

	/**
	 * Reports the cell under the pointer, within the series' `hitTestTolerance`
	 * above or below it: `objectId` is `'cell-<index>'`, the index into the
	 * point's `cells`. Only the column whose slot holds the pointer is
	 * searched, the column the crosshair snaps to and `param.seriesData` holds,
	 * so a cell of the next column is never reported. Called by the library
	 * from v5.2 onwards; older hosts never call it.
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
		// The series has no conflation reducer, so the chart never conflates
		// it and every column is one bar spacing wide. The crosshair snaps to
		// the bar whose slot runs from just right of half a bar spacing left of
		// it to half a bar spacing right of it, so only that bar is measured.
		const halfSpacing = data.barSpacing / 2;
		const found: { cell: { index: number; distance: number } | null } = { cell: null };
		const hit = nearestBar(data, x, halfSpacing, seriesHitTestTolerance(options), bar => {
			if (x <= bar.x - halfSpacing || x > bar.x + halfSpacing) {
				return null;
			}
			found.cell = nearestCell(bar.originalData.cells, y, priceToCoordinate);
			return found.cell?.distance ?? null;
		});
		const cell = found.cell;
		if (hit === null || cell === null) {
			return null;
		}
		return {
			distance: cell.distance,
			objectId: `cell-${cell.index}`,
			type: 'range',
		};
	}

	protected drawImpl(
		scope: BitmapCoordinatesRenderingScope,
		{ data, options, priceToCoordinate }: CustomSeriesDrawArgs<HorzScaleItem, TData, HeatmapSeriesOptions>
	): void {
		const range = amountRangeInView(data);
		if (range === null) {
			return;
		}
		const { context: ctx, horizontalPixelRatio, verticalPixelRatio, bitmapSize } = scope;
		const shader = typeof options.cellShader === 'function' ? options.cellShader : defaultOptions.cellShader;
		const gap = nonNegativeOr(options.cellGap, defaultOptions.cellGap);
		const gapX = Math.round(gap * horizontalPixelRatio);
		const gapY = Math.round(gap * verticalPixelRatio);
		const border = nonNegativeOr(options.cellBorderWidth, defaultOptions.cellBorderWidth);
		// A border color the canvas cannot parse draws no border, and takes no
		// room inside the cells either.
		const borderColor = border > 0 && this._isValidColor(options.cellBorderColor) ? options.cellBorderColor : null;
		const borderX = borderColor === null ? 0 : Math.round(border * horizontalPixelRatio);
		const borderY = borderColor === null ? 0 : Math.round(border * verticalPixelRatio);
		const halfSpacing = data.barSpacing / 2;
		// Whether the columns get the gap and the border is decided once, from
		// the bar spacing before rounding, so that every column gets the same.
		const columnSize = data.barSpacing * horizontalPixelRatio;
		const columnGap = fitsInside(columnSize, gapX) ? gapX : 0;
		const columnBorder = fitsInside(columnSize - columnGap, borderX) ? borderX : 0;

		// The cells are collected by color first and then filled with one path
		// per color, so that a paint sets a fill and fills a path once per color
		// rather than once per cell.
		const fills = new Map<string, number[]>();
		const frames: number[] = [];
		let previousTime = Number.NaN;
		let previousRight: number | null = null;
		forEachVisibleBar(data, bar => {
			// A column right after the previous one starts where that one ended,
			// so the edge they share is rounded once and leaves no seam.
			const slot = fullBarWidthAfter(bar.time === previousTime + 1 ? previousRight : null, bar.x, halfSpacing, horizontalPixelRatio);
			previousTime = bar.time;
			previousRight = slot.position + slot.length;
			// At a bar spacing under a device pixel, some columns round to
			// nothing.
			if (slot.length <= 0) {
				return;
			}
			const column = gapSpan(slot, columnGap);
			const innerColumn = insetSpan(column, columnBorder);
			for (const cell of bar.originalData.cells) {
				if (!isDrawnCell(cell)) {
					continue;
				}
				const lowY = priceToCoordinate(cell.low);
				const highY = priceToCoordinate(cell.high);
				if (lowY === null || highY === null) {
					continue;
				}
				const edges = edgeSpan(lowY, highY, verticalPixelRatio);
				// A cell whose edges round to the same pixel is not drawn, and
				// neither is a cell off the pane.
				if (edges.length <= 0 || edges.position >= bitmapSize.height || edges.position + edges.length <= 0) {
					continue;
				}
				const color = shader(cell.amount, range);
				// The canvas ignores a fill it cannot parse and would keep the
				// last one, painting the cell in another cell's color: such a cell
				// is left out, border and all.
				if (!this._isValidColor(color)) {
					continue;
				}
				const rowSize = Math.abs(highY - lowY) * verticalPixelRatio;
				const rowGap = fitsInside(rowSize, gapY) ? gapY : 0;
				const row = gapSpan(edges, rowGap);
				const innerRow = insetSpan(row, fitsInside(rowSize - rowGap, borderY) ? borderY : 0);
				let rects = fills.get(color);
				if (rects === undefined) {
					rects = [];
					fills.set(color, rects);
				}
				rects.push(innerColumn.position, innerRow.position, innerColumn.length, innerRow.length);
				if (borderColor !== null) {
					pushFrame(frames, column, row, innerColumn, innerRow);
				}
			}
		});

		fills.forEach((rects: number[], color: string) => fillRects(ctx, color, rects));
		if (borderColor !== null && frames.length > 0) {
			fillRects(ctx, borderColor, frames);
		}
	}

	/**
	 * Whether the canvas accepts a color. The answers are remembered for the
	 * first colors seen, up to a limit, so that a shader returning a new color
	 * for every amount cannot grow the cache without bound; a color past the
	 * limit is checked every time.
	 */
	private _isValidColor(color: unknown): color is string {
		if (typeof color !== 'string') {
			return false;
		}
		let valid = this._validColors.get(color);
		if (valid === undefined) {
			valid = isCanvasColor(color);
			if (this._validColors.size < VALID_COLORS_CACHE_SIZE) {
				this._validColors.set(color, valid);
			}
		}
		return valid;
	}
}
