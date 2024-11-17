import { IChartModelBase } from '../../model/chart-model';
import { Crosshair, TimeAndCoordinateProvider } from '../../model/crosshair';
import { TimeAxisViewRenderer } from '../../renderers/time-axis-view-renderer';
import { ITimeAxisView } from './itime-axis-view';
export declare class CrosshairTimeAxisView implements ITimeAxisView {
    private _invalidated;
    private readonly _crosshair;
    private readonly _model;
    private readonly _valueProvider;
    private readonly _renderer;
    private readonly _rendererData;
    constructor(crosshair: Crosshair, model: IChartModelBase, valueProvider: TimeAndCoordinateProvider);
    update(): void;
    renderer(): TimeAxisViewRenderer;
    private _updateImpl;
}
