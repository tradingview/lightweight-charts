import { IChartModelBase } from '../../model/chart-model';
import { ISeries } from '../../model/series';
import { SeriesType } from '../../model/series-options';
import { HorizontalLineRenderer, HorizontalLineRendererData } from '../../renderers/horizontal-line-renderer';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { IPaneView } from './ipane-view';
export declare abstract class SeriesHorizontalLinePaneView implements IPaneView {
    protected readonly _lineRendererData: HorizontalLineRendererData;
    protected readonly _series: ISeries<SeriesType>;
    protected readonly _model: IChartModelBase;
    protected readonly _lineRenderer: HorizontalLineRenderer;
    private _invalidated;
    protected constructor(series: ISeries<SeriesType>);
    update(): void;
    renderer(): IPaneRenderer | null;
    protected abstract _updateImpl(): void;
}
