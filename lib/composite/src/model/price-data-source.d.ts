import { IPriceFormatter } from '../formatters/iprice-formatter';
import { AutoscaleInfoImpl } from './autoscale-info-impl';
import { IChartModelBase } from './chart-model';
import { DataSource } from './data-source';
import { FirstValue, IPriceDataSource } from './iprice-data-source';
import { TimePointIndex } from './time-data';
export declare abstract class PriceDataSource extends DataSource implements IPriceDataSource {
    private readonly _model;
    constructor(model: IChartModelBase);
    model(): IChartModelBase;
    abstract minMove(): number;
    abstract autoscaleInfo(startTimePoint: TimePointIndex, endTimePoint: TimePointIndex): AutoscaleInfoImpl | null;
    abstract firstValue(): FirstValue | null;
    abstract formatter(): IPriceFormatter;
    abstract priceLineColor(lastBarColor: string): string;
}
