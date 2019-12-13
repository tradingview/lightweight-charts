import { BarCoordinates, BarPrices } from '../model/bar';
import { SeriesItemsIndexesRange, TimedValue } from '../model/time-data';

import { optimalBarWidth } from './optimal-bar-width';
import { ScaledRenderer } from './scaled-renderer';

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

export class PaneRendererBars extends ScaledRenderer {
	private _data: PaneRendererBarsData | null = null;
	private _barWidth: number = 0;
	private _barLineWidth: number = 0;

	public setData(data: PaneRendererBarsData): void {
		this._data = data;
		this._barWidth = optimalBarWidth(data.barSpacing);
		this._barLineWidth = data.thinBars ? 1 : Math.max(1, Math.round(this._barWidth));
	}

	protected _drawImpl(ctx: CanvasRenderingContext2D): void {
		if (this._data === null || this._data.bars.length === 0 || this._data.visibleRange === null) {
			return;
		}

		ctx.translate(0.5, 0.5);

		const offset = this._data.thinBars ? 1 : Math.round(this._barWidth);
		const negativeOffset = this._data.thinBars ? 1 : offset / 2;

		let prevColor: string | null = null;

		for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; ++i) {
			const bar = this._data.bars[i];
			if (prevColor !== bar.color) {
				ctx.fillStyle = bar.color;
				prevColor = bar.color;
			}

			ctx.fillRect(
				Math.round(bar.x - this._barLineWidth / 2),
				Math.round(bar.highY - negativeOffset),
				Math.round(this._barLineWidth),
				Math.round(bar.lowY - bar.highY + offset)
			);

			if (this._barLineWidth < (this._data.barSpacing - 1)) {
				if (this._data.openVisible) {
					ctx.fillRect(
						Math.round(bar.x - this._barWidth * 1.5),
						Math.floor(bar.openY - negativeOffset),
						Math.round(this._barWidth * 1.5),
						offset
					);
				}

				ctx.fillRect(
					Math.round(bar.x),
					Math.floor(bar.closeY - negativeOffset),
					Math.round(this._barWidth * 1.5),
					offset
				);
			}
		}
	}
}
