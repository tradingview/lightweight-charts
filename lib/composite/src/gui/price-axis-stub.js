"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceAxisStub = void 0;
const fancy_canvas_1 = require("fancy-canvas");
const canvas_helpers_1 = require("../helpers/canvas-helpers");
const canvas_utils_1 = require("./canvas-utils");
class PriceAxisStub {
    constructor(side, options, params, borderVisible, bottomColor) {
        this._invalidated = true;
        this._size = (0, fancy_canvas_1.size)({ width: 0, height: 0 });
        this._canvasSuggestedBitmapSizeChangedHandler = () => this.paint(3 /* InvalidationLevel.Full */);
        this._isLeft = side === 'left';
        this._rendererOptionsProvider = params.rendererOptionsProvider;
        this._options = options;
        this._borderVisible = borderVisible;
        this._bottomColor = bottomColor;
        this._cell = document.createElement('div');
        this._cell.style.width = '25px';
        this._cell.style.height = '100%';
        this._cell.style.overflow = 'hidden';
        this._canvasBinding = (0, canvas_utils_1.createBoundCanvas)(this._cell, (0, fancy_canvas_1.size)({ width: 16, height: 16 }));
        this._canvasBinding.subscribeSuggestedBitmapSizeChanged(this._canvasSuggestedBitmapSizeChangedHandler);
    }
    destroy() {
        this._canvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._canvasSuggestedBitmapSizeChangedHandler);
        (0, canvas_utils_1.releaseCanvas)(this._canvasBinding.canvasElement);
        this._canvasBinding.dispose();
    }
    getElement() {
        return this._cell;
    }
    getSize() {
        return this._size;
    }
    setSize(newSize) {
        if (!(0, fancy_canvas_1.equalSizes)(this._size, newSize)) {
            this._size = newSize;
            this._canvasBinding.resizeCanvasElement(newSize);
            this._cell.style.width = `${newSize.width}px`;
            this._cell.style.height = `${newSize.height}px`;
            this._invalidated = true;
        }
    }
    paint(type) {
        if (type < 3 /* InvalidationLevel.Full */ && !this._invalidated) {
            return;
        }
        if (this._size.width === 0 || this._size.height === 0) {
            return;
        }
        this._invalidated = false;
        this._canvasBinding.applySuggestedBitmapSize();
        const target = (0, fancy_canvas_1.tryCreateCanvasRenderingTarget2D)(this._canvasBinding);
        if (target !== null) {
            target.useBitmapCoordinateSpace((scope) => {
                this._drawBackground(scope);
                this._drawBorder(scope);
            });
        }
    }
    getBitmapSize() {
        return this._canvasBinding.bitmapSize;
    }
    drawBitmap(ctx, x, y) {
        const bitmapSize = this.getBitmapSize();
        if (bitmapSize.width > 0 && bitmapSize.height > 0) {
            ctx.drawImage(this._canvasBinding.canvasElement, x, y);
        }
    }
    _drawBorder({ context: ctx, bitmapSize, horizontalPixelRatio, verticalPixelRatio }) {
        if (!this._borderVisible()) {
            return;
        }
        ctx.fillStyle = this._options.timeScale.borderColor;
        const horzBorderSize = Math.floor(this._rendererOptionsProvider.options().borderSize * horizontalPixelRatio);
        const vertBorderSize = Math.floor(this._rendererOptionsProvider.options().borderSize * verticalPixelRatio);
        const left = (this._isLeft) ? bitmapSize.width - horzBorderSize : 0;
        ctx.fillRect(left, 0, horzBorderSize, vertBorderSize);
    }
    _drawBackground({ context: ctx, bitmapSize }) {
        (0, canvas_helpers_1.clearRect)(ctx, 0, 0, bitmapSize.width, bitmapSize.height, this._bottomColor());
    }
}
exports.PriceAxisStub = PriceAxisStub;
