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
		this._barWidth = optimalBarWidth(data.barSpacing);
		this._barLineWidth = data.thinBars ? 1 : Math.max(1, Math.round(this._barWidth));
	}

	public draw(ctx: CanvasRenderingContext2D, pixelRatio: number, isHovered: boolean, hitTestData?: unknown): void {
		if (this._data === null || this._data.bars.length === 0 || this._data.visibleRange === null) {
			return;
		}

		ctx.save();

		let prevColor: string | null = null;

		for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; ++i) {
			const bar = this._data.bars[i];
			if (prevColor !== bar.color) {
				ctx.fillStyle = bar.color;
				prevColor = bar.color;
			}

			const bodyLeft = Math.round((bar.x - this._barLineWidth / 2) * pixelRatio);
			const bodyWidth = Math.round(this._barLineWidth * pixelRatio);
			const bodyWidthHalf = Math.round(this._barLineWidth * pixelRatio * 0.5);

			const bodyTop = Math.round(bar.highY * pixelRatio);
			const bodyHeight = Math.round((bar.lowY - bar.highY + 1) * pixelRatio);
			const bodyBottom = bodyTop + bodyHeight - 1;

			ctx.fillRect(
				bodyLeft,
				bodyTop,
				bodyWidth,
				bodyHeight
			);

			if (this._barLineWidth < (this._data.barSpacing - 1)) {
				if (this._data.openVisible) {
					const openLeft = Math.round(bodyLeft - this._barLineWidth);
					const openTop = Math.max(Math.round(bar.openY * pixelRatio) - bodyWidthHalf, bodyTop);
					const openBottom = Math.min(openTop + bodyWidthHalf * 2, bodyBottom);
					ctx.fillRect(
						openLeft,
						openTop,
						bodyLeft - openLeft,
						openBottom - openTop + 1
					);
				}

				const closeLeft = bodyLeft + bodyWidth;
				const closeTop = Math.max(Math.round(bar.closeY * pixelRatio) - bodyWidthHalf, bodyTop);
				const closeBottom = Math.min(closeTop + bodyWidthHalf * 2, bodyBottom);

				ctx.fillRect(
					closeLeft,
					closeTop,
					bodyWidth,
					closeBottom - closeTop + 1
				);
			}
		}
		ctx.restore();
	}
}
