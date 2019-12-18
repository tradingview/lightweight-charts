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

	public draw(ctx: CanvasRenderingContext2D, devicePixelRation: number, isHovered: boolean, hitTestData?: unknown): void {
		if (this._data === null) {
			return;
		}

		ctx.lineWidth = 1;

		const height = Math.ceil(this._data.h * devicePixelRation);
		const width = Math.ceil(this._data.w * devicePixelRation);

		ctx.save();
		ctx.translate(0.5, 0.5);

		if (this._data.vertLinesVisible) {
			ctx.strokeStyle = this._data.vertLinesColor;
			setLineStyle(ctx, this._data.vertLineStyle);
			ctx.beginPath();
			for (const timeMark of this._data.timeMarks) {
				const x = Math.round(timeMark.coord * devicePixelRation);
				ctx.moveTo(x, 0);
				ctx.lineTo(x, height);
			}

			ctx.stroke();
		}

		if (this._data.horzLinesVisible) {
			ctx.strokeStyle = this._data.horzLinesColor;
			setLineStyle(ctx, this._data.horzLineStyle);
			ctx.beginPath();
			for (const priceMark of this._data.priceMarks) {
				const y = Math.round(priceMark.coord * devicePixelRation);
				ctx.moveTo(0, y);
				ctx.lineTo(width, y);
			}

			ctx.stroke();
		}

		ctx.restore();
	}
}
