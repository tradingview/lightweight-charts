import { drawScaled } from '../helpers/canvas-helpers';
import { resetTransparency } from '../helpers/color';

import { TextWidthCache } from '../model/text-width-cache';

import {
	IPriceAxisViewRenderer,
	PriceAxisViewRendererCommonData,
	PriceAxisViewRendererData,
	PriceAxisViewRendererOptions,
} from './iprice-axis-view-renderer';

export class PriceAxisViewRenderer implements IPriceAxisViewRenderer {
	private _data!: PriceAxisViewRendererData;
	private _commonData!: PriceAxisViewRendererCommonData;

	public constructor(data: PriceAxisViewRendererData, commonData: PriceAxisViewRendererCommonData) {
		this.setData(data, commonData);
	}

	public setData(data: PriceAxisViewRendererData, commonData: PriceAxisViewRendererCommonData): void {
		this._data = data;
		this._commonData = commonData;
	}

	public draw(
		ctx: CanvasRenderingContext2D,
		rendererOptions: PriceAxisViewRendererOptions,
		textWidthCache: TextWidthCache,
		width: number,
		align: 'left' | 'right',
		pixelRatio: number
	): void {
		if (!this._data.visible) {
			return;
		}

		const fontSize = rendererOptions.fontSize;
		ctx.font = rendererOptions.font;

		const tickSize = this._data.tickVisible ? rendererOptions.tickLength : 0;
		const horzBorder = this._data.borderVisible ? rendererOptions.borderSize : 0;
		const paddingTop = rendererOptions.paddingTop;
		const paddingBottom = rendererOptions.paddingBottom;
		const paddingInner = rendererOptions.paddingInner;
		const paddingOuter = rendererOptions.paddingOuter;
		const text = this._data.text;
		const textWidth = Math.ceil(textWidthCache.measureText(ctx, text));
		const baselineOffset = rendererOptions.baselineOffset;
		const totalHeight = rendererOptions.fontSize + paddingTop + paddingBottom;
		const totalWidth = horzBorder + textWidth + paddingInner + paddingOuter + tickSize;

		let yMid = this._commonData.coordinate;
		if (this._commonData.fixedCoordinate) {
			yMid = this._commonData.fixedCoordinate;
		}

		const yTop = yMid - Math.floor(fontSize / 2) - paddingTop - 0.5;
		const yBottom = yTop + totalHeight;

		const alignRight = align === 'right';

		const xInside = alignRight ? width : 0;
		const rightScaled = Math.round(width * pixelRatio);

		let xOutside = xInside;
		let xTick: number;
		let xText: number;

		ctx.fillStyle = resetTransparency(this._commonData.background);
		ctx.lineWidth = 1;
		ctx.lineCap = 'butt';

		if (text) {
			if (alignRight) {
				// 2               1
				//
				//              6  5
				//
				// 3               4
				xOutside = xInside - totalWidth;
				xTick = xInside - tickSize;
				xText = xOutside + paddingOuter;
			} else {
				// 1               2
				//
				// 6  5
				//
				// 4               3
				xOutside = xInside + totalWidth;
				xTick = xInside + tickSize;
				xText = xInside + horzBorder + tickSize + paddingInner;
			}

			const offsetScaled = Math.floor(this._data.offset * pixelRatio);
			const xInsideScaled = alignRight ? rightScaled - offsetScaled : offsetScaled;
			const yTopScaled = Math.round(yTop * pixelRatio);
			const xOutsideScaled = Math.round(xOutside * pixelRatio);
			const yBottomScaled = Math.round(yBottom * pixelRatio);
			const yMidScaled = Math.round(yMid * pixelRatio) - Math.floor(pixelRatio * 0.5);
			const xTickScaled = Math.round(xTick * pixelRatio);

			ctx.save();
/*			if (alignRight) {
				ctx.translate(-offsetScaled, 0);
			} else {
				ctx.translate(offsetScaled, 0);
			}*/

			ctx.beginPath();
			ctx.moveTo(xInsideScaled, yTopScaled);
			ctx.lineTo(xOutsideScaled, yTopScaled);
			ctx.lineTo(xOutsideScaled, yBottomScaled);
			ctx.lineTo(xInsideScaled, yBottomScaled);
			ctx.fill();

			if (this._data.tickVisible) {
				ctx.fillStyle = this._commonData.color;
				const tickWidth = Math.max(1, Math.floor(pixelRatio));
				ctx.fillRect(xInsideScaled, yMidScaled, xTickScaled - xInsideScaled, tickWidth);
			}

			ctx.textAlign = 'left';
			ctx.fillStyle = this._commonData.color;

			drawScaled(ctx, pixelRatio, () => {
				ctx.fillText(text, xText, yBottom - paddingBottom - baselineOffset);
			});
			ctx.restore();
		}
	}

	public height(rendererOptions: PriceAxisViewRendererOptions, useSecondLine: boolean): number {
		if (!this._data.visible) {
			return 0;
		}

		return rendererOptions.fontSize + rendererOptions.paddingTop + rendererOptions.paddingBottom;
	}
}
