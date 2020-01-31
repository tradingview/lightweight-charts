import { PricedValue } from '../model/price-scale';
import { SeriesItemsIndexesRange, TimedValue } from '../model/time-data';

import { IPaneRenderer } from './ipane-renderer';

const showSpacingMinimalBarWidth = 3;

export interface HistogramItem extends PricedValue, TimedValue {
	color: string;
}

export interface PaneRendererHistogramData {
	items: HistogramItem[];

	barSpacing: number;
	histogramBase: number;

	visibleRange: SeriesItemsIndexesRange | null;
}

interface PrecalculatedItemCoordinates {
	left: number;
	right: number;
	roundedCenter: number;
	center: number;
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
		const spacing = Math.ceil(this._data.barSpacing * pixelRatio) <= showSpacingMinimalBarWidth ? 0 : Math.max(1, Math.floor(pixelRatio));

		const columnWidth = Math.round(this._data.barSpacing * pixelRatio) - spacing;

		const precalculated: PrecalculatedItemCoordinates[] = new Array(this._data.visibleRange.to - this._data.visibleRange.from);

		for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; i++) {
			const item = this._data.items[i];
			// force cast to avoid ensureDefined call
			const x = Math.round(item.x as number * pixelRatio);
			let left: number;
			let right: number;

			if (columnWidth % 2) {
				const halfWidth = (columnWidth - 1) / 2;
				left = x - halfWidth;
				right = x + halfWidth;
			} else {
				// shift pixel to left
				const halfWidth = columnWidth  / 2;
				left = x - halfWidth;
				right = x + halfWidth - 1;
			}
			precalculated[i - this._data.visibleRange.from] = {
				left,
				right,
				roundedCenter: x,
				center: (item.x as number * pixelRatio),
			};
		}

		// correct positions
		for (let i = this._data.visibleRange.from + 1; i < this._data.visibleRange.to; i++) {
			const current = precalculated[i - this._data.visibleRange.from];
			const prev = precalculated[i - this._data.visibleRange.from - 1];
			if (current.left - prev.right !== (spacing + 1)) {
				// have to align
				if (prev.roundedCenter > prev.center) {
					// prev wasshifted to left, so add pixel to right
					prev.right = current.left - spacing - 1;
				} else {
					// extend current to left
					current.left = prev.right + spacing + 1;
				}
			}
		}

		const lineWidth = Math.floor(pixelRatio);

		for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; i++) {
			const item = this._data.items[i];
			const current = precalculated[i - this._data.visibleRange.from];
			const y = Math.round(item.y as number * pixelRatio);
			ctx.fillStyle = item.color;
			ctx.fillRect(current.left, y, current.right - current.left + 1, histogramBase - y + lineWidth);
		}
	}
}
