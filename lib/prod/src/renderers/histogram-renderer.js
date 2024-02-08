import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
const showSpacingMinimalBarWidth = 1;
const alignToMinimalWidthLimit = 4;
export class PaneRendererHistogram extends BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._private__data = null;
        this._private__precalculatedCache = [];
    }
    _internal_setData(data) {
        this._private__data = data;
        this._private__precalculatedCache = [];
    }
    _internal__drawImpl({ context: ctx, horizontalPixelRatio, verticalPixelRatio }) {
        if (this._private__data === null || this._private__data._internal_items.length === 0 || this._private__data._internal_visibleRange === null) {
            return;
        }
        if (!this._private__precalculatedCache.length) {
            this._private__fillPrecalculatedCache(horizontalPixelRatio);
        }
        const tickWidth = Math.max(1, Math.floor(verticalPixelRatio));
        const histogramBase = Math.round((this._private__data._internal_histogramBase) * verticalPixelRatio);
        const topHistogramBase = histogramBase - Math.floor(tickWidth / 2);
        const bottomHistogramBase = topHistogramBase + tickWidth;
        for (let i = this._private__data._internal_visibleRange.from; i < this._private__data._internal_visibleRange.to; i++) {
            const item = this._private__data._internal_items[i];
            const current = this._private__precalculatedCache[i - this._private__data._internal_visibleRange.from];
            const y = Math.round(item._internal_y * verticalPixelRatio);
            ctx.fillStyle = item._internal_barColor;
            let top;
            let bottom;
            if (y <= topHistogramBase) {
                top = y;
                bottom = bottomHistogramBase;
            }
            else {
                top = topHistogramBase;
                bottom = y - Math.floor(tickWidth / 2) + tickWidth;
            }
            ctx.fillRect(current._internal_left, top, current._internal_right - current._internal_left + 1, bottom - top);
        }
    }
    // eslint-disable-next-line complexity
    _private__fillPrecalculatedCache(pixelRatio) {
        if (this._private__data === null || this._private__data._internal_items.length === 0 || this._private__data._internal_visibleRange === null) {
            this._private__precalculatedCache = [];
            return;
        }
        const spacing = Math.ceil(this._private__data._internal_barSpacing * pixelRatio) <= showSpacingMinimalBarWidth ? 0 : Math.max(1, Math.floor(pixelRatio));
        const columnWidth = Math.round(this._private__data._internal_barSpacing * pixelRatio) - spacing;
        this._private__precalculatedCache = new Array(this._private__data._internal_visibleRange.to - this._private__data._internal_visibleRange.from);
        for (let i = this._private__data._internal_visibleRange.from; i < this._private__data._internal_visibleRange.to; i++) {
            const item = this._private__data._internal_items[i];
            // force cast to avoid ensureDefined call
            const x = Math.round(item._internal_x * pixelRatio);
            let left;
            let right;
            if (columnWidth % 2) {
                const halfWidth = (columnWidth - 1) / 2;
                left = x - halfWidth;
                right = x + halfWidth;
            }
            else {
                // shift pixel to left
                const halfWidth = columnWidth / 2;
                left = x - halfWidth;
                right = x + halfWidth - 1;
            }
            this._private__precalculatedCache[i - this._private__data._internal_visibleRange.from] = {
                _internal_left: left,
                _internal_right: right,
                _internal_roundedCenter: x,
                _internal_center: (item._internal_x * pixelRatio),
                _internal_time: item._internal_time,
            };
        }
        // correct positions
        for (let i = this._private__data._internal_visibleRange.from + 1; i < this._private__data._internal_visibleRange.to; i++) {
            const current = this._private__precalculatedCache[i - this._private__data._internal_visibleRange.from];
            const prev = this._private__precalculatedCache[i - this._private__data._internal_visibleRange.from - 1];
            if (current._internal_time !== prev._internal_time + 1) {
                continue;
            }
            if (current._internal_left - prev._internal_right !== (spacing + 1)) {
                // have to align
                if (prev._internal_roundedCenter > prev._internal_center) {
                    // prev wasshifted to left, so add pixel to right
                    prev._internal_right = current._internal_left - spacing - 1;
                }
                else {
                    // extend current to left
                    current._internal_left = prev._internal_right + spacing + 1;
                }
            }
        }
        let minWidth = Math.ceil(this._private__data._internal_barSpacing * pixelRatio);
        for (let i = this._private__data._internal_visibleRange.from; i < this._private__data._internal_visibleRange.to; i++) {
            const current = this._private__precalculatedCache[i - this._private__data._internal_visibleRange.from];
            // this could happen if barspacing < 1
            if (current._internal_right < current._internal_left) {
                current._internal_right = current._internal_left;
            }
            const width = current._internal_right - current._internal_left + 1;
            minWidth = Math.min(width, minWidth);
        }
        if (spacing > 0 && minWidth < alignToMinimalWidthLimit) {
            for (let i = this._private__data._internal_visibleRange.from; i < this._private__data._internal_visibleRange.to; i++) {
                const current = this._private__precalculatedCache[i - this._private__data._internal_visibleRange.from];
                const width = current._internal_right - current._internal_left + 1;
                if (width > minWidth) {
                    if (current._internal_roundedCenter > current._internal_center) {
                        current._internal_right -= 1;
                    }
                    else {
                        current._internal_left += 1;
                    }
                }
            }
        }
    }
}
