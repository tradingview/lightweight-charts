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

	public draw(ctx: CanvasRenderingContext2D, devicePixelRation: number, isHovered: boolean, hitTestData?: unknown): void {
		if (this._data === null || this._data.bars.length === 0 || this._data.visibleRange === null) {
			return;
		}

		let prevColor: string | null = null;

		for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; ++i) {
			const bar = this._data.bars[i];
			if (prevColor !== bar.color) {
				ctx.fillStyle = bar.color;
				prevColor = bar.color;
			}

			const bodyLeft = Math.round((bar.x - this._barLineWidth / 2) * devicePixelRation);
			const bodyWidth = Math.round(this._barLineWidth * devicePixelRation);
			const bodyWidthHalf = Math.round(this._barLineWidth * devicePixelRation * 0.5);

			ctx.fillRect(
				bodyLeft,
				Math.round(bar.highY * devicePixelRation),
				bodyWidth,
				Math.round((bar.lowY - bar.highY) * devicePixelRation)
			);

			if (this._barLineWidth < (this._data.barSpacing - 1)) {
				if (this._data.openVisible) {
					const openLeft = Math.round(bodyLeft - this._barLineWidth);
					ctx.fillRect(
						openLeft,
						Math.round(bar.openY * devicePixelRation) - bodyWidthHalf,
						bodyLeft - openLeft,
						bodyWidthHalf * 2
					);
				}

				const closeLeft = bodyLeft + bodyWidth;

				ctx.fillRect(
					closeLeft,
					Math.round(bar.closeY * devicePixelRation) - bodyWidthHalf,
					bodyWidth,
					bodyWidthHalf * 2
				);
			}
		}
	}
}
