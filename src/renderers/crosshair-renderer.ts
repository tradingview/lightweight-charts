import { drawHorizontalLine, drawVerticalLine } from '../helpers/canvas-helpers';

import { LineStyle, LineWidth, setLineStyle } from './draw-line';
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

	public draw(ctx: CanvasRenderingContext2D): void {
		if (this._data === null) {
			return;
		}

		const vertLinesVisible = this._data.vertLine.visible;
		const horzLinesVisible = this._data.horzLine.visible;

		if (!vertLinesVisible && !horzLinesVisible) {
			return;
		}

		// TODO: remove this after removing global translate
		ctx.translate(-0.5, -0.5);

		const vertFix = this._data.vertLine.lineWidth % 2 === 0 ? 0.5 : 0;
		const horzFix = this._data.horzLine.lineWidth % 2 === 0 ? 0.5 : 0;

		const x = this._data.x + horzFix;
		const y = this._data.y + vertFix;
		const w = this._data.w;
		const h = this._data.h;

		if (vertLinesVisible && x >= 0) {
			ctx.strokeStyle = this._data.vertLine.color;
			setLineStyle(ctx, this._data.vertLine.lineStyle);
			drawVerticalLine(ctx, x, 0, h, this._data.vertLine.lineWidth);
		}

		if (horzLinesVisible && y >= 0) {
			setLineStyle(ctx, this._data.horzLine.lineStyle);
			ctx.strokeStyle = this._data.horzLine.color;
			drawHorizontalLine(ctx, y, 0, w, this._data.horzLine.lineWidth);
		}

		// TODO: remove this after removing global translate
		ctx.translate(0.5, 0.5);
	}
}
