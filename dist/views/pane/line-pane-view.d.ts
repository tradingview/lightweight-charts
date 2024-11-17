import { BarPrice } from '../../model/bar';
import { ISeriesBarColorer } from '../../model/series-bar-colorer';
import { TimePointIndex } from '../../model/time-data';
import { LineStrokeItem, PaneRendererLine } from '../../renderers/line-renderer';
import { LinePaneViewBase } from './line-pane-view-base';
export declare class SeriesLinePaneView extends LinePaneViewBase<'Line', LineStrokeItem, PaneRendererLine> {
    protected readonly _renderer: PaneRendererLine;
    protected _createRawItem(time: TimePointIndex, price: BarPrice, colorer: ISeriesBarColorer<'Line'>): LineStrokeItem;
    protected _prepareRendererData(): void;
}
