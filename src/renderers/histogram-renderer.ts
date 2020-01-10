import { Coordinate } from '../model/coordinate';
import { PricedValue } from '../model/price-scale';
import { SeriesItemsIndexesRange, TimedValue } from '../model/time-data';

import { IPaneRenderer } from './ipane-renderer';

export interface HistogramItem extends PricedValue, TimedValue {
	left?: Coordinate;
	right?: Coordinate;
}

export interface PaneRendererHistogramData {
	items: HistogramItem[];

	barSpacing: number;
	histogramBase: number;
	color: string;

	visibleRange: SeriesItemsIndexesRange | null;
}

export class PaneRendererHistogram implements IPaneRenderer {
	private _data: PaneRendererHistogramData | null = null;

	public setData(data: PaneRendererHistogramData): void {
		this._data = data;
	}

	public draw(ctx: CanvasRenderingContext2D, pixelRatio: number, isHovered: boolean, hitTestData?: unknown): void {
		if (this._data === null || this._data.items.length === 0 || this._data.visibleRange === null) {
			return;
		}

		const histogramBase = Math.round(this._data.histogramBase * pixelRatio);

		ctx.fillStyle = this._data.color;
		ctx.beginPath();

		for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; i++) {
			const item = this._data.items[i];
			// force cast to avoid ensureDefined call
			const y = Math.round(item.y as number * pixelRatio);
			const left = Math.floor((item.left as number) * pixelRatio);
			const right = Math.ceil((item.right as number) * pixelRatio);
			ctx.rect(left, y, right - left, histogramBase - y);
		}

		ctx.fill();
	}
}
