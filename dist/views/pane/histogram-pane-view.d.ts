import { BarPrice } from '../../model/bar';
import { ISeriesBarColorer } from '../../model/series-bar-colorer';
import { TimePointIndex } from '../../model/time-data';
import { HistogramItem, PaneRendererHistogram } from '../../renderers/histogram-renderer';
import { LinePaneViewBase } from './line-pane-view-base';
export declare class SeriesHistogramPaneView extends LinePaneViewBase<'Histogram', HistogramItem, PaneRendererHistogram> {
    protected readonly _renderer: PaneRendererHistogram;
    protected _createRawItem(time: TimePointIndex, price: BarPrice, colorer: ISeriesBarColorer<'Histogram'>): HistogramItem;
    protected _prepareRendererData(): void;
}
