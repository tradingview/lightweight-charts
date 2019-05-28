import { ITimeAxisViewRenderer, TimeAxisViewRendererOptions } from './itime-axis-view-renderer';

export interface TimeAxisViewRendererData {
	width: number;
	text: string;
	coordinate: number;
	color: string;
	background: string;
	visible: boolean;
}

const optimizationReplacementRe = /[1-9]/g;

export class TimeAxisViewRenderer implements ITimeAxisViewRenderer {
	private _data: TimeAxisViewRendererData | null;

	public constructor() {
		this._data = null;
	}

	public setData(data: TimeAxisViewRendererData): void {
		this._data = data;
	}

	public draw(ctx: CanvasRenderingContext2D, rendererOptions: TimeAxisViewRendererOptions): void {
		if (this._data === null || this._data.visible === false || this._data.text.length === 0) {
			return;
		}

		ctx.font = rendererOptions.font;

		const textWidth = Math.round(rendererOptions.widthCache.measureText(ctx, this._data.text, optimizationReplacementRe));
		if (textWidth <= 0) {
			return;
		}

		const horzMargin = rendererOptions.paddingHorizontal;
		const labelWidth = textWidth + 2 * horzMargin;
		const labelWidthHalf = labelWidth / 2;
		const timeScaleWidth = this._data.width;
		let coordinate = this._data.coordinate;
		let x1 = Math.floor(coordinate - labelWidthHalf) + 0.5;

		if (x1 < 0) {
			coordinate = coordinate + Math.abs(0 - x1);
			x1 = Math.floor(coordinate - labelWidthHalf) + 0.5;
		} else if (x1 + labelWidth > timeScaleWidth) {
			coordinate = coordinate - Math.abs(timeScaleWidth - (x1 + labelWidth));
			x1 = Math.floor(coordinate - labelWidthHalf) + 0.5;
		}

		const x2 = x1 + labelWidth;

		const y1 = -0.5;
		const y2 = (
			y1 +
			rendererOptions.borderSize +
			rendererOptions.paddingTop +
			rendererOptions.fontSize +
			rendererOptions.paddingBottom
		);

		ctx.fillStyle = this._data.background;
		ctx.lineWidth = 1;
		drawRoundRect(ctx, x1, y1, x2 - x1, y2 - y1, 1);
		ctx.fill();

		const tickX = Math.round(this._data.coordinate + 1);
		const tickTop = y1;
		const tickBottom = tickTop + rendererOptions.borderSize + rendererOptions.tickLength;

		ctx.strokeStyle = this._data.color;
		ctx.beginPath();
		ctx.moveTo(tickX, tickTop);
		ctx.lineTo(tickX, tickBottom);
		ctx.stroke();

		const yText = y2 - rendererOptions.baselineOffset - rendererOptions.paddingBottom;
		ctx.textAlign = 'left';
		ctx.fillStyle = this._data.color;

		ctx.fillText(this._data.text, x1 + horzMargin, yText);
	}
}

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rad: number): void {
	ctx.beginPath();
	ctx.moveTo(x + rad, y);
	ctx.lineTo(x + w - rad, y);
	ctx.arcTo(x + w, y, x + w, y + rad, rad);
	ctx.lineTo(x + w, y + h - rad);
	ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
	ctx.lineTo(x + rad, y + h);
	ctx.arcTo(x, y + h, x, y + h - rad, rad);
	ctx.lineTo(x, y + rad);
	ctx.arcTo(x, y, x + rad, y, rad);
}
