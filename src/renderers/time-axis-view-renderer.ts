import { BitmapCoordinatesRenderingScope, CanvasRenderingTarget2D, MediaCoordinatesRenderingScope } from 'fancy-canvas';

import { ensureNotNull } from '../helpers/assertions';

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

	public draw(target: CanvasRenderingTarget2D, rendererOptions: TimeAxisViewRendererOptions): void {
		if (this._data === null || this._data.visible === false || this._data.text.length === 0) {
			return;
		}

		const textWidth = target.useMediaCoordinateSpace(({ context: ctx }: MediaCoordinatesRenderingScope) => {
			ctx.font = rendererOptions.font;
			return Math.round(rendererOptions.widthCache.measureText(ctx, ensureNotNull(this._data).text, optimizationReplacementRe));
		});
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

		const y1 = 0;
		const y2 = Math.ceil(
			y1 +
			rendererOptions.borderSize +
			rendererOptions.tickLength +
			rendererOptions.paddingTop +
			rendererOptions.fontSize +
			rendererOptions.paddingBottom
		);

		target.useBitmapCoordinateSpace(({ context: ctx, horizontalPixelRatio, verticalPixelRatio }: BitmapCoordinatesRenderingScope) => {
			const data = ensureNotNull(this._data);

			ctx.fillStyle = data.background;

			const x1scaled = Math.round(x1 * horizontalPixelRatio);
			const y1scaled = Math.round(y1 * verticalPixelRatio);
			const x2scaled = Math.round(x2 * horizontalPixelRatio);
			const y2scaled = Math.round(y2 * verticalPixelRatio);
			const radiusScaled = Math.round(radius * horizontalPixelRatio);
			ctx.beginPath();
			ctx.moveTo(x1scaled, y1scaled);
			ctx.lineTo(x1scaled, y2scaled - radiusScaled);
			ctx.arcTo(x1scaled, y2scaled, x1scaled + radiusScaled, y2scaled, radiusScaled);
			ctx.lineTo(x2scaled - radiusScaled, y2scaled);
			ctx.arcTo(x2scaled, y2scaled, x2scaled, y2scaled - radiusScaled, radiusScaled);
			ctx.lineTo(x2scaled, y1scaled);
			ctx.fill();

			if (data.tickVisible) {
				const tickX = Math.round(data.coordinate * horizontalPixelRatio);
				const tickTop = y1scaled;
				const tickBottom = Math.round((tickTop + rendererOptions.tickLength) * verticalPixelRatio);

				ctx.fillStyle = data.color;
				const tickWidth = Math.max(1, Math.floor(horizontalPixelRatio));
				const tickOffset = Math.floor(horizontalPixelRatio * 0.5);
				ctx.fillRect(tickX - tickOffset, tickTop, tickWidth, tickBottom - tickTop);
			}
		});

		target.useMediaCoordinateSpace(({ context: ctx }: MediaCoordinatesRenderingScope) => {
			const data = ensureNotNull(this._data);

			const yText =
				y1 +
				rendererOptions.borderSize +
				rendererOptions.tickLength +
				rendererOptions.paddingTop +
				rendererOptions.fontSize / 2;

			ctx.font = rendererOptions.font;
			ctx.textAlign = 'left';
			ctx.textBaseline = 'middle';
			ctx.fillStyle = data.color;

			const textYCorrection = rendererOptions.widthCache.yMidCorrection(ctx, 'Apr0');

			ctx.translate(x1 + horzMargin, yText + textYCorrection);
			ctx.fillText(data.text, 0, 0);
		});
	}
}
