import { drawLine, LineStyle, LineWidth } from './draw-line';
import { IPaneRenderer } from './ipane-renderer';

export interface CrosshairLineStyle {
	lineStyle: LineStyle;
	lineWidth: LineWidth;
	color: string;
	visible: boolean;
}

export interface CrosshairRendererData {
	vertLine: CrosshairLineStyle;
	horzLine: CrosshairLineStyle;
	x: number;
	y: number;
	w: number;
	h: number;
}

export class CrosshairRenderer implements IPaneRenderer {
	private readonly _data: CrosshairRendererData | null;

	public constructor(data: CrosshairRendererData | null) {
		this._data = data;
	}

	public draw(ctx: CanvasRenderingContext2D, pixelRatio: number, isHovered: boolean, hitTestData?: unknown): void {
		if (this._data === null) {
			return;
		}

		const vertLinesVisible = this._data.vertLine.visible;
		const horzLinesVisible = this._data.horzLine.visible;

		if (!vertLinesVisible && !horzLinesVisible) {
			return;
		}

		ctx.save();
		ctx.translate(0.5, 0.5);

		const x = Math.round(this._data.x * pixelRatio);
		const y = Math.round(this._data.y * pixelRatio);
		const w = Math.ceil(this._data.w * pixelRatio);
		const h = Math.ceil(this._data.h * pixelRatio);

		if (vertLinesVisible && x >= 0) {
			ctx.lineWidth = this._data.vertLine.lineWidth;
			ctx.strokeStyle = this._data.vertLine.color;
			ctx.fillStyle = this._data.vertLine.color;
			drawLine(ctx, x, -0.5, x, h, this._data.vertLine.lineStyle);
		}

		if (horzLinesVisible && y >= 0) {
			ctx.lineWidth = this._data.horzLine.lineWidth;
			ctx.strokeStyle = this._data.horzLine.color;
			ctx.fillStyle = this._data.horzLine.color;
			drawLine(ctx, -0.5, y, w, y, this._data.horzLine.lineStyle);
		}

		ctx.restore();
	}
}
