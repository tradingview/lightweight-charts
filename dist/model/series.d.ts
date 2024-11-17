import { IPriceFormatter } from '../formatters/iprice-formatter';
import { IDestroyable } from '../helpers/idestroyable';
import { IPaneView } from '../views/pane/ipane-view';
import { IPriceAxisView } from '../views/price-axis/iprice-axis-view';
import { ITimeAxisView } from '../views/time-axis/itime-axis-view';
import { AutoscaleInfoImpl } from './autoscale-info-impl';
import { BarPrice, BarPrices } from './bar';
import { BoxOptions } from './box-options';
import { IChartModelBase } from './chart-model';
import { Coordinate } from './coordinate';
import { CustomBox } from './custom-box';
import { CustomPriceLine } from './custom-price-line';
import { CustomData, CustomSeriesWhitespaceData, ICustomSeriesPaneView, WhitespaceCheck } from './icustom-series';
import { InternalHorzScaleItem } from './ihorz-scale-behavior';
import { FirstValue, IPriceDataSource } from './iprice-data-source';
import { ISeriesPrimitiveBase, PrimitiveHoveredItem, SeriesPrimitivePaneViewZOrder } from './iseries-primitive';
import { Pane } from './pane';
import { PriceDataSource } from './price-data-source';
import { PriceLineOptions } from './price-line-options';
import { PriceScale } from './price-scale';
import { ISeriesBarColorer, SeriesBarColorer } from './series-bar-colorer';
import { SeriesPlotList, SeriesPlotRow } from './series-data';
import { InternalSeriesMarker, SeriesMarker } from './series-markers';
import { SeriesOptionsMap, SeriesPartialOptionsMap, SeriesType } from './series-options';
import { TimePointIndex } from './time-data';
type CustomDataToPlotRowValueConverter<HorzScaleItem> = (item: CustomData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>) => number[];
export interface LastValueDataResultWithoutData {
    noData: true;
}
export interface LastValueDataResultWithData {
    noData: false;
    price: number;
    text: string;
    formattedPriceAbsolute: string;
    formattedPricePercentage: string;
    color: string;
    coordinate: Coordinate;
    index: TimePointIndex;
}
export type LastValueDataResult = LastValueDataResultWithoutData | LastValueDataResultWithData;
export interface MarkerData {
    price: BarPrice;
    radius: number;
    borderColor: string | null;
    borderWidth: number;
    backgroundColor: string;
}
export interface SeriesDataAtTypeMap {
    Bar: BarPrices;
    Candlestick: BarPrices;
    Area: BarPrice;
    Baseline: BarPrice;
    Line: BarPrice;
    Histogram: BarPrice;
    Custom: BarPrice;
}
export interface SeriesUpdateInfo {
    lastBarUpdatedOrNewBarsAddedToTheRight: boolean;
}
export type SeriesOptionsInternal<T extends SeriesType = SeriesType> = SeriesOptionsMap[T];
export type SeriesPartialOptionsInternal<T extends SeriesType = SeriesType> = SeriesPartialOptionsMap[T];
export interface ISeries<T extends SeriesType> extends IPriceDataSource {
    bars(): SeriesPlotList<T>;
    visible(): boolean;
    options(): Readonly<SeriesOptionsMap[T]>;
    title(): string;
    priceScale(): PriceScale;
    lastValueData(globalLast: boolean): LastValueDataResult;
    indexedMarkers(): InternalSeriesMarker<TimePointIndex>[];
    barColorer(): ISeriesBarColorer<T>;
    markerDataAtIndex(index: TimePointIndex): MarkerData | null;
    dataAt(time: TimePointIndex): SeriesDataAtTypeMap[SeriesType] | null;
}
export declare class Series<T extends SeriesType> extends PriceDataSource implements IDestroyable, ISeries<SeriesType> {
    private readonly _seriesType;
    private _data;
    private readonly _priceAxisViews;
    private readonly _panePriceAxisView;
    private _formatter;
    private readonly _priceLineView;
    private readonly _customPriceLines;
    private readonly _customBoxes;
    private readonly _baseHorizontalLineView;
    private _paneView;
    private readonly _lastPriceAnimationPaneView;
    private _barColorerCache;
    private readonly _options;
    private _markers;
    private _indexedMarkers;
    private _markersPaneView;
    private _animationTimeoutId;
    private _primitives;
    constructor(model: IChartModelBase, options: SeriesOptionsInternal<T>, seriesType: T, pane?: Pane, customPaneView?: ICustomSeriesPaneView<unknown>);
    destroy(): void;
    priceLineColor(lastBarColor: string): string;
    lastValueData(globalLast: boolean): LastValueDataResult;
    barColorer(): SeriesBarColorer<T>;
    options(): Readonly<SeriesOptionsMap[T]>;
    applyOptions(options: SeriesPartialOptionsInternal<T>): void;
    setData(data: readonly SeriesPlotRow<T>[], updateInfo?: SeriesUpdateInfo): void;
    setMarkers(data: readonly SeriesMarker<InternalHorzScaleItem>[]): void;
    markers(): readonly SeriesMarker<InternalHorzScaleItem>[];
    indexedMarkers(): InternalSeriesMarker<TimePointIndex>[];
    createPriceLine(options: PriceLineOptions): CustomPriceLine;
    removePriceLine(line: CustomPriceLine): void;
    createBox(options: BoxOptions): CustomBox;
    removeBox(box: CustomBox): void;
    seriesType(): T;
    firstValue(): FirstValue | null;
    firstBar(): SeriesPlotRow<T> | null;
    bars(): SeriesPlotList<T>;
    dataAt(time: TimePointIndex): SeriesDataAtTypeMap[SeriesType] | null;
    topPaneViews(pane: Pane): readonly IPaneView[];
    paneViews(): readonly IPaneView[];
    bottomPaneViews(): readonly IPaneView[];
    pricePaneViews(zOrder: SeriesPrimitivePaneViewZOrder): readonly IPaneView[];
    timePaneViews(zOrder: SeriesPrimitivePaneViewZOrder): readonly IPaneView[];
    primitiveHitTest(x: Coordinate, y: Coordinate): PrimitiveHoveredItem[];
    labelPaneViews(pane?: Pane): readonly IPaneView[];
    priceAxisViews(pane: Pane, priceScale: PriceScale): readonly IPriceAxisView[];
    timeAxisViews(): readonly ITimeAxisView[];
    autoscaleInfo(startTimePoint: TimePointIndex, endTimePoint: TimePointIndex): AutoscaleInfoImpl | null;
    minMove(): number;
    formatter(): IPriceFormatter;
    updateAllViews(): void;
    priceScale(): PriceScale;
    markerDataAtIndex(index: TimePointIndex): MarkerData | null;
    title(): string;
    visible(): boolean;
    attachPrimitive(primitive: ISeriesPrimitiveBase): void;
    detachPrimitive(source: ISeriesPrimitiveBase): void;
    customSeriesPlotValuesBuilder(): CustomDataToPlotRowValueConverter<unknown> | undefined;
    customSeriesWhitespaceCheck<HorzScaleItem>(): WhitespaceCheck<HorzScaleItem> | undefined;
    private _isOverlay;
    private _autoscaleInfoImpl;
    private _markerRadius;
    private _markerBorderColor;
    private _markerBorderWidth;
    private _markerBackgroundColor;
    private _recreateFormatter;
    private _recalculateMarkers;
    private _recreatePaneViews;
    private _extractPaneViews;
}
export {};
