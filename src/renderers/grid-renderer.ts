import { PriceMark } from '../model/price-scale';

import { LineStyle, setLineStyle } from './draw-line';
import { IPaneRenderer } from './ipane-renderer';

export interface GridMarks {
	coord: number;
}
export interface GridRendererData {
	vertLinesVisible: boolean;
	vertLinesColor: string;
	vertLineStyle: LineStyle;
	timeMarks: GridMarks[];

	horzLinesVisible: boolean;
	horzLinesColor: string;
	horzLineStyle: LineStyle;
	priceMarks: PriceMark[];

	h: number;
	w: number;
}

export class GridRenderer implements IPaneRenderer {
	private _data: GridRendererData | null = null;

	public setData(data: GridRendererData | null): void {
		this._data = data;
	}

	public draw(ctx: CanvasRenderingContext2D): void {
		if (this._data === null) {
			return;
		}

		ctx.lineWidth = 1;

		if (this._data.vertLinesVisible) {
			ctx.strokeStyle = this._data.vertLinesColor;
			setLineStyle(ctx, this._data.vertLineStyle);
			ctx.beginPath();
			for (const timeMark of this._data.timeMarks) {
				ctx.moveTo(timeMark.coord + 1, 0);
				ctx.lineTo(timeMark.coord + 1, this._data.h);
			}

			ctx.stroke();
		}

		if (this._data.horzLinesVisible) {
			ctx.strokeStyle = this._data.horzLinesColor;
			setLineStyle(ctx, this._data.horzLineStyle);
			ctx.beginPath();
			for (const priceMark of this._data.priceMarks) {
				ctx.moveTo(0, priceMark.coord);
				ctx.lineTo(this._data.w, priceMark.coord);
			}

			ctx.stroke();
		}
	}
}
