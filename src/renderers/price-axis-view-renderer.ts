import { drawRoundRectWithInnerBorder, drawScaled } from '../helpers/canvas-helpers';

import { TextWidthCache } from '../model/text-width-cache';

import {
	IPriceAxisViewRenderer,
	PriceAxisViewRendererCommonData,
	PriceAxisViewRendererData,
	PriceAxisViewRendererOptions,
} from './iprice-axis-view-renderer';

interface Geometry {
	alignRight: boolean;
	yTop: number;
	yMid: number;
	yBottom: number;
	totalWidthScaled: number;
	totalHeightScaled: number;
	radius: number;
	horzBorderScaled: number;
	xOutside: number;
	xInside: number;
	xTick: number;
	xText: number;
	tickHeight: number;
	rightScaled: number;
	textMidCorrection: number;
}

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

		const geometry = this._calculateGeometry(ctx, rendererOptions, textWidthCache, width, align, pixelRatio);

		const textColor = this._data.color || this._commonData.color;
		const backgroundColor = (this._commonData.background);

		ctx.fillStyle = this._commonData.background;

		if (this._data.text) {
			const drawLabelBody = (labelBackgroundColor: string, labelBorderColor?: string): void => {
				if (geometry.alignRight) {
					drawRoundRectWithInnerBorder(
						ctx,
						geometry.xOutside,
						geometry.yTop,
						geometry.totalWidthScaled,
						geometry.totalHeightScaled,
						labelBackgroundColor,
						geometry.horzBorderScaled,
						[geometry.radius, 0, 0, geometry.radius],
						labelBorderColor
					);
				} else {
					drawRoundRectWithInnerBorder(
						ctx,
						geometry.xInside,
						geometry.yTop,
						geometry.totalWidthScaled,
						geometry.totalHeightScaled,
						labelBackgroundColor,
						geometry.horzBorderScaled,
						[0, geometry.radius, geometry.radius, 0],
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
				ctx.fillRect(geometry.xInside, geometry.yMid, geometry.xTick - geometry.xInside, geometry.tickHeight);
			}
			// draw label border above the tick
			drawLabelBody('transparent', backgroundColor);

			// draw separator
			if (this._data.borderVisible) {
				ctx.fillStyle = rendererOptions.paneBackgroundColor;
				ctx.fillRect(geometry.alignRight ? geometry.rightScaled - geometry.horzBorderScaled : 0, geometry.yTop, geometry.horzBorderScaled, geometry.yBottom - geometry.yTop);
			}

			ctx.save();
			ctx.translate(geometry.xText, (geometry.yTop + geometry.yBottom) / 2 + geometry.textMidCorrection);
			drawScaled(ctx, pixelRatio, () => {
				ctx.fillStyle = textColor;
				ctx.fillText(this._data.text, 0, 0);
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

	private _calculateGeometry(
		ctx: CanvasRenderingContext2D,
		rendererOptions: PriceAxisViewRendererOptions,
		textWidthCache: TextWidthCache,
		width: number,
		align: 'left' | 'right',
		pixelRatio: number
	): Geometry {
		const tickSize = (this._data.tickVisible || !this._data.moveTextToInvisibleTick) ? rendererOptions.tickLength : 0;
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
		const horzBorderScaled = this._data.separatorVisible ? Math.max(1, Math.floor(horzBorder * pixelRatio)) : 0;
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
		return {
			alignRight,
			yTop,
			yMid,
			yBottom,
			totalWidthScaled,
			totalHeightScaled,
			radius,
			horzBorderScaled,
			xOutside,
			xInside,
			xTick,
			xText,
			tickHeight,
			rightScaled,
			textMidCorrection,
		};
	}
}
