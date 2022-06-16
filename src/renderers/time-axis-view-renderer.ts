import { ensureNotNull } from '../helpers/assertions';

import { CanvasRenderingTarget } from './canvas-rendering-target';
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

export class TimeAxisViewRenderer implements ITimeAxisViewRenderer {
	private _data: TimeAxisViewRendererData | null;

	public constructor() {
		this._data = null;
	}

	public setData(data: TimeAxisViewRendererData): void {
		this._data = data;
	}

	public draw(target: CanvasRenderingTarget, rendererOptions: TimeAxisViewRendererOptions): void {
		if (this._data === null || this._data.visible === false || this._data.text.length === 0) {
			return;
		}

		const ctx = target.context;
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
		const y2 = (
			y1 +
			rendererOptions.borderSize +
			rendererOptions.paddingTop +
			rendererOptions.fontSize +
			rendererOptions.paddingBottom
		);

		ctx.fillStyle = this._data.background;

		const { horizontalPixelRatio, verticalPixelRatio } = target;
		const x1scaled = Math.round(x1 * horizontalPixelRatio);
		const y1scaled = Math.round(y1 * verticalPixelRatio);
		const x2scaled = Math.round(x2 * horizontalPixelRatio);
		const y2scaled = Math.round(y2 * verticalPixelRatio);
		ctx.fillRect(x1scaled, y1scaled, x2scaled - x1scaled, y2scaled - y1scaled);

		if (this._data.tickVisible) {
			const tickX = Math.round(this._data.coordinate * horizontalPixelRatio);
			const tickTop = y1scaled;
			const tickBottom = Math.round((tickTop + rendererOptions.borderSize + rendererOptions.tickLength) * verticalPixelRatio);

			ctx.fillStyle = this._data.color;
			const tickWidth = Math.max(1, Math.floor(horizontalPixelRatio));
			const tickOffset = Math.floor(horizontalPixelRatio * 0.5);
			ctx.fillRect(tickX - tickOffset, tickTop, tickWidth, tickBottom - tickTop);
		}

		target.useCanvasElementCoordinates(({ context }: { context: CanvasRenderingContext2D }) => {
			const data = ensureNotNull(this._data);
			const yText = y2 - rendererOptions.baselineOffset - rendererOptions.paddingBottom;
			context.textAlign = 'left';
			context.fillStyle = data.color;
			context.fillText(data.text, x1 + horzMargin, yText);
		});

		ctx.restore();
	}
}
