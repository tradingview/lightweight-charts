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
		align: 'left' | 'right'
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

		const xInside = alignRight ? width - horzBorder - 0.5 : 0.5;

		let xOutside = xInside;
		let xTick;
		let xText;

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

			ctx.beginPath();
			ctx.moveTo(xInside, yTop);
			ctx.lineTo(xOutside, yTop);
			ctx.lineTo(xOutside, yBottom);
			ctx.lineTo(xInside, yBottom);
			ctx.fill();

			if (this._data.tickVisible) {
				ctx.beginPath();
				ctx.strokeStyle = this._commonData.color;
				ctx.moveTo(xInside, yMid);
				ctx.lineTo(xTick, yMid);
				ctx.stroke();
			}

			ctx.textAlign = 'left';
			ctx.fillStyle = this._commonData.color;

			ctx.fillText(text, xText, yBottom - paddingBottom - baselineOffset);
		}
	}

	public height(rendererOptions: PriceAxisViewRendererOptions, useSecondLine: boolean): number {
		if (!this._data.visible) {
			return 0;
		}

		return rendererOptions.fontSize + rendererOptions.paddingTop + rendererOptions.paddingBottom;
	}
}
