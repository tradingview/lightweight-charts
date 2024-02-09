import { SeriesBarColorer } from '../../model/series-bar-colorer';
import { SeriesPlotRow } from '../../model/series-data';
import { TimePointIndex } from '../../model/time-data';
import { CandlestickItem, PaneRendererCandlesticks } from '../../renderers/candlesticks-renderer';
import { BarsPaneViewBase } from './bars-pane-view-base';
export declare class SeriesCandlesticksPaneView extends BarsPaneViewBase<'Candlestick', CandlestickItem, PaneRendererCandlesticks> {
    protected readonly _renderer: PaneRendererCandlesticks;
    protected _createRawItem(time: TimePointIndex, bar: SeriesPlotRow<'Candlestick'>, colorer: SeriesBarColorer<'Candlestick'>): CandlestickItem;
    protected _prepareRendererData(): void;
}
