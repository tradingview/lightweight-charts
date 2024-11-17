import { BarPrice } from '../../model/bar';
import { IChartModelBase } from '../../model/chart-model';
import { PricedValue, PriceScale } from '../../model/price-scale';
import { ISeries } from '../../model/series';
import { ISeriesBarColorer } from '../../model/series-bar-colorer';
import { TimedValue, TimePointIndex } from '../../model/time-data';
import { ITimeScale } from '../../model/time-scale';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { SeriesPaneViewBase } from './series-pane-view-base';
export declare abstract class LinePaneViewBase<TSeriesType extends 'Line' | 'Area' | 'Baseline' | 'Histogram', ItemType extends PricedValue & TimedValue, TRenderer extends IPaneRenderer> extends SeriesPaneViewBase<TSeriesType, ItemType, TRenderer> {
    constructor(series: ISeries<TSeriesType>, model: IChartModelBase);
    protected _convertToCoordinates(priceScale: PriceScale, timeScale: ITimeScale, firstValue: number): void;
    protected abstract _createRawItem(time: TimePointIndex, price: BarPrice, colorer: ISeriesBarColorer<TSeriesType>): ItemType;
    protected _createRawItemBase(time: TimePointIndex, price: BarPrice): PricedValue & TimedValue;
    protected _fillRawPoints(): void;
}
