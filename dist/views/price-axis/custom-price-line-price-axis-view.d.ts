import { CustomPriceLine } from '../../model/custom-price-line';
import { ISeries } from '../../model/series';
import { SeriesType } from '../../model/series-options';
import { PriceAxisViewRendererCommonData, PriceAxisViewRendererData } from '../../renderers/iprice-axis-view-renderer';
import { PriceAxisView } from './price-axis-view';
export declare class CustomPriceLinePriceAxisView extends PriceAxisView {
    private readonly _series;
    private readonly _priceLine;
    constructor(series: ISeries<SeriesType>, priceLine: CustomPriceLine);
    protected _updateRendererData(axisRendererData: PriceAxisViewRendererData, paneRendererData: PriceAxisViewRendererData, commonData: PriceAxisViewRendererCommonData): void;
    private _formatPrice;
}
