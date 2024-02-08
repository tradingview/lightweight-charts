import { BarPrice } from '../../model/bar';
import { IChartModelBase } from '../../model/chart-model';
import { ISeries } from '../../model/series';
import { ISeriesBarColorer } from '../../model/series-bar-colorer';
import { TimePointIndex } from '../../model/time-data';
import { BaselineFillItem } from '../../renderers/baseline-renderer-area';
import { BaselineStrokeItem } from '../../renderers/baseline-renderer-line';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { LinePaneViewBase } from './line-pane-view-base';
export declare class SeriesBaselinePaneView extends LinePaneViewBase<'Baseline', BaselineFillItem & BaselineStrokeItem, CompositeRenderer> {
    protected readonly _renderer: CompositeRenderer;
    private readonly _baselineAreaRenderer;
    private readonly _baselineLineRenderer;
    constructor(series: ISeries<'Baseline'>, model: IChartModelBase);
    protected _createRawItem(time: TimePointIndex, price: BarPrice, colorer: ISeriesBarColorer<'Baseline'>): BaselineFillItem & BaselineStrokeItem;
    protected _prepareRendererData(): void;
}
