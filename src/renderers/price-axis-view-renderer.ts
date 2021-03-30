import { drawRoundRectWithInnerBorder, drawScaled } from '../helpers/canvas-helpers';

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

		const tickSize = (this._data.tickVisible) ? rendererOptions.tickLength : 0;
		const horzBorder = rendererOptions.borderSize;
		const paddingTop = rendererOptions.paddingTop + this._commonData.additionalPaddingTop;
		const paddingBottom = rendererOptions.paddingBottom + this._commonData.additionalPaddingBottom;
		const paddingInner = rendererOptions.paddingInner;
		const paddingOuter = rendererOptions.paddingOuter;
		const text = this._data.text;
		const actualTextHeight = rendererOptions.fontSize;
		const textMidCorrection = textWidthCache.yMidCorrection(ctx, text) * pixelRatio;

		const textWidth = Math.ceil(textWidthCache.measureText(ctx, text));
		const totalHeight = actualTextHeight + paddingTop + paddingBottom;

		const totalWidth = horzBorder + paddingInner + paddingOuter + textWidth + tickSize;

		const tickHeight = Math.max(1, Math.floor(pixelRatio));

		let totalHeightScaled = Math.round(totalHeight * pixelRatio);
		if (totalHeightScaled % 2 !== tickHeight % 2) {
			totalHeightScaled += 1;
		}

		const horzBorderScaled = Math.max(1, Math.floor(horzBorder * pixelRatio));
		const totalWidthScaled = Math.round(totalWidth * pixelRatio);
		// tick overlaps scale border
		const tickSizeScaled = Math.round(tickSize * pixelRatio);
		const widthScaled = Math.ceil(width * pixelRatio);
		const paddingInnerScaled = Math.ceil(paddingInner * pixelRatio);

		let yMid = this._commonData.coordinate;
		if (this._commonData.fixedCoordinate) {
			yMid = this._commonData.fixedCoordinate;
		}

		yMid = Math.round(yMid * pixelRatio) - Math.floor(pixelRatio * 0.5);
		const yTop = Math.floor(yMid + tickHeight / 2 - totalHeightScaled / 2);
		const yBottom = yTop + totalHeightScaled;

		const alignRight = align === 'right';

		const xInside = alignRight ? widthScaled - horzBorderScaled : horzBorderScaled;
		const rightScaled = widthScaled;

		let xOutside = xInside;
		let xTick: number;
		let xText: number;

		ctx.fillStyle = this._commonData.background;
		const radius = 2 * pixelRatio;

		ctx.textAlign = alignRight ? 'right' : 'left';
		ctx.textBaseline = 'middle';

		if (alignRight) {
			// 2               1
			//
			//              6  5
			//
			// 3               4
			xOutside = xInside - totalWidthScaled;
			xTick = xInside - tickSizeScaled;
			xText = xInside - tickSizeScaled - paddingInnerScaled - 1;
		} else {
			// 1               2
			//
			// 6  5
			//
			// 4               3
			xOutside = xInside + totalWidthScaled;
			xTick = xInside + tickSizeScaled;
			xText = xInside + tickSizeScaled + paddingInnerScaled;
		}

		const textColor = this._data.color || this._commonData.color;
		const backgroundColor = (this._commonData.background);

		if (text) {
			const drawLabelBody = (labelBackgroundColor: string, labelBorderColor?: string): void => {
				if (alignRight) {
					drawRoundRectWithInnerBorder(
						ctx,
						xOutside,
						yTop,
						totalWidthScaled,
						totalHeightScaled,
						labelBackgroundColor,
						horzBorderScaled,
						[radius, 0, 0, radius],
						labelBorderColor
					);
				} else {
					drawRoundRectWithInnerBorder(
						ctx,
						xInside,
						yTop,
						totalWidthScaled,
						totalHeightScaled,
						labelBackgroundColor,
						horzBorderScaled,
						[0, radius, radius, 0],
						labelBorderColor
					);
				}
			};

			// draw border
			// draw label background
			drawLabelBody(backgroundColor, 'transparent');
			// draw tick
			if (this._data.tickVisible) {
				ctx.fillStyle = textColor;
				ctx.fillRect(xInside, yMid, xTick - xInside, tickHeight);
			}
			// draw label border above the tick
			drawLabelBody('transparent', backgroundColor);

			// draw separator
			if (this._data.borderVisible) {
				ctx.fillStyle = rendererOptions.paneBackgroundColor;
				ctx.fillRect(alignRight ? rightScaled - horzBorderScaled : 0, yTop, horzBorderScaled, yBottom - yTop);
			}

			ctx.save();
			ctx.translate(xText, (yTop + yBottom) / 2 + textMidCorrection);
			drawScaled(ctx, pixelRatio, () => {
				ctx.fillStyle = textColor;
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
