import { drawLine, LineStyle, LineWidth } from './draw-line';
import { IPaneRenderer } from './ipane-renderer';

export interface CrossHairLineStyle {
	lineStyle: LineStyle;
	lineWidth: LineWidth;
	color: string;
	visible: boolean;
}

export interface CrossHairRendererData {
	vertLine: CrossHairLineStyle;
	horzLine: CrossHairLineStyle;
	x: number;
	y: number;
	w: number;
	h: number;
}

export class CrossHairRenderer implements IPaneRenderer {
	private readonly _data: CrossHairRendererData | null;

	public constructor(data: CrossHairRendererData | null) {
		this._data = data;
	}

	public draw(ctx: CanvasRenderingContext2D): void {
		if (this._data === null) {
			return;
		}

		const vertLinesVisible = this._data.vertLine.visible;
		const horzLinesVisible = this._data.horzLine.visible;

		if (!vertLinesVisible && !horzLinesVisible) {
			return;
		}

		const vertFix = this._data.vertLine.lineWidth % 2 === 0 ? 0.5 : 0;
		const horzFix = this._data.horzLine.lineWidth % 2 === 0 ? 0.5 : 0;

		const x = this._data.x + 1 + horzFix;
		const y = this._data.y + vertFix;
		const w = this._data.w;
		const h = this._data.h;

		if (vertLinesVisible && x >= 0) {
			ctx.lineWidth = this._data.vertLine.lineWidth;
			ctx.strokeStyle = this._data.vertLine.color;
			ctx.fillStyle = this._data.vertLine.color;
			drawLine(ctx, x, 0, x, h, this._data.vertLine.lineStyle);
		}

		if (horzLinesVisible && y >= 0) {
			ctx.lineWidth = this._data.horzLine.lineWidth;
			ctx.strokeStyle = this._data.horzLine.color;
			ctx.fillStyle = this._data.horzLine.color;
			drawLine(ctx, 0, y, w, y, this._data.horzLine.lineStyle);
		}
	}
}
