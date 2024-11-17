import { Size } from 'fancy-canvas';
import { IDestroyable } from '../helpers/idestroyable';
import { ChartOptionsBase } from '../model/chart-model';
import { InvalidationLevel } from '../model/invalidate-mask';
import { PriceAxisRendererOptionsProvider } from '../renderers/price-axis-renderer-options-provider';
import { PriceAxisWidgetSide } from './price-axis-widget';
export interface PriceAxisStubParams {
    rendererOptionsProvider: PriceAxisRendererOptionsProvider;
}
export type BorderVisibleGetter = () => boolean;
export type ColorGetter = () => string;
export declare class PriceAxisStub implements IDestroyable {
    private readonly _cell;
    private readonly _canvasBinding;
    private readonly _rendererOptionsProvider;
    private _options;
    private _invalidated;
    private readonly _isLeft;
    private _size;
    private readonly _borderVisible;
    private readonly _bottomColor;
    constructor(side: PriceAxisWidgetSide, options: ChartOptionsBase, params: PriceAxisStubParams, borderVisible: BorderVisibleGetter, bottomColor: ColorGetter);
    destroy(): void;
    getElement(): HTMLElement;
    getSize(): Size;
    setSize(newSize: Size): void;
    paint(type: InvalidationLevel): void;
    getBitmapSize(): Size;
    drawBitmap(ctx: CanvasRenderingContext2D, x: number, y: number): void;
    private _drawBorder;
    private _drawBackground;
    private readonly _canvasSuggestedBitmapSizeChangedHandler;
}
