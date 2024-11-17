import { ChartModel } from '../../model/chart-model';
import { Time } from '../../model/horz-scale-behavior-time/types';
import { Series } from '../../model/series';
import { SeriesType } from '../../model/series-options';
import { BoxRenderer, BoxRendererData } from '../../renderers/box-renderer';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { IPaneView } from './ipane-view';
export declare abstract class SeriesBoxPaneView implements IPaneView {
    protected readonly _boxRendererData: BoxRendererData;
    protected readonly _series: Series<SeriesType>;
    protected readonly _model: ChartModel<Time>;
    protected readonly _boxRenderer: BoxRenderer;
    private _invalidated;
    protected constructor(series: Series<SeriesType>);
    update(): void;
    renderer(): IPaneRenderer | null;
    protected abstract _updateImpl(): void;
}
