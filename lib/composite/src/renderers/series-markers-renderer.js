"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeriesMarkersRenderer = void 0;
const assertions_1 = require("../helpers/assertions");
const make_font_1 = require("../helpers/make-font");
const text_width_cache_1 = require("../model/text-width-cache");
const bitmap_coordinates_pane_renderer_1 = require("./bitmap-coordinates-pane-renderer");
const series_markers_arrow_1 = require("./series-markers-arrow");
const series_markers_circle_1 = require("./series-markers-circle");
const series_markers_square_1 = require("./series-markers-square");
const series_markers_text_1 = require("./series-markers-text");
class SeriesMarkersRenderer extends bitmap_coordinates_pane_renderer_1.BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._data = null;
        this._textWidthCache = new text_width_cache_1.TextWidthCache();
        this._fontSize = -1;
        this._fontFamily = '';
        this._font = '';
    }
    setData(data) {
        this._data = data;
    }
    setParams(fontSize, fontFamily) {
        if (this._fontSize !== fontSize || this._fontFamily !== fontFamily) {
            this._fontSize = fontSize;
            this._fontFamily = fontFamily;
            this._font = (0, make_font_1.makeFont)(fontSize, fontFamily);
            this._textWidthCache.reset();
        }
    }
    hitTest(x, y) {
        if (this._data === null || this._data.visibleRange === null) {
            return null;
        }
        for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; i++) {
            const item = this._data.items[i];
            if (hitTestItem(item, x, y)) {
                return {
                    hitTestData: item.internalId,
                    externalId: item.externalId,
                };
            }
        }
        return null;
    }
    _drawImpl({ context: ctx, horizontalPixelRatio, verticalPixelRatio }, isHovered, hitTestData) {
        if (this._data === null || this._data.visibleRange === null) {
            return;
        }
        ctx.textBaseline = 'middle';
        ctx.font = this._font;
        for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; i++) {
            const item = this._data.items[i];
            if (item.text !== undefined) {
                item.text.width = this._textWidthCache.measureText(ctx, item.text.content);
                item.text.height = this._fontSize;
                item.text.x = item.x - item.text.width / 2;
            }
            drawItem(item, ctx, horizontalPixelRatio, verticalPixelRatio);
        }
    }
}
exports.SeriesMarkersRenderer = SeriesMarkersRenderer;
function bitmapShapeItemCoordinates(item, horizontalPixelRatio, verticalPixelRatio) {
    const tickWidth = Math.max(1, Math.floor(horizontalPixelRatio));
    const correction = (tickWidth % 2) / 2;
    return {
        x: Math.round(item.x * horizontalPixelRatio) + correction,
        y: item.y * verticalPixelRatio,
        pixelRatio: horizontalPixelRatio,
    };
}
function drawItem(item, ctx, horizontalPixelRatio, verticalPixelRatio) {
    ctx.fillStyle = item.color;
    if (item.text !== undefined) {
        (0, series_markers_text_1.drawText)(ctx, item.text.content, item.text.x, item.text.y, horizontalPixelRatio, verticalPixelRatio);
    }
    drawShape(item, ctx, bitmapShapeItemCoordinates(item, horizontalPixelRatio, verticalPixelRatio));
}
function drawShape(item, ctx, coordinates) {
    if (item.size === 0) {
        return;
    }
    switch (item.shape) {
        case 'arrowDown':
            (0, series_markers_arrow_1.drawArrow)(false, ctx, coordinates, item.size);
            return;
        case 'arrowUp':
            (0, series_markers_arrow_1.drawArrow)(true, ctx, coordinates, item.size);
            return;
        case 'circle':
            (0, series_markers_circle_1.drawCircle)(ctx, coordinates, item.size);
            return;
        case 'square':
            (0, series_markers_square_1.drawSquare)(ctx, coordinates, item.size);
            return;
    }
    (0, assertions_1.ensureNever)(item.shape);
}
function hitTestItem(item, x, y) {
    if (item.text !== undefined && (0, series_markers_text_1.hitTestText)(item.text.x, item.text.y, item.text.width, item.text.height, x, y)) {
        return true;
    }
    return hitTestShape(item, x, y);
}
function hitTestShape(item, x, y) {
    if (item.size === 0) {
        return false;
    }
    switch (item.shape) {
        case 'arrowDown':
            return (0, series_markers_arrow_1.hitTestArrow)(true, item.x, item.y, item.size, x, y);
        case 'arrowUp':
            return (0, series_markers_arrow_1.hitTestArrow)(false, item.x, item.y, item.size, x, y);
        case 'circle':
            return (0, series_markers_circle_1.hitTestCircle)(item.x, item.y, item.size, x, y);
        case 'square':
            return (0, series_markers_square_1.hitTestSquare)(item.x, item.y, item.size, x, y);
    }
}
