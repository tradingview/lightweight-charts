import { drawHorizontalLine, drawVerticalLine } from '../helpers/canvas-helpers';

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

		// TODO: remove this after removing global translate
		ctx.translate(-0.5, -0.5);

		ctx.lineWidth = 1;

		if (this._data.vertLinesVisible) {
			ctx.strokeStyle = this._data.vertLinesColor;
			setLineStyle(ctx, this._data.vertLineStyle);
			for (const timeMark of this._data.timeMarks) {
				drawVerticalLine(ctx, timeMark.coord, 0, this._data.h, 1);
			}
		}

		if (this._data.horzLinesVisible) {
			ctx.strokeStyle = this._data.horzLinesColor;
			setLineStyle(ctx, this._data.horzLineStyle);
			for (const priceMark of this._data.priceMarks) {
				drawHorizontalLine(ctx, priceMark.coord, 0, this._data.w, 1);
			}
		}

		// TODO: remove this after removing global translate
		ctx.translate(0.5, 0.5);
	}
}
