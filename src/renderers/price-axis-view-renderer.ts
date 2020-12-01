import { drawScaled } from '../helpers/canvas-helpers';
import { fontSizeToPixels } from '../helpers/make-font';

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

		ctx.font = rendererOptions.font;

		const tickSize = (this._data.tickVisible || !this._data.moveTextToInvisibleTick) ? rendererOptions.tickLength : 0;
		const horzBorder = rendererOptions.borderSize;
		const paddingTop = rendererOptions.paddingTop;
		const paddingBottom = rendererOptions.paddingBottom;
		const paddingInner = rendererOptions.paddingInner;
		const paddingOuter = rendererOptions.paddingOuter;
		const text = this._data.text;
		const actualTextHeight = fontSizeToPixels(rendererOptions.fontSize);
		const textWidth = Math.ceil(textWidthCache.measureText(ctx, text));
		const correctedTextWidth = Math.max(textWidth, actualTextHeight);
		const baselineOffset = rendererOptions.baselineOffset;
		const totalHeight = actualTextHeight + paddingTop + paddingBottom;
		const halfHeigth = Math.ceil(totalHeight * 0.5);
		const totalWidth = horzBorder + correctedTextWidth + paddingInner + paddingOuter + tickSize;

		const halfHeigthScaled = Math.round(halfHeigth * pixelRatio);
		const totalHeightScaled = Math.round(totalHeight * pixelRatio);
		const totalWidthScaled = Math.round(totalWidth * pixelRatio);
		// tick overlaps scale border
		const tickSizeScaled = Math.round(tickSize * pixelRatio);
		const widthScaled = Math.ceil(width * pixelRatio);
		const horzBorderScaled = Math.max(1, Math.floor(horzBorder * pixelRatio));
		const paddingOuterScaled = Math.ceil(paddingOuter * pixelRatio);
		const paddingInnerScaled = Math.ceil(paddingInner * pixelRatio);
		const paddingBottomScaled = Math.round(paddingBottom * pixelRatio);
		const baselineOffsetScaled = Math.round(baselineOffset * pixelRatio);

		let yMid = this._commonData.coordinate;
		if (this._commonData.fixedCoordinate) {
			yMid = this._commonData.fixedCoordinate;
		}

		yMid = Math.round(yMid * pixelRatio);

		const yTop = yMid - halfHeigthScaled;
		const yBottom = yTop + totalHeightScaled;

		const alignRight = align === 'right';

		const xInside = alignRight ? widthScaled : 0;
		const rightScaled = widthScaled;

		let xOutside = xInside;
		let xTick: number;
		let xText: number;

		ctx.fillStyle = this._commonData.background;

		if (text) {
			if (alignRight) {
				// 2               1
				//
				//              6  5
				//
				// 3               4
				xOutside = xInside - totalWidthScaled;
				xTick = xInside - tickSizeScaled;
				xText = xOutside + paddingOuterScaled;
			} else {
				// 1               2
				//
				// 6  5
				//
				// 4               3
				xOutside = xInside + totalWidthScaled;
				xTick = xInside + tickSizeScaled;
				xText = xInside + (tickSizeScaled || horzBorderScaled) + paddingInnerScaled;
			}

			const textCorrectionOffset = Math.round(pixelRatio * (correctedTextWidth - textWidth) / 2);
			xText += textCorrectionOffset;

			const tickHeight = Math.max(1, Math.floor(pixelRatio));

			ctx.save();

			const radius = 5 * pixelRatio;

			ctx.beginPath();
			if (alignRight) {
				ctx.moveTo(xInside, yTop);
				ctx.lineTo(xOutside + radius, yTop);
				ctx.arcTo(xOutside, yTop, xOutside, yTop + radius, radius);
				ctx.lineTo(xOutside, yBottom - radius);
				ctx.arcTo(xOutside, yBottom, xOutside + radius, yBottom, radius);
				ctx.lineTo(xInside, yBottom);
			} else {
				ctx.moveTo(xInside, yTop);
				ctx.lineTo(xOutside - radius, yTop);
				ctx.arcTo(xOutside, yTop, xOutside, yTop + radius, radius);
				ctx.lineTo(xOutside, yBottom - radius);
				ctx.arcTo(xOutside, yBottom, xOutside - radius, yBottom, radius);
				ctx.lineTo(xInside, yBottom);
			}
			ctx.fill();

			// draw border
			ctx.fillStyle = this._data.borderColor;
			ctx.fillRect(alignRight ? rightScaled - horzBorderScaled : 0, yTop, horzBorderScaled, yBottom - yTop);

			if (this._data.tickVisible) {
				ctx.fillStyle = this._commonData.color;
				ctx.fillRect(xInside, yMid, xTick - xInside, tickHeight);
			}

			ctx.textAlign = 'left';
			ctx.fillStyle = this._commonData.color;

			ctx.translate(xText, yBottom - paddingBottomScaled - baselineOffsetScaled);
			drawScaled(ctx, pixelRatio, () => {
				ctx.fillText(text, 0, 0);
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
