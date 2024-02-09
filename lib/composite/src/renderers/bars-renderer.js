"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaneRendererBars = void 0;
const assertions_1 = require("../helpers/assertions");
const bitmap_coordinates_pane_renderer_1 = require("./bitmap-coordinates-pane-renderer");
const optimal_bar_width_1 = require("./optimal-bar-width");
class PaneRendererBars extends bitmap_coordinates_pane_renderer_1.BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._data = null;
        this._barWidth = 0;
        this._barLineWidth = 0;
    }
    setData(data) {
        this._data = data;
    }
    // eslint-disable-next-line complexity
    _drawImpl({ context: ctx, horizontalPixelRatio, verticalPixelRatio }) {
        if (this._data === null || this._data.bars.length === 0 || this._data.visibleRange === null) {
            return;
        }
        this._barWidth = this._calcBarWidth(horizontalPixelRatio);
        // grid and crosshair have line width = Math.floor(pixelRatio)
        // if this value is odd, we have to make bars' width odd
        // if this value is even, we have to make bars' width even
        // in order of keeping crosshair-over-bar drawing symmetric
        if (this._barWidth >= 2) {
            const lineWidth = Math.max(1, Math.floor(horizontalPixelRatio));
            if ((lineWidth % 2) !== (this._barWidth % 2)) {
                this._barWidth--;
            }
        }
        // if scale is compressed, bar could become less than 1 CSS pixel
        this._barLineWidth = this._data.thinBars ? Math.min(this._barWidth, Math.floor(horizontalPixelRatio)) : this._barWidth;
        let prevColor = null;
        const drawOpenClose = this._barLineWidth <= this._barWidth && this._data.barSpacing >= Math.floor(1.5 * horizontalPixelRatio);
        for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; ++i) {
            const bar = this._data.bars[i];
            if (prevColor !== bar.barColor) {
                ctx.fillStyle = bar.barColor;
                prevColor = bar.barColor;
            }
            const bodyWidthHalf = Math.floor(this._barLineWidth * 0.5);
            const bodyCenter = Math.round(bar.x * horizontalPixelRatio);
            const bodyLeft = bodyCenter - bodyWidthHalf;
            const bodyWidth = this._barLineWidth;
            const bodyRight = bodyLeft + bodyWidth - 1;
            const high = Math.min(bar.highY, bar.lowY);
            const low = Math.max(bar.highY, bar.lowY);
            const bodyTop = Math.round(high * verticalPixelRatio) - bodyWidthHalf;
            const bodyBottom = Math.round(low * verticalPixelRatio) + bodyWidthHalf;
            const bodyHeight = Math.max((bodyBottom - bodyTop), this._barLineWidth);
            ctx.fillRect(bodyLeft, bodyTop, bodyWidth, bodyHeight);
            const sideWidth = Math.ceil(this._barWidth * 1.5);
            if (drawOpenClose) {
                if (this._data.openVisible) {
                    const openLeft = bodyCenter - sideWidth;
                    let openTop = Math.max(bodyTop, Math.round(bar.openY * verticalPixelRatio) - bodyWidthHalf);
                    let openBottom = openTop + bodyWidth - 1;
                    if (openBottom > bodyTop + bodyHeight - 1) {
                        openBottom = bodyTop + bodyHeight - 1;
                        openTop = openBottom - bodyWidth + 1;
                    }
                    ctx.fillRect(openLeft, openTop, bodyLeft - openLeft, openBottom - openTop + 1);
                }
                const closeRight = bodyCenter + sideWidth;
                let closeTop = Math.max(bodyTop, Math.round(bar.closeY * verticalPixelRatio) - bodyWidthHalf);
                let closeBottom = closeTop + bodyWidth - 1;
                if (closeBottom > bodyTop + bodyHeight - 1) {
                    closeBottom = bodyTop + bodyHeight - 1;
                    closeTop = closeBottom - bodyWidth + 1;
                }
                ctx.fillRect(bodyRight + 1, closeTop, closeRight - bodyRight, closeBottom - closeTop + 1);
            }
        }
    }
    _calcBarWidth(pixelRatio) {
        const limit = Math.floor(pixelRatio);
        return Math.max(limit, Math.floor((0, optimal_bar_width_1.optimalBarWidth)((0, assertions_1.ensureNotNull)(this._data).barSpacing, pixelRatio)));
    }
}
exports.PaneRendererBars = PaneRendererBars;
