import { ensureNotNull } from '../helpers/assertions';
import { drawScaled } from '../helpers/canvas-helpers';

import { ITimeAxisViewRenderer, TimeAxisViewRendererOptions } from './itime-axis-view-renderer';

export interface TimeAxisViewRendererData {
	width: number;
	text: string;
	coordinate: number;
	color: string;
	background: string;
	visible: boolean;
	tickVisible: boolean;
}

const optimizationReplacementRe = /[1-9]/g;

const radius = 2;

export class TimeAxisViewRenderer implements ITimeAxisViewRenderer {
	private _data: TimeAxisViewRendererData | null;

	public constructor() {
		this._data = null;
	}

	public setData(data: TimeAxisViewRendererData): void {
		this._data = data;
	}

	public draw(ctx: CanvasRenderingContext2D, rendererOptions: TimeAxisViewRendererOptions, pixelRatio: number): void {
		if (this._data === null || this._data.visible === false || this._data.text.length === 0) {
			return;
		}

		ctx.font = rendererOptions.font;

		const textWidth = Math.round(rendererOptions.widthCache.measureText(ctx, this._data.text, optimizationReplacementRe));
		if (textWidth <= 0) {
			return;
		}

		ctx.save();

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

		const y1 = 0;
		const y2 = Math.ceil(
			y1 +
			rendererOptions.borderSize +
			rendererOptions.tickLength +
			rendererOptions.paddingTop +
			rendererOptions.fontSize +
			rendererOptions.paddingBottom
		);

		ctx.fillStyle = this._data.background;

		const x1scaled = Math.round(x1 * pixelRatio);
		const y1scaled = Math.round(y1 * pixelRatio);
		const x2scaled = Math.round(x2 * pixelRatio);
		const y2scaled = Math.round(y2 * pixelRatio);
		const radiusScaled = Math.round(radius * pixelRatio);
		ctx.beginPath();
		ctx.moveTo(x1scaled, y1scaled);
		ctx.lineTo(x1scaled, y2scaled - radiusScaled);
		ctx.arcTo(x1scaled, y2scaled, x1scaled + radiusScaled, y2scaled, radiusScaled);
		ctx.lineTo(x2scaled - radiusScaled, y2scaled);
		ctx.arcTo(x2scaled, y2scaled, x2scaled, y2scaled - radiusScaled, radiusScaled);
		ctx.lineTo(x2scaled, y1scaled);
		ctx.fill();

		if (this._data.tickVisible) {
			const tickX = Math.round(this._data.coordinate * pixelRatio);
			const tickTop = y1scaled;
			const tickBottom = Math.round((tickTop + rendererOptions.tickLength) * pixelRatio);

			ctx.fillStyle = this._data.color;
			const tickWidth = Math.max(1, Math.floor(pixelRatio));
			const tickOffset = Math.floor(pixelRatio * 0.5);
			ctx.fillRect(tickX - tickOffset, tickTop, tickWidth, tickBottom - tickTop);
		}

		const yText =
			y1 +
			rendererOptions.borderSize +
			rendererOptions.tickLength +
			rendererOptions.paddingTop +
			rendererOptions.fontSize / 2;

		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = this._data.color;

		const textYCorrection = rendererOptions.widthCache.yMidCorrection(ctx, 'Apr0');

		ctx.translate((x1 + horzMargin) * pixelRatio, (yText + textYCorrection) * pixelRatio);
		drawScaled(ctx, pixelRatio, () => ctx.fillText(ensureNotNull(this._data).text, 0, 0));

		ctx.restore();
	}
}
