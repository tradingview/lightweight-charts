import { AutoScaleMargins } from '../../model/autoscale-info-impl';
import { IChartModelBase } from '../../model/chart-model';
import { ISeries } from '../../model/series';
import { SeriesMarkerPosition } from '../../model/series-markers';
import { SeriesType } from '../../model/series-options';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { IUpdatablePaneView, UpdateType } from './iupdatable-pane-view';
type MarkerPositions = Record<SeriesMarkerPosition, boolean>;
export declare class SeriesMarkersPaneView implements IUpdatablePaneView {
    private readonly _series;
    private readonly _model;
    private _data;
    private _invalidated;
    private _dataInvalidated;
    private _autoScaleMarginsInvalidated;
    private _autoScaleMargins;
    private _markersPositions;
    private _renderer;
    constructor(series: ISeries<SeriesType>, model: IChartModelBase);
    update(updateType?: UpdateType): void;
    renderer(addAnchors?: boolean): IPaneRenderer | null;
    autoScaleMargins(): AutoScaleMargins | null;
    protected _getMarkerPositions(): MarkerPositions;
    protected _makeValid(): void;
}
export {};
