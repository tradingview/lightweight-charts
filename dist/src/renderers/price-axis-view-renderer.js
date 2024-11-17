import { drawRoundRectWithBorder } from '../helpers/canvas-helpers';
export class PriceAxisViewRenderer {
    constructor(data, commonData) {
        this.setData(data, commonData);
    }
    setData(data, commonData) {
        this._data = data;
        this._commonData = commonData;
    }
    height(rendererOptions, useSecondLine) {
        if (!this._data.visible) {
            return 0;
        }
        return rendererOptions.fontSize + rendererOptions.paddingTop + rendererOptions.paddingBottom;
    }
    draw(target, rendererOptions, textWidthCache, align) {
        if (!this._data.visible || this._data.text.length === 0) {
            return;
        }
        const textColor = this._data.color;
        const backgroundColor = this._commonData.background;
        const geometry = target.useBitmapCoordinateSpace((scope) => {
            const ctx = scope.context;
            ctx.font = rendererOptions.font;
            const geom = this._calculateGeometry(scope, rendererOptions, textWidthCache, align);
            const gb = geom.bitmap;
            /*
             draw label. backgroundColor will always be a solid color (no alpha) [see generateContrastColors in color.ts].
             Therefore we can draw the rounded label using simplified code (drawRoundRectWithBorder) that doesn't need to ensure the background and the border don't overlap.
            */
            if (geom.alignRight) {
                drawRoundRectWithBorder(ctx, gb.xOutside, gb.yTop, gb.totalWidth, gb.totalHeight, backgroundColor, gb.horzBorder, [gb.radius, 0, 0, gb.radius], backgroundColor);
            }
            else {
                drawRoundRectWithBorder(ctx, gb.xInside, gb.yTop, gb.totalWidth, gb.totalHeight, backgroundColor, gb.horzBorder, [0, gb.radius, gb.radius, 0], backgroundColor);
            }
            // draw tick
            if (this._data.tickVisible) {
                ctx.fillStyle = textColor;
                ctx.fillRect(gb.xInside, gb.yMid, gb.xTick - gb.xInside, gb.tickHeight);
            }
            // draw separator
            if (this._data.borderVisible) {
                ctx.fillStyle = rendererOptions.paneBackgroundColor;
                ctx.fillRect(geom.alignRight ? gb.right - gb.horzBorder : 0, gb.yTop, gb.horzBorder, gb.yBottom - gb.yTop);
            }
            return geom;
        });
        target.useMediaCoordinateSpace(({ context: ctx }) => {
            const gm = geometry.media;
            ctx.font = rendererOptions.font;
            ctx.textAlign = geometry.alignRight ? 'right' : 'left';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = textColor;
            ctx.fillText(this._data.text, gm.xText, (gm.yTop + gm.yBottom) / 2 + gm.textMidCorrection);
        });
    }
    _calculateGeometry(scope, rendererOptions, textWidthCache, align) {
        var _a;
        const { context: ctx, bitmapSize, mediaSize, horizontalPixelRatio, verticalPixelRatio } = scope;
        const tickSize = (this._data.tickVisible || !this._data.moveTextToInvisibleTick) ? rendererOptions.tickLength : 0;
        const horzBorder = this._data.separatorVisible ? rendererOptions.borderSize : 0;
        const paddingTop = rendererOptions.paddingTop + this._commonData.additionalPaddingTop;
        const paddingBottom = rendererOptions.paddingBottom + this._commonData.additionalPaddingBottom;
        const paddingInner = rendererOptions.paddingInner;
        const paddingOuter = rendererOptions.paddingOuter;
        const text = this._data.text;
        const actualTextHeight = rendererOptions.fontSize;
        const textMidCorrection = textWidthCache.yMidCorrection(ctx, text);
        const textWidth = Math.ceil(textWidthCache.measureText(ctx, text));
        const totalHeight = actualTextHeight + paddingTop + paddingBottom;
        const totalWidth = rendererOptions.borderSize + paddingInner + paddingOuter + textWidth + tickSize;
        const tickHeightBitmap = Math.max(1, Math.floor(verticalPixelRatio));
        let totalHeightBitmap = Math.round(totalHeight * verticalPixelRatio);
        if (totalHeightBitmap % 2 !== tickHeightBitmap % 2) {
            totalHeightBitmap += 1;
        }
        const horzBorderBitmap = horzBorder > 0 ? Math.max(1, Math.floor(horzBorder * horizontalPixelRatio)) : 0;
        const totalWidthBitmap = Math.round(totalWidth * horizontalPixelRatio);
        // tick overlaps scale border
        const tickSizeBitmap = Math.round(tickSize * horizontalPixelRatio);
        const yMid = (_a = this._commonData.fixedCoordinate) !== null && _a !== void 0 ? _a : this._commonData.coordinate;
        const yMidBitmap = Math.round(yMid * verticalPixelRatio) - Math.floor(verticalPixelRatio * 0.5);
        const yTopBitmap = Math.floor(yMidBitmap + tickHeightBitmap / 2 - totalHeightBitmap / 2);
        const yBottomBitmap = yTopBitmap + totalHeightBitmap;
        const alignRight = align === 'right';
        const xInside = alignRight ? mediaSize.width - horzBorder : horzBorder;
        const xInsideBitmap = alignRight ? bitmapSize.width - horzBorderBitmap : horzBorderBitmap;
        let xOutsideBitmap;
        let xTickBitmap;
        let xText;
        if (alignRight) {
            // 2               1
            //
            //              6  5
            //
            // 3               4
            xOutsideBitmap = xInsideBitmap - totalWidthBitmap;
            xTickBitmap = xInsideBitmap - tickSizeBitmap;
            xText = xInside - tickSize - paddingInner - horzBorder;
        }
        else {
            // 1               2
            //
            // 6  5
            //
            // 4               3
            xOutsideBitmap = xInsideBitmap + totalWidthBitmap;
            xTickBitmap = xInsideBitmap + tickSizeBitmap;
            xText = xInside + tickSize + paddingInner;
        }
        return {
            alignRight,
            bitmap: {
                yTop: yTopBitmap,
                yMid: yMidBitmap,
                yBottom: yBottomBitmap,
                totalWidth: totalWidthBitmap,
                totalHeight: totalHeightBitmap,
                // TODO: it is better to have different horizontal and vertical radii
                radius: 2 * horizontalPixelRatio,
                horzBorder: horzBorderBitmap,
                xOutside: xOutsideBitmap,
                xInside: xInsideBitmap,
                xTick: xTickBitmap,
                tickHeight: tickHeightBitmap,
                right: bitmapSize.width,
            },
            media: {
                yTop: yTopBitmap / verticalPixelRatio,
                yBottom: yBottomBitmap / verticalPixelRatio,
                xText,
                textMidCorrection,
            },
        };
    }
}
