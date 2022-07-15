import { fillRectInnerBorder } from '../helpers/canvas-helpers';

import { CandlesticksColorerStyle } from '../model/series-bar-colorer';
import { SeriesItemsIndexesRange } from '../model/time-data';

import { BarCandlestickItemBase } from './bars-renderer';
import { IPaneRenderer } from './ipane-renderer';
import { optimalCandlestickWidth } from './optimal-bar-width';

export interface CandlestickItem extends BarCandlestickItemBase, CandlesticksColorerStyle {
}

export interface PaneRendererCandlesticksData {
	bars: readonly CandlestickItem[];

	barSpacing: number;

	wickVisible: boolean;
	borderVisible: boolean;

	visibleRange: SeriesItemsIndexesRange | null;
}

const enum Constants {
	BarBorderWidth = 1,
}

export class PaneRendererCandlesticks implements IPaneRenderer {
	private _data: PaneRendererCandlesticksData | null = null;

	// scaled with pixelRatio
	private _barWidth: number = 0;

	public setData(data: PaneRendererCandlesticksData): void {
		this._data = data;
	}

	public draw(ctx: CanvasRenderingContext2D, pixelRatio: number, isHovered: boolean, hitTestData?: unknown): void {
		if (this._data === null || this._data.bars.length === 0 || this._data.visibleRange === null) {
			return;
		}

		// now we know pixelRatio and we could calculate barWidth effectively
		this._barWidth = optimalCandlestickWidth(this._data.barSpacing, pixelRatio);

		// grid and crosshair have line width = Math.floor(pixelRatio)
		// if this value is odd, we have to make candlesticks' width odd
		// if this value is even, we have to make candlesticks' width even
		// in order of keeping crosshair-over-candlesticks drawing symmetric
		if (this._barWidth >= 2) {
			const wickWidth = Math.floor(pixelRatio);
			if ((wickWidth % 2) !== (this._barWidth % 2)) {
				this._barWidth--;
			}
		}

		const bars = this._data.bars;
		if (this._data.wickVisible) {
			this._drawWicks(ctx, bars, this._data.visibleRange, pixelRatio);
		}

		if (this._data.borderVisible) {
			this._drawBorder(ctx, bars, this._data.visibleRange, this._data.barSpacing, pixelRatio);
		}

		const borderWidth = this._calculateBorderWidth(pixelRatio);

		if (!this._data.borderVisible || this._barWidth > borderWidth * 2) {
			this._drawCandles(ctx, bars, this._data.visibleRange, pixelRatio);
		}
	}

	private _drawWicks(ctx: CanvasRenderingContext2D, bars: readonly CandlestickItem[], visibleRange: SeriesItemsIndexesRange, pixelRatio: number): void {
		if (this._data === null) {
			return;
		}
		let prevWickColor = '';

		let wickWidth = Math.min(Math.floor(pixelRatio), Math.floor(this._data.barSpacing * pixelRatio));
		wickWidth = Math.max(Math.floor(pixelRatio), Math.min(wickWidth, this._barWidth));
		const wickOffset = Math.floor(wickWidth * 0.5);

		let prevEdge: number | null = null;

		for (let i = visibleRange.from; i < visibleRange.to; i++) {
			const bar = bars[i];
			if (bar.barWickColor !== prevWickColor) {
				ctx.fillStyle = bar.barWickColor;
				prevWickColor = bar.barWickColor;
			}

			const top = Math.round(Math.min(bar.openY, bar.closeY) * pixelRatio);
			const bottom = Math.round(Math.max(bar.openY, bar.closeY) * pixelRatio);

			const high = Math.round(bar.highY * pixelRatio);
			const low = Math.round(bar.lowY * pixelRatio);

			const scaledX = Math.round(pixelRatio * bar.x);

			let left = scaledX - wickOffset;
			const right = left + wickWidth - 1;
			if (prevEdge !== null) {
				left = Math.max(prevEdge + 1, left);
				left = Math.min(left, right);
			}
			const width = right - left + 1;

			ctx.fillRect(left, high, width, top - high);
			ctx.fillRect(left, bottom + 1, width, low - bottom);

			prevEdge = right;
		}
	}

	private _calculateBorderWidth(pixelRatio: number): number {
		let borderWidth = Math.floor(Constants.BarBorderWidth * pixelRatio);
		if (this._barWidth <= 2 * borderWidth) {
			borderWidth = Math.floor((this._barWidth - 1) * 0.5);
		}
		const res = Math.max(Math.floor(pixelRatio), borderWidth);
		if (this._barWidth <= res * 2) {
			// do not draw bodies, restore original value
			return Math.max(Math.floor(pixelRatio), Math.floor(Constants.BarBorderWidth * pixelRatio));
		}
		return res;
	}

	private _drawBorder(ctx: CanvasRenderingContext2D, bars: readonly CandlestickItem[], visibleRange: SeriesItemsIndexesRange, barSpacing: number, pixelRatio: number): void {
		if (this._data === null) {
			return;
		}
		let prevBorderColor: string | undefined = '';
		const borderWidth = this._calculateBorderWidth(pixelRatio);

		let prevEdge: number | null = null;

		for (let i = visibleRange.from; i < visibleRange.to; i++) {
			const bar = bars[i];
			if (bar.barBorderColor !== prevBorderColor) {
				ctx.fillStyle = bar.barBorderColor;
				prevBorderColor = bar.barBorderColor;
			}

			let left = Math.round(bar.x * pixelRatio) - Math.floor(this._barWidth * 0.5);
			// this is important to calculate right before patching left
			const right = left + this._barWidth - 1;

			const top = Math.round(Math.min(bar.openY, bar.closeY) * pixelRatio);
			const bottom = Math.round(Math.max(bar.openY, bar.closeY) * pixelRatio);

			if (prevEdge !== null) {
				left = Math.max(prevEdge + 1, left);
				left = Math.min(left, right);
			}
			if (this._data.barSpacing * pixelRatio > 2 * borderWidth) {
				fillRectInnerBorder(ctx, left, top, right - left + 1, bottom - top + 1, borderWidth);
			} else {
				const width = right - left + 1;
				ctx.fillRect(left, top, width, bottom - top + 1);
			}
			prevEdge = right;
		}
	}

	private _drawCandles(ctx: CanvasRenderingContext2D, bars: readonly CandlestickItem[], visibleRange: SeriesItemsIndexesRange, pixelRatio: number): void {
		if (this._data === null) {
			return;
		}

		let prevBarColor = '';

		const borderWidth = this._calculateBorderWidth(pixelRatio);

		for (let i = visibleRange.from; i < visibleRange.to; i++) {
			const bar = bars[i];

			let top = Math.round(Math.min(bar.openY, bar.closeY) * pixelRatio);
			let bottom = Math.round(Math.max(bar.openY, bar.closeY) * pixelRatio);

			let left = Math.round(bar.x * pixelRatio) - Math.floor(this._barWidth * 0.5);
			let right = left + this._barWidth - 1;

			if (bar.barColor !== prevBarColor) {
				const barColor = bar.barColor;
				ctx.fillStyle = barColor;
				prevBarColor = barColor;
			}

			if (this._data.borderVisible) {
				left += borderWidth;
				top += borderWidth;
				right -= borderWidth;
				bottom -= borderWidth;
			}

			if (top > bottom) {
				continue;
			}
			ctx.fillRect(left, top, right - left + 1, bottom - top + 1);
		}
	}
}
