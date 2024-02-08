import { equalSizes, size, tryCreateCanvasRenderingTarget2D, } from 'fancy-canvas';
import { clearRect } from '../helpers/canvas-helpers';
import { createBoundCanvas, releaseCanvas } from './canvas-utils';
export class PriceAxisStub {
    constructor(side, options, params, borderVisible, bottomColor) {
        this._private__invalidated = true;
        this._private__size = size({ width: 0, height: 0 });
        this._private__canvasSuggestedBitmapSizeChangedHandler = () => this._internal_paint(3 /* InvalidationLevel.Full */);
        this._private__isLeft = side === 'left';
        this._private__rendererOptionsProvider = params._internal_rendererOptionsProvider;
        this._private__options = options;
        this._private__borderVisible = borderVisible;
        this._private__bottomColor = bottomColor;
        this._private__cell = document.createElement('div');
        this._private__cell.style.width = '25px';
        this._private__cell.style.height = '100%';
        this._private__cell.style.overflow = 'hidden';
        this._private__canvasBinding = createBoundCanvas(this._private__cell, size({ width: 16, height: 16 }));
        this._private__canvasBinding.subscribeSuggestedBitmapSizeChanged(this._private__canvasSuggestedBitmapSizeChangedHandler);
    }
    _internal_destroy() {
        this._private__canvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._private__canvasSuggestedBitmapSizeChangedHandler);
        releaseCanvas(this._private__canvasBinding.canvasElement);
        this._private__canvasBinding.dispose();
    }
    _internal_getElement() {
        return this._private__cell;
    }
    _internal_getSize() {
        return this._private__size;
    }
    _internal_setSize(newSize) {
        if (!equalSizes(this._private__size, newSize)) {
            this._private__size = newSize;
            this._private__canvasBinding.resizeCanvasElement(newSize);
            this._private__cell.style.width = `${newSize.width}px`;
            this._private__cell.style.height = `${newSize.height}px`;
            this._private__invalidated = true;
        }
    }
    _internal_paint(type) {
        if (type < 3 /* InvalidationLevel.Full */ && !this._private__invalidated) {
            return;
        }
        if (this._private__size.width === 0 || this._private__size.height === 0) {
            return;
        }
        this._private__invalidated = false;
        this._private__canvasBinding.applySuggestedBitmapSize();
        const target = tryCreateCanvasRenderingTarget2D(this._private__canvasBinding);
        if (target !== null) {
            target.useBitmapCoordinateSpace((scope) => {
                this._private__drawBackground(scope);
                this._private__drawBorder(scope);
            });
        }
    }
    _internal_getBitmapSize() {
        return this._private__canvasBinding.bitmapSize;
    }
    _internal_drawBitmap(ctx, x, y) {
        const bitmapSize = this._internal_getBitmapSize();
        if (bitmapSize.width > 0 && bitmapSize.height > 0) {
            ctx.drawImage(this._private__canvasBinding.canvasElement, x, y);
        }
    }
    _private__drawBorder({ context: ctx, bitmapSize, horizontalPixelRatio, verticalPixelRatio }) {
        if (!this._private__borderVisible()) {
            return;
        }
        ctx.fillStyle = this._private__options.timeScale.borderColor;
        const horzBorderSize = Math.floor(this._private__rendererOptionsProvider._internal_options()._internal_borderSize * horizontalPixelRatio);
        const vertBorderSize = Math.floor(this._private__rendererOptionsProvider._internal_options()._internal_borderSize * verticalPixelRatio);
        const left = (this._private__isLeft) ? bitmapSize.width - horzBorderSize : 0;
        ctx.fillRect(left, 0, horzBorderSize, vertBorderSize);
    }
    _private__drawBackground({ context: ctx, bitmapSize }) {
        clearRect(ctx, 0, 0, bitmapSize.width, bitmapSize.height, this._private__bottomColor());
    }
}
