import { fillRectInnerBorder } from '../helpers/canvas-helpers';
import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
import { optimalCandlestickWidth } from './optimal-bar-width';
;
export class PaneRendererCandlesticks extends BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._private__data = null;
        // scaled with pixelRatio
        this._private__barWidth = 0;
    }
    _internal_setData(data) {
        this._private__data = data;
    }
    _internal__drawImpl(renderingScope) {
        if (this._private__data === null || this._private__data._internal_bars.length === 0 || this._private__data._internal_visibleRange === null) {
            return;
        }
        const { horizontalPixelRatio } = renderingScope;
        // now we know pixelRatio and we could calculate barWidth effectively
        this._private__barWidth = optimalCandlestickWidth(this._private__data._internal_barSpacing, horizontalPixelRatio);
        // grid and crosshair have line width = Math.floor(pixelRatio)
        // if this value is odd, we have to make candlesticks' width odd
        // if this value is even, we have to make candlesticks' width even
        // in order of keeping crosshair-over-candlesticks drawing symmetric
        if (this._private__barWidth >= 2) {
            const wickWidth = Math.floor(horizontalPixelRatio);
            if ((wickWidth % 2) !== (this._private__barWidth % 2)) {
                this._private__barWidth--;
            }
        }
        const bars = this._private__data._internal_bars;
        if (this._private__data._internal_wickVisible) {
            this._private__drawWicks(renderingScope, bars, this._private__data._internal_visibleRange);
        }
        if (this._private__data._internal_borderVisible) {
            this._private__drawBorder(renderingScope, bars, this._private__data._internal_visibleRange);
        }
        const borderWidth = this._private__calculateBorderWidth(horizontalPixelRatio);
        if (!this._private__data._internal_borderVisible || this._private__barWidth > borderWidth * 2) {
            this._private__drawCandles(renderingScope, bars, this._private__data._internal_visibleRange);
        }
    }
    _private__drawWicks(renderingScope, bars, visibleRange) {
        if (this._private__data === null) {
            return;
        }
        const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = renderingScope;
        let prevWickColor = '';
        let wickWidth = Math.min(Math.floor(horizontalPixelRatio), Math.floor(this._private__data._internal_barSpacing * horizontalPixelRatio));
        wickWidth = Math.max(Math.floor(horizontalPixelRatio), Math.min(wickWidth, this._private__barWidth));
        const wickOffset = Math.floor(wickWidth * 0.5);
        let prevEdge = null;
        for (let i = visibleRange.from; i < visibleRange.to; i++) {
            const bar = bars[i];
            if (bar._internal_barWickColor !== prevWickColor) {
                ctx.fillStyle = bar._internal_barWickColor;
                prevWickColor = bar._internal_barWickColor;
            }
            const top = Math.round(Math.min(bar._internal_openY, bar._internal_closeY) * verticalPixelRatio);
            const bottom = Math.round(Math.max(bar._internal_openY, bar._internal_closeY) * verticalPixelRatio);
            const high = Math.round(bar._internal_highY * verticalPixelRatio);
            const low = Math.round(bar._internal_lowY * verticalPixelRatio);
            const scaledX = Math.round(horizontalPixelRatio * bar._internal_x);
            let left = scaledX - wickOffset;
            const right = left + wickWidth - 1;
            if (prevEdge !== null) {
                left = Math.max(prevEdge + 1, left);
                left = Math.min(left, right);
            }
            const width = right - left + 1;
            ctx.fillRect(left, high, width, top - high);
            ctx.fillRect(left, bottom + 1, width, low - bottom);
            prevEdge = right;
        }
    }
    _private__calculateBorderWidth(pixelRatio) {
        let borderWidth = Math.floor(1 /* Constants.BarBorderWidth */ * pixelRatio);
        if (this._private__barWidth <= 2 * borderWidth) {
            borderWidth = Math.floor((this._private__barWidth - 1) * 0.5);
        }
        const res = Math.max(Math.floor(pixelRatio), borderWidth);
        if (this._private__barWidth <= res * 2) {
            // do not draw bodies, restore original value
            return Math.max(Math.floor(pixelRatio), Math.floor(1 /* Constants.BarBorderWidth */ * pixelRatio));
        }
        return res;
    }
    _private__drawBorder(renderingScope, bars, visibleRange) {
        if (this._private__data === null) {
            return;
        }
        const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = renderingScope;
        let prevBorderColor = '';
        const borderWidth = this._private__calculateBorderWidth(horizontalPixelRatio);
        let prevEdge = null;
        for (let i = visibleRange.from; i < visibleRange.to; i++) {
            const bar = bars[i];
            if (bar._internal_barBorderColor !== prevBorderColor) {
                ctx.fillStyle = bar._internal_barBorderColor;
                prevBorderColor = bar._internal_barBorderColor;
            }
            let left = Math.round(bar._internal_x * horizontalPixelRatio) - Math.floor(this._private__barWidth * 0.5);
            // this is important to calculate right before patching left
            const right = left + this._private__barWidth - 1;
            const top = Math.round(Math.min(bar._internal_openY, bar._internal_closeY) * verticalPixelRatio);
            const bottom = Math.round(Math.max(bar._internal_openY, bar._internal_closeY) * verticalPixelRatio);
            if (prevEdge !== null) {
                left = Math.max(prevEdge + 1, left);
                left = Math.min(left, right);
            }
            if (this._private__data._internal_barSpacing * horizontalPixelRatio > 2 * borderWidth) {
                fillRectInnerBorder(ctx, left, top, right - left + 1, bottom - top + 1, borderWidth);
            }
            else {
                const width = right - left + 1;
                ctx.fillRect(left, top, width, bottom - top + 1);
            }
            prevEdge = right;
        }
    }
    _private__drawCandles(renderingScope, bars, visibleRange) {
        if (this._private__data === null) {
            return;
        }
        const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = renderingScope;
        let prevBarColor = '';
        const borderWidth = this._private__calculateBorderWidth(horizontalPixelRatio);
        for (let i = visibleRange.from; i < visibleRange.to; i++) {
            const bar = bars[i];
            let top = Math.round(Math.min(bar._internal_openY, bar._internal_closeY) * verticalPixelRatio);
            let bottom = Math.round(Math.max(bar._internal_openY, bar._internal_closeY) * verticalPixelRatio);
            let left = Math.round(bar._internal_x * horizontalPixelRatio) - Math.floor(this._private__barWidth * 0.5);
            let right = left + this._private__barWidth - 1;
            if (bar._internal_barColor !== prevBarColor) {
                const barColor = bar._internal_barColor;
                ctx.fillStyle = barColor;
                prevBarColor = barColor;
            }
            if (this._private__data._internal_borderVisible) {
                left += borderWidth;
                top += borderWidth;
                right -= borderWidth;
                bottom -= borderWidth;
            }
            if (top > bottom) {
                continue;
            }
            ctx.fillRect(left, top, right - left + 1, bottom - top + 1);
        }
    }
}
