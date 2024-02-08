import { ensureNever } from '../helpers/assertions';
import { makeFont } from '../helpers/make-font';
import { TextWidthCache } from '../model/text-width-cache';
import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
import { drawArrow, hitTestArrow } from './series-markers-arrow';
import { drawCircle, hitTestCircle } from './series-markers-circle';
import { drawSquare, hitTestSquare } from './series-markers-square';
import { drawText, hitTestText } from './series-markers-text';
export class SeriesMarkersRenderer extends BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._private__data = null;
        this._private__textWidthCache = new TextWidthCache();
        this._private__fontSize = -1;
        this._private__fontFamily = '';
        this._private__font = '';
    }
    _internal_setData(data) {
        this._private__data = data;
    }
    _internal_setParams(fontSize, fontFamily) {
        if (this._private__fontSize !== fontSize || this._private__fontFamily !== fontFamily) {
            this._private__fontSize = fontSize;
            this._private__fontFamily = fontFamily;
            this._private__font = makeFont(fontSize, fontFamily);
            this._private__textWidthCache._internal_reset();
        }
    }
    _internal_hitTest(x, y) {
        if (this._private__data === null || this._private__data._internal_visibleRange === null) {
            return null;
        }
        for (let i = this._private__data._internal_visibleRange.from; i < this._private__data._internal_visibleRange.to; i++) {
            const item = this._private__data._internal_items[i];
            if (hitTestItem(item, x, y)) {
                return {
                    _internal_hitTestData: item._internal_internalId,
                    _internal_externalId: item._internal_externalId,
                };
            }
        }
        return null;
    }
    _internal__drawImpl({ context: ctx, horizontalPixelRatio, verticalPixelRatio }, isHovered, hitTestData) {
        if (this._private__data === null || this._private__data._internal_visibleRange === null) {
            return;
        }
        ctx.textBaseline = 'middle';
        ctx.font = this._private__font;
        for (let i = this._private__data._internal_visibleRange.from; i < this._private__data._internal_visibleRange.to; i++) {
            const item = this._private__data._internal_items[i];
            if (item._internal_text !== undefined) {
                item._internal_text._internal_width = this._private__textWidthCache._internal_measureText(ctx, item._internal_text._internal_content);
                item._internal_text._internal_height = this._private__fontSize;
                item._internal_text._internal_x = item._internal_x - item._internal_text._internal_width / 2;
            }
            drawItem(item, ctx, horizontalPixelRatio, verticalPixelRatio);
        }
    }
}
function bitmapShapeItemCoordinates(item, horizontalPixelRatio, verticalPixelRatio) {
    const tickWidth = Math.max(1, Math.floor(horizontalPixelRatio));
    const correction = (tickWidth % 2) / 2;
    return {
        _internal_x: Math.round(item._internal_x * horizontalPixelRatio) + correction,
        _internal_y: item._internal_y * verticalPixelRatio,
        _internal_pixelRatio: horizontalPixelRatio,
    };
}
function drawItem(item, ctx, horizontalPixelRatio, verticalPixelRatio) {
    ctx.fillStyle = item._internal_color;
    if (item._internal_text !== undefined) {
        drawText(ctx, item._internal_text._internal_content, item._internal_text._internal_x, item._internal_text._internal_y, horizontalPixelRatio, verticalPixelRatio);
    }
    drawShape(item, ctx, bitmapShapeItemCoordinates(item, horizontalPixelRatio, verticalPixelRatio));
}
function drawShape(item, ctx, coordinates) {
    if (item._internal_size === 0) {
        return;
    }
    switch (item._internal_shape) {
        case 'arrowDown':
            drawArrow(false, ctx, coordinates, item._internal_size);
            return;
        case 'arrowUp':
            drawArrow(true, ctx, coordinates, item._internal_size);
            return;
        case 'circle':
            drawCircle(ctx, coordinates, item._internal_size);
            return;
        case 'square':
            drawSquare(ctx, coordinates, item._internal_size);
            return;
    }
    ensureNever(item._internal_shape);
}
function hitTestItem(item, x, y) {
    if (item._internal_text !== undefined && hitTestText(item._internal_text._internal_x, item._internal_text._internal_y, item._internal_text._internal_width, item._internal_text._internal_height, x, y)) {
        return true;
    }
    return hitTestShape(item, x, y);
}
function hitTestShape(item, x, y) {
    if (item._internal_size === 0) {
        return false;
    }
    switch (item._internal_shape) {
        case 'arrowDown':
            return hitTestArrow(true, item._internal_x, item._internal_y, item._internal_size, x, y);
        case 'arrowUp':
            return hitTestArrow(false, item._internal_x, item._internal_y, item._internal_size, x, y);
        case 'circle':
            return hitTestCircle(item._internal_x, item._internal_y, item._internal_size, x, y);
        case 'square':
            return hitTestSquare(item._internal_x, item._internal_y, item._internal_size, x, y);
    }
}
