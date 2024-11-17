import { IChartWidgetBase } from '../gui/chart-widget';
import { DeepPartial } from '../helpers/strict-type-checks';
import { PriceScaleOptions } from '../model/price-scale';
import { IPriceScaleApi } from './iprice-scale-api';
export declare class PriceScaleApi implements IPriceScaleApi {
    private _chartWidget;
    private readonly _priceScaleId;
    constructor(chartWidget: IChartWidgetBase, priceScaleId: string);
    applyOptions(options: DeepPartial<PriceScaleOptions>): void;
    options(): Readonly<PriceScaleOptions>;
    width(): number;
    private _priceScale;
}
