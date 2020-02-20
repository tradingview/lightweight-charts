import { BarCoordinates, BarPrices } from '../model/bar';
import { SeriesItemsIndexesRange, TimedValue } from '../model/time-data';

import { IPaneRenderer } from './ipane-renderer';
import { optimalBarWidth } from './optimal-bar-width';

export type BarCandlestickItemBase = TimedValue & BarPrices & BarCoordinates;

export interface BarItem extends BarCandlestickItemBase {
	color: string;
}

export interface PaneRendererBarsData {
	bars: ReadonlyArray<BarItem>;
	barSpacing: number;
	openVisible: boolean;
	thinBars: boolean;

	visibleRange: SeriesItemsIndexesRange | null;
}

export class PaneRendererBars implements IPaneRenderer {
	private _data: PaneRendererBarsData | null = null;
	private _barWidth: number = 0;
	private _barLineWidth: number = 0;

	public setData(data: PaneRendererBarsData): void {
		this._data = data;
	}

	public draw(ctx: CanvasRenderingContext2D, pixelRatio: number, isHovered: boolean, hitTestData?: unknown): void {
		if (this._data === null || this._data.bars.length === 0 || this._data.visibleRange === null) {
			return;
		}

		this._barWidth = Math.max(1, Math.floor(optimalBarWidth(this._data.barSpacing, pixelRatio)));

		// grid and crosshair have line width = Math.floor(pixelRatio)
		// if this value is odd, we have to make bars' width odd
		// if this value is even, we have to make bars' width even
		// in order of keeping crosshair-over-bar drawing symmetric
		if (this._barWidth >= 2) {
			const lineWidth = Math.floor(pixelRatio);
			if ((lineWidth % 2) !== (this._barWidth % 2)) {
				this._barWidth--;
			}
		}

		// if scale is compressed, bar could become less than 1 CSS pixel
		this._barLineWidth = this._data.thinBars ? Math.min(this._barWidth, Math.floor(pixelRatio)) : this._barWidth;
		let prevColor: string | null = null;

		for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; ++i) {
			const bar = this._data.bars[i];
			if (prevColor !== bar.color) {
				ctx.fillStyle = bar.color;
				prevColor = bar.color;
			}

			const bodyWidthHalf = Math.floor(this._barLineWidth * 0.5);

			const bodyCenter = Math.round(bar.x * pixelRatio);
			const bodyLeft =  bodyCenter - bodyWidthHalf;
			const bodyWidth = this._barLineWidth;
			const bodyRight = bodyLeft + bodyWidth - 1;

			const bodyTop = Math.round(bar.highY * pixelRatio) - bodyWidthHalf;

			const bodyBottom = Math.round(bar.lowY * pixelRatio) + bodyWidthHalf;

			const bodyHeight = Math.max((bodyBottom - bodyTop), this._barLineWidth);

			ctx.fillRect(
				bodyLeft,
				bodyTop,
				bodyWidth,
				bodyHeight
			);

			const sideWidth = Math.ceil(this._barWidth * 1.5);

			if (this._barLineWidth <= this._barWidth) {
				if (this._data.openVisible) {
					const openLeft = bodyCenter - sideWidth;
					let openTop = Math.max(bodyTop, Math.round(bar.openY * pixelRatio) - bodyWidthHalf);
					let openBottom = openTop + bodyWidth - 1;
					if (openBottom > bodyTop + bodyHeight - 1) {
						openBottom = bodyTop + bodyHeight - 1;
						openTop = openBottom - bodyWidth + 1;
					}
					ctx.fillRect(
						openLeft,
						openTop,
						bodyLeft - openLeft,
						openBottom - openTop + 1
					);
				}

				const closeRight = bodyCenter + sideWidth;
				let closeTop = Math.max(bodyTop, Math.round(bar.closeY * pixelRatio) - bodyWidthHalf);
				let closeBottom = closeTop + bodyWidth - 1;
				if (closeBottom > bodyTop + bodyHeight - 1) {
					closeBottom = bodyTop + bodyHeight - 1;
					closeTop = closeBottom - bodyWidth + 1;
				}

				ctx.fillRect(
					bodyRight + 1,
					closeTop,
					closeRight - bodyRight,
					closeBottom - closeTop + 1
				);
			}
		}
	}
}
