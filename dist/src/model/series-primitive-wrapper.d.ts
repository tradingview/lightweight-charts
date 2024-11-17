import { IPaneView } from '../views/pane/ipane-view';
import { IPriceAxisView } from '../views/price-axis/iprice-axis-view';
import { ITimeAxisView } from '../views/time-axis/itime-axis-view';
import { Coordinate } from './coordinate';
import { ISeriesPrimitiveBase, PrimitiveHoveredItem, SeriesPrimitivePaneViewZOrder } from './iseries-primitive';
import { Series } from './series';
import { AutoscaleInfo, SeriesType } from './series-options';
import { TimePointIndex } from './time-data';
export interface ISeriesPrimitivePaneViewWrapper extends IPaneView {
    zOrder(): SeriesPrimitivePaneViewZOrder;
}
export declare class SeriesPrimitiveWrapper<TSeriesAttachedParameters = unknown> {
    private readonly _primitive;
    private readonly _series;
    private _paneViewsCache;
    private _timeAxisViewsCache;
    private _priceAxisViewsCache;
    private _priceAxisPaneViewsCache;
    private _timeAxisPaneViewsCache;
    constructor(primitive: ISeriesPrimitiveBase<TSeriesAttachedParameters>, series: Series<SeriesType>);
    primitive(): ISeriesPrimitiveBase<TSeriesAttachedParameters>;
    updateAllViews(): void;
    paneViews(): readonly ISeriesPrimitivePaneViewWrapper[];
    timeAxisViews(): readonly ITimeAxisView[];
    priceAxisViews(): readonly IPriceAxisView[];
    priceAxisPaneViews(): readonly ISeriesPrimitivePaneViewWrapper[];
    timeAxisPaneViews(): readonly ISeriesPrimitivePaneViewWrapper[];
    autoscaleInfo(startTimePoint: TimePointIndex, endTimePoint: TimePointIndex): AutoscaleInfo | null;
    hitTest(x: Coordinate, y: Coordinate): PrimitiveHoveredItem | null;
}
