import { equalSizes, size, tryCreateCanvasRenderingTarget2D, } from 'fancy-canvas';
import { clearRect } from '../helpers/canvas-helpers';
import { createBoundCanvas, releaseCanvas } from './canvas-utils';
export class PriceAxisStub {
    constructor(side, options, params, borderVisible, bottomColor) {
        this._invalidated = true;
        this._size = size({ width: 0, height: 0 });
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
        this._canvasBinding = createBoundCanvas(this._cell, size({ width: 16, height: 16 }));
        this._canvasBinding.subscribeSuggestedBitmapSizeChanged(this._canvasSuggestedBitmapSizeChangedHandler);
    }
    destroy() {
        this._canvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._canvasSuggestedBitmapSizeChangedHandler);
        releaseCanvas(this._canvasBinding.canvasElement);
        this._canvasBinding.dispose();
    }
    getElement() {
        return this._cell;
    }
    getSize() {
        return this._size;
    }
    setSize(newSize) {
        if (!equalSizes(this._size, newSize)) {
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
        const target = tryCreateCanvasRenderingTarget2D(this._canvasBinding);
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
        clearRect(ctx, 0, 0, bitmapSize.width, bitmapSize.height, this._bottomColor());
    }
}
