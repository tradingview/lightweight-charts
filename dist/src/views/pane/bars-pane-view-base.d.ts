import { IChartModelBase } from '../../model/chart-model';
import { PriceScale } from '../../model/price-scale';
import { ISeries } from '../../model/series';
import { ISeriesBarColorer } from '../../model/series-bar-colorer';
import { SeriesPlotRow } from '../../model/series-data';
import { TimePointIndex } from '../../model/time-data';
import { ITimeScale } from '../../model/time-scale';
import { BarCandlestickItemBase } from '../../renderers/bars-renderer';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { SeriesPaneViewBase } from './series-pane-view-base';
export declare abstract class BarsPaneViewBase<TSeriesType extends 'Bar' | 'Candlestick', ItemType extends BarCandlestickItemBase, TRenderer extends IPaneRenderer> extends SeriesPaneViewBase<TSeriesType, ItemType, TRenderer> {
    constructor(series: ISeries<TSeriesType>, model: IChartModelBase);
    protected _convertToCoordinates(priceScale: PriceScale, timeScale: ITimeScale, firstValue: number): void;
    protected abstract _createRawItem(time: TimePointIndex, bar: SeriesPlotRow<TSeriesType>, colorer: ISeriesBarColorer<TSeriesType>): ItemType;
    protected _createDefaultItem(time: TimePointIndex, bar: SeriesPlotRow<TSeriesType>, colorer: ISeriesBarColorer<TSeriesType>): BarCandlestickItemBase;
    protected _fillRawPoints(): void;
}
