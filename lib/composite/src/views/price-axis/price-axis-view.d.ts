import { PriceScale } from '../../model/price-scale';
import { IPriceAxisViewRenderer, IPriceAxisViewRendererConstructor, PriceAxisViewRendererCommonData, PriceAxisViewRendererData, PriceAxisViewRendererOptions } from '../../renderers/iprice-axis-view-renderer';
import { IPriceAxisView } from './iprice-axis-view';
export declare abstract class PriceAxisView implements IPriceAxisView {
    private readonly _commonRendererData;
    private readonly _axisRendererData;
    private readonly _paneRendererData;
    private readonly _axisRenderer;
    private readonly _paneRenderer;
    private _invalidated;
    constructor(ctor?: IPriceAxisViewRendererConstructor);
    text(): string;
    coordinate(): number;
    update(): void;
    height(rendererOptions: PriceAxisViewRendererOptions, useSecondLine?: boolean): number;
    getFixedCoordinate(): number;
    setFixedCoordinate(value: number): void;
    isVisible(): boolean;
    isAxisLabelVisible(): boolean;
    renderer(priceScale: PriceScale): IPriceAxisViewRenderer;
    paneRenderer(): IPriceAxisViewRenderer;
    protected abstract _updateRendererData(axisRendererData: PriceAxisViewRendererData, paneRendererData: PriceAxisViewRendererData, commonData: PriceAxisViewRendererCommonData): void;
    private _updateRendererDataIfNeeded;
}
