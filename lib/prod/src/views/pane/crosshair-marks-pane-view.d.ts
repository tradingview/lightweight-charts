import { IChartModelBase } from '../../model/chart-model';
import { Crosshair } from '../../model/crosshair';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { IUpdatablePaneView, UpdateType } from './iupdatable-pane-view';
export declare class CrosshairMarksPaneView implements IUpdatablePaneView {
    private readonly _chartModel;
    private readonly _crosshair;
    private readonly _compositeRenderer;
    private _markersRenderers;
    private _markersData;
    private _invalidated;
    constructor(chartModel: IChartModelBase, crosshair: Crosshair);
    update(updateType?: UpdateType): void;
    renderer(): IPaneRenderer | null;
    private _updateImpl;
}
