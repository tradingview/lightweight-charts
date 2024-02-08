import { IChartModelBase } from '../model/chart-model';
import { PriceAxisViewRendererOptions } from './iprice-axis-view-renderer';
export declare class PriceAxisRendererOptionsProvider {
    private readonly _chartModel;
    private readonly _rendererOptions;
    constructor(chartModel: IChartModelBase);
    options(): Readonly<PriceAxisViewRendererOptions>;
    private _textColor;
    private _paneBackgroundColor;
    private _fontSize;
    private _fontFamily;
}
