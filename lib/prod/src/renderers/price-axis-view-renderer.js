import { drawRoundRectWithInnerBorder } from '../helpers/canvas-helpers';
export class PriceAxisViewRenderer {
    constructor(data, commonData) {
        this._internal_setData(data, commonData);
    }
    _internal_setData(data, commonData) {
        this._private__data = data;
        this._private__commonData = commonData;
    }
    _internal_height(rendererOptions, useSecondLine) {
        if (!this._private__data._internal_visible) {
            return 0;
        }
        return rendererOptions._internal_fontSize + rendererOptions._internal_paddingTop + rendererOptions._internal_paddingBottom;
    }
    _internal_draw(target, rendererOptions, textWidthCache, align) {
        if (!this._private__data._internal_visible || this._private__data._internal_text.length === 0) {
            return;
        }
        const textColor = this._private__data._internal_color;
        const backgroundColor = this._private__commonData._internal_background;
        const geometry = target.useBitmapCoordinateSpace((scope) => {
            const ctx = scope.context;
            ctx.font = rendererOptions._internal_font;
            const geom = this._private__calculateGeometry(scope, rendererOptions, textWidthCache, align);
            const gb = geom._internal_bitmap;
            const drawLabelBody = (labelBackgroundColor, labelBorderColor) => {
                if (geom._internal_alignRight) {
                    drawRoundRectWithInnerBorder(ctx, gb._internal_xOutside, gb._internal_yTop, gb._internal_totalWidth, gb._internal_totalHeight, labelBackgroundColor, gb._internal_horzBorder, [gb._internal_radius, 0, 0, gb._internal_radius], labelBorderColor);
                }
                else {
                    drawRoundRectWithInnerBorder(ctx, gb._internal_xInside, gb._internal_yTop, gb._internal_totalWidth, gb._internal_totalHeight, labelBackgroundColor, gb._internal_horzBorder, [0, gb._internal_radius, gb._internal_radius, 0], labelBorderColor);
                }
            };
            // draw border
            // draw label background
            drawLabelBody(backgroundColor, 'transparent');
            // draw tick
            if (this._private__data._internal_tickVisible) {
                ctx.fillStyle = textColor;
                ctx.fillRect(gb._internal_xInside, gb._internal_yMid, gb._internal_xTick - gb._internal_xInside, gb._internal_tickHeight);
            }
            // draw label border above the tick
            drawLabelBody('transparent', backgroundColor);
            // draw separator
            if (this._private__data._internal_borderVisible) {
                ctx.fillStyle = rendererOptions._internal_paneBackgroundColor;
                ctx.fillRect(geom._internal_alignRight ? gb._internal_right - gb._internal_horzBorder : 0, gb._internal_yTop, gb._internal_horzBorder, gb._internal_yBottom - gb._internal_yTop);
            }
            return geom;
        });
        target.useMediaCoordinateSpace(({ context: ctx }) => {
            const gm = geometry._internal_media;
            ctx.font = rendererOptions._internal_font;
            ctx.textAlign = geometry._internal_alignRight ? 'right' : 'left';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = textColor;
            ctx.fillText(this._private__data._internal_text, gm._internal_xText, (gm._internal_yTop + gm._internal_yBottom) / 2 + gm._internal_textMidCorrection);
        });
    }
    _private__calculateGeometry(scope, rendererOptions, textWidthCache, align) {
        var _a;
        const { context: ctx, bitmapSize, mediaSize, horizontalPixelRatio, verticalPixelRatio } = scope;
        const tickSize = (this._private__data._internal_tickVisible || !this._private__data._internal_moveTextToInvisibleTick) ? rendererOptions._internal_tickLength : 0;
        const horzBorder = this._private__data._internal_separatorVisible ? rendererOptions._internal_borderSize : 0;
        const paddingTop = rendererOptions._internal_paddingTop + this._private__commonData._internal_additionalPaddingTop;
        const paddingBottom = rendererOptions._internal_paddingBottom + this._private__commonData._internal_additionalPaddingBottom;
        const paddingInner = rendererOptions._internal_paddingInner;
        const paddingOuter = rendererOptions._internal_paddingOuter;
        const text = this._private__data._internal_text;
        const actualTextHeight = rendererOptions._internal_fontSize;
        const textMidCorrection = textWidthCache._internal_yMidCorrection(ctx, text);
        const textWidth = Math.ceil(textWidthCache._internal_measureText(ctx, text));
        const totalHeight = actualTextHeight + paddingTop + paddingBottom;
        const totalWidth = rendererOptions._internal_borderSize + paddingInner + paddingOuter + textWidth + tickSize;
        const tickHeightBitmap = Math.max(1, Math.floor(verticalPixelRatio));
        let totalHeightBitmap = Math.round(totalHeight * verticalPixelRatio);
        if (totalHeightBitmap % 2 !== tickHeightBitmap % 2) {
            totalHeightBitmap += 1;
        }
        const horzBorderBitmap = horzBorder > 0 ? Math.max(1, Math.floor(horzBorder * horizontalPixelRatio)) : 0;
        const totalWidthBitmap = Math.round(totalWidth * horizontalPixelRatio);
        // tick overlaps scale border
        const tickSizeBitmap = Math.round(tickSize * horizontalPixelRatio);
        const yMid = (_a = this._private__commonData._internal_fixedCoordinate) !== null && _a !== void 0 ? _a : this._private__commonData._internal_coordinate;
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
            _internal_alignRight: alignRight,
            _internal_bitmap: {
                _internal_yTop: yTopBitmap,
                _internal_yMid: yMidBitmap,
                _internal_yBottom: yBottomBitmap,
                _internal_totalWidth: totalWidthBitmap,
                _internal_totalHeight: totalHeightBitmap,
                // TODO: it is better to have different horizontal and vertical radii
                _internal_radius: 2 * horizontalPixelRatio,
                _internal_horzBorder: horzBorderBitmap,
                _internal_xOutside: xOutsideBitmap,
                _internal_xInside: xInsideBitmap,
                _internal_xTick: xTickBitmap,
                _internal_tickHeight: tickHeightBitmap,
                _internal_right: bitmapSize.width,
            },
            _internal_media: {
                _internal_yTop: yTopBitmap / verticalPixelRatio,
                _internal_yBottom: yBottomBitmap / verticalPixelRatio,
                _internal_xText: xText,
                _internal_textMidCorrection: textMidCorrection,
            },
        };
    }
}
