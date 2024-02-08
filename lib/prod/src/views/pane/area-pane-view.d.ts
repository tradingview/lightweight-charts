import { BarPrice } from '../../model/bar';
import { IChartModelBase } from '../../model/chart-model';
import { ISeries } from '../../model/series';
import { ISeriesBarColorer } from '../../model/series-bar-colorer';
import { TimePointIndex } from '../../model/time-data';
import { AreaFillItem } from '../../renderers/area-renderer';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { LineStrokeItem } from '../../renderers/line-renderer';
import { LinePaneViewBase } from './line-pane-view-base';
export declare class SeriesAreaPaneView extends LinePaneViewBase<'Area', AreaFillItem & LineStrokeItem, CompositeRenderer> {
    protected readonly _renderer: CompositeRenderer;
    private readonly _areaRenderer;
    private readonly _lineRenderer;
    constructor(series: ISeries<'Area'>, model: IChartModelBase);
    protected _createRawItem(time: TimePointIndex, price: BarPrice, colorer: ISeriesBarColorer<'Area'>): AreaFillItem & LineStrokeItem;
    protected _prepareRendererData(): void;
}
