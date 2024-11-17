import { SeriesBarColorer } from '../../model/series-bar-colorer';
import { SeriesPlotRow } from '../../model/series-data';
import { SeriesType } from '../../model/series-options';
import { TimePointIndex } from '../../model/time-data';
import { BarItem, PaneRendererBars } from '../../renderers/bars-renderer';
import { BarsPaneViewBase } from './bars-pane-view-base';
export declare class SeriesBarsPaneView extends BarsPaneViewBase<'Bar', BarItem, PaneRendererBars> {
    protected readonly _renderer: PaneRendererBars;
    protected _createRawItem(time: TimePointIndex, bar: SeriesPlotRow<SeriesType>, colorer: SeriesBarColorer<'Bar'>): BarItem;
    protected _prepareRendererData(): void;
}
