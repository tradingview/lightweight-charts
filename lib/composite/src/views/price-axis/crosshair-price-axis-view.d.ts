import { Crosshair, CrosshairPriceAndCoordinate } from '../../model/crosshair';
import { PriceScale } from '../../model/price-scale';
import { PriceAxisViewRendererCommonData, PriceAxisViewRendererData } from '../../renderers/iprice-axis-view-renderer';
import { PriceAxisView } from './price-axis-view';
export type CrosshairPriceAxisViewValueProvider = (priceScale: PriceScale) => CrosshairPriceAndCoordinate;
export declare class CrosshairPriceAxisView extends PriceAxisView {
    private _source;
    private readonly _priceScale;
    private readonly _valueProvider;
    constructor(source: Crosshair, priceScale: PriceScale, valueProvider: CrosshairPriceAxisViewValueProvider);
    protected _updateRendererData(axisRendererData: PriceAxisViewRendererData, paneRendererData: PriceAxisViewRendererData, commonRendererData: PriceAxisViewRendererCommonData): void;
}
