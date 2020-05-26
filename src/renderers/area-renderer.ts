import { Coordinate } from '../model/coordinate';
import { SeriesItemsIndexesRange } from '../model/time-data';

import { LineStyle, LineType, LineWidth, setLineStyle } from './draw-line';
import { LineItem } from './line-renderer';
import { ScaledRenderer } from './scaled-renderer';
import { walkLine } from './walk-line';

export interface PaneRendererAreaData {
	items: LineItem[];
	lineType: LineType;
	lineColor: string;
	lineWidth: LineWidth;
	lineStyle: LineStyle;

	topColor: string;
	bottomColor: string;
	bottom: Coordinate;

	visibleRange: SeriesItemsIndexesRange | null;
}

export class PaneRendererArea extends ScaledRenderer {
	protected _data: PaneRendererAreaData | null = null;

	public setData(data: PaneRendererAreaData): void {
		this._data = data;
	}

	protected _drawImpl(ctx: CanvasRenderingContext2D): void {
		if (this._data === null || this._data.items.length === 0 || this._data.visibleRange === null) {
			return;
		}

		ctx.lineCap = 'butt';
		ctx.strokeStyle = this._data.lineColor;
		ctx.lineWidth = this._data.lineWidth;
		setLineStyle(ctx, this._data.lineStyle);

		// walk lines with width=1 to have more accurate gradient's filling
		ctx.lineWidth = 1;

		ctx.beginPath();
		ctx.moveTo(this._data.items[this._data.visibleRange.from].x, this._data.bottom);
		ctx.lineTo(this._data.items[this._data.visibleRange.from].x, this._data.items[this._data.visibleRange.from].y);

		walkLine(ctx, this._data.items, this._data.lineType, this._data.visibleRange);

		if (this._data.visibleRange.to > this._data.visibleRange.from) {
			ctx.lineTo(this._data.items[this._data.visibleRange.to - 1].x, this._data.bottom);
			ctx.lineTo(this._data.items[this._data.visibleRange.from].x, this._data.bottom);
		}

		ctx.closePath();

		const gradient = ctx.createLinearGradient(0, 0, 0, this._data.bottom);
		gradient.addColorStop(0, this._data.topColor);
		gradient.addColorStop(1, this._data.bottomColor);

		ctx.fillStyle = gradient;
		ctx.fill();
	}
}
