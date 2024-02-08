import { CanvasRenderingTarget2D } from 'fancy-canvas';
import { TextWidthCache } from '../model/text-width-cache';
import { IPriceAxisViewRenderer, PriceAxisViewRendererCommonData, PriceAxisViewRendererData, PriceAxisViewRendererOptions } from './iprice-axis-view-renderer';
export declare class PriceAxisViewRenderer implements IPriceAxisViewRenderer {
    private _data;
    private _commonData;
    constructor(data: PriceAxisViewRendererData, commonData: PriceAxisViewRendererCommonData);
    setData(data: PriceAxisViewRendererData, commonData: PriceAxisViewRendererCommonData): void;
    height(rendererOptions: PriceAxisViewRendererOptions, useSecondLine: boolean): number;
    draw(target: CanvasRenderingTarget2D, rendererOptions: PriceAxisViewRendererOptions, textWidthCache: TextWidthCache, align: 'left' | 'right'): void;
    private _calculateGeometry;
}
