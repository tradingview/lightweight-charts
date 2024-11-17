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
        this._data = null;
        this._textWidthCache = new TextWidthCache();
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
            this._font = makeFont(fontSize, fontFamily);
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
        drawText(ctx, item.text.content, item.text.x, item.text.y, horizontalPixelRatio, verticalPixelRatio);
    }
    drawShape(item, ctx, bitmapShapeItemCoordinates(item, horizontalPixelRatio, verticalPixelRatio));
}
function drawShape(item, ctx, coordinates) {
    if (item.size === 0) {
        return;
    }
    switch (item.shape) {
        case 'arrowDown':
            drawArrow(false, ctx, coordinates, item.size);
            return;
        case 'arrowUp':
            drawArrow(true, ctx, coordinates, item.size);
            return;
        case 'circle':
            drawCircle(ctx, coordinates, item.size);
            return;
        case 'square':
            drawSquare(ctx, coordinates, item.size);
            return;
    }
    ensureNever(item.shape);
}
function hitTestItem(item, x, y) {
    if (item.text !== undefined && hitTestText(item.text.x, item.text.y, item.text.width, item.text.height, x, y)) {
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
            return hitTestArrow(true, item.x, item.y, item.size, x, y);
        case 'arrowUp':
            return hitTestArrow(false, item.x, item.y, item.size, x, y);
        case 'circle':
            return hitTestCircle(item.x, item.y, item.size, x, y);
        case 'square':
            return hitTestSquare(item.x, item.y, item.size, x, y);
    }
}
