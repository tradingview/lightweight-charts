import { PriceMark } from '../model/price-scale';

import { LineStyle, LineWidth, setLineStyle } from './draw-line';
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

// TODO: move to canvas-helpers
// tslint:disable-next-line: max-params
function drawVerticalLine(ctx: CanvasRenderingContext2D, x: number, top: number, bottom: number, lineWidth: LineWidth, color: string, style: LineStyle): void {
	const compensation = lineWidth * 0.5;
	ctx.translate(-compensation, 0);
	ctx.lineCap = 'butt';
	ctx.strokeStyle = color;
	setLineStyle(ctx, style);
	ctx.moveTo(x, top);
	ctx.lineTo(x, bottom);
	ctx.stroke();
	ctx.translate(compensation, 0);
}

// tslint:disable-next-line: max-params
function drawHorizontalLine(ctx: CanvasRenderingContext2D, y: number, left: number, right: number, lineWidth: LineWidth, color: string, style: LineStyle): void {
	const compensation = lineWidth * 0.5;
	ctx.translate(0, -compensation);
	ctx.lineCap = 'butt';
	ctx.strokeStyle = color;
	setLineStyle(ctx, style);
	ctx.moveTo(left, y);
	ctx.lineTo(right, y);
	ctx.stroke();
	ctx.translate(0, compensation);
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
			for (const timeMark of this._data.timeMarks) {
				drawVerticalLine(ctx, timeMark.coord, 0, this._data.h, 1, this._data.vertLinesColor, this._data.vertLineStyle);
			}
		}

		if (this._data.horzLinesVisible) {
			for (const priceMark of this._data.priceMarks) {
				drawHorizontalLine(ctx, priceMark.coord, 0, this._data.w, 1, this._data.vertLinesColor, this._data.vertLineStyle);
			}
		}

		// TODO: remove this after removing global translate
		ctx.translate(0.5, 0.5);
	}
}
