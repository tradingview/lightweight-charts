import { strokeRectInnerWithFill } from '../helpers/canvas-helpers';

import { SeriesItemsIndexesRange } from '../model/time-data';

import { BarCandlestickItemBase } from './bars-renderer';
import { IPaneRenderer } from './ipane-renderer';
import { optimalBarWidth } from './optimal-bar-width';

export interface CandlestickItem extends BarCandlestickItemBase {
	color: string;
	borderColor: string;
	wickColor: string;
}

export interface PaneRendererCandlesticksData {
	bars: ReadonlyArray<CandlestickItem>;

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
	private _barWidth: number = 0;

	public setData(data: PaneRendererCandlesticksData): void {
		this._data = data;
		this._barWidth = optimalBarWidth(data.barSpacing);
	}

	public draw(ctx: CanvasRenderingContext2D, devicePixelRation: number, isHovered: boolean, hitTestData?: unknown): void {
		if (this._data === null || this._data.bars.length === 0 || this._data.visibleRange === null) {
			return;
		}

		const bars = this._data.bars;
		if (this._data.wickVisible) {
			this._drawWicks(ctx, bars, this._data.visibleRange, devicePixelRation);
		}

		if (this._data.borderVisible) {
			this._drawBorder(ctx, bars, this._data.visibleRange, this._data.barSpacing, devicePixelRation);
		}

		if (!this._data.borderVisible || this._data.barSpacing > 2 * Constants.BarBorderWidth) {
			this._drawCandles(ctx, bars, this._data.visibleRange, devicePixelRation);
		}

	}

	private _drawWicks(ctx: CanvasRenderingContext2D, bars: ReadonlyArray<CandlestickItem>, visibleRange: SeriesItemsIndexesRange, devicePixelRation: number): void {
		let prevWickColor = '';

		for (let i = visibleRange.from; i < visibleRange.to; i++) {
			const bar = bars[i];
			if (bar.wickColor !== prevWickColor) {
				ctx.fillStyle = bar.wickColor;
				prevWickColor = bar.wickColor;
			}

			const top = Math.floor(Math.min(bar.openY, bar.closeY) * devicePixelRation);
			const bottom = Math.ceil(Math.max(bar.openY, bar.closeY) * devicePixelRation);

			const high = Math.ceil(bar.highY * devicePixelRation);
			const low = Math.floor(bar.lowY * devicePixelRation);

			const scaledX = Math.round(devicePixelRation * bar.x);

			ctx.fillRect(scaledX, high, 1, top - high);
			ctx.fillRect(scaledX, bottom + 1, 1, low - bottom);
		}
	}

	private _drawBorder(ctx: CanvasRenderingContext2D, bars: ReadonlyArray<CandlestickItem>, visibleRange: SeriesItemsIndexesRange, barSpacing: number, devicePixelRation: number): void {
		let prevBorderColor = '';

		for (let i = visibleRange.from; i < visibleRange.to; i++) {
			const bar = bars[i];
			if (bar.borderColor !== prevBorderColor) {
				ctx.fillStyle = bar.borderColor;
				prevBorderColor = bar.borderColor;
			}

			const left = Math.round((bar.x - this._barWidth) * devicePixelRation);
			const right = Math.round((bar.x + this._barWidth) * devicePixelRation);

			const top = Math.floor(Math.min(bar.openY, bar.closeY) * devicePixelRation);
			const bottom = Math.ceil(Math.max(bar.openY, bar.closeY) * devicePixelRation);

			if (barSpacing > 2 * Constants.BarBorderWidth) {
				strokeRectInnerWithFill(ctx, left, top, right - left + 1, bottom - top + 1, Constants.BarBorderWidth);
			} else {
				ctx.fillRect(left, top, right - left + 1, bottom - top + 1);
			}
		}
	}

	private _drawCandles(ctx: CanvasRenderingContext2D, bars: ReadonlyArray<CandlestickItem>, visibleRange: SeriesItemsIndexesRange, devicePixelRation: number): void {
		if (this._data === null) {
			return;
		}

		let prevBarColor = '';

		for (let i = visibleRange.from; i < visibleRange.to; i++) {
			const bar = bars[i];
			let top = Math.floor(Math.min(bar.openY, bar.closeY) * devicePixelRation);
			let bottom = Math.ceil(Math.max(bar.openY, bar.closeY) * devicePixelRation);

			let left = Math.round((bar.x - this._barWidth) * devicePixelRation);
			let right = Math.round((bar.x + this._barWidth) * devicePixelRation);

			if (this._data.borderVisible) {
				left += 1;
				top += 1;
				right -= 1;
				bottom -= 1;
			}

			if (top > bottom) {
				continue;
			}

			if (bar.color !== prevBarColor) {
				const barColor = bar.color;
				ctx.fillStyle = barColor;
				prevBarColor = barColor;
			}

			ctx.fillRect(left, top, right - left + 1, bottom - top + 1);
		}
	}
}
