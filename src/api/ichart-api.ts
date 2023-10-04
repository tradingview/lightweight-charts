import { DeepPartial } from '../helpers/strict-type-checks';

import { ChartOptionsImpl } from '../model/chart-model';
import { BarData, HistogramData, LineData, WhitespaceData } from '../model/data-consumer';
import { Time } from '../model/horz-scale-behavior-time/types';
import { CustomData, ICustomSeriesPaneView } from '../model/icustom-series';
import { Point } from '../model/point';
import {
	AreaSeriesPartialOptions,
	BarSeriesPartialOptions,
	BaselineSeriesPartialOptions,
	CandlestickSeriesPartialOptions,
	CustomSeriesOptions,
	HistogramSeriesPartialOptions,
	LineSeriesPartialOptions,
	SeriesPartialOptions,
	SeriesType,
} from '../model/series-options';
import { Logical } from '../model/time-data';
import { TouchMouseEventData } from '../model/touch-mouse-event-data';

import { IPriceScaleApi } from './iprice-scale-api';
import { ISeriesApi } from './iseries-api';
import { ITimeScaleApi } from './itime-scale-api';

/**
 * Dimensions of the Chart Pane
 * (the main chart area which excludes the time and price scales).
 */
export interface PaneSize {
	/** Height of the Chart Pane (pixels) */
	height: number;
	/** Width of the Chart Pane (pixels) */
	width: number;
}

/**
 * Represents a mouse event.
 */
export interface MouseEventParams<HorzScaleItem = Time> {
	/**
	 * Time of the data at the location of the mouse event.
	 *
	 * The value will be `undefined` if the location of the event in the chart is outside the range of available data.
	 */
	time?: HorzScaleItem;
	/**
	 * Logical index
	 */
	logical?: Logical;
	/**
	 * Location of the event in the chart.
	 *
	 * The value will be `undefined` if the event is fired outside the chart, for example a mouse leave event.
	 */
	point?: Point;
	/**
	 * Data of all series at the location of the event in the chart.
	 *
	 * Keys of the map are {@link ISeriesApi} instances. Values are prices.
	 * Values of the map are original data items
	 */
	seriesData: Map<ISeriesApi<SeriesType, HorzScaleItem>, BarData<HorzScaleItem> | LineData<HorzScaleItem> | HistogramData<HorzScaleItem> | CustomData<HorzScaleItem>>;
	/**
	 * The {@link ISeriesApi} for the series at the point of the mouse event.
	 */
	hoveredSeries?: ISeriesApi<SeriesType, HorzScaleItem>;
	/**
	 * The ID of the object at the point of the mouse event.
	 */
	hoveredObjectId?: unknown;
	/**
	 * The underlying source mouse or touch event data, if available
	 */
	sourceEvent?: TouchMouseEventData;
}

/**
 * A custom function use to handle mouse events.
 */
export type MouseEventHandler<HorzScaleItem> = (param: MouseEventParams<HorzScaleItem>) => void;

/**
 * The main interface of a single chart.
 */
export interface IChartApiBase<HorzScaleItem = Time> {
	/**
	 * Removes the chart object including all DOM elements. This is an irreversible operation, you cannot do anything with the chart after removing it.
	 */
	remove(): void;

	/**
	 * Sets fixed size of the chart. By default chart takes up 100% of its container.
	 *
	 * If chart has the `autoSize` option enabled, and the ResizeObserver is available then
	 * the width and height values will be ignored.
	 *
	 * @param width - Target width of the chart.
	 * @param height - Target height of the chart.
	 * @param forceRepaint - True to initiate resize immediately. One could need this to get screenshot immediately after resize.
	 */
	resize(width: number, height: number, forceRepaint?: boolean): void;

	/**
	 * Creates a custom series with specified parameters.
	 *
	 * A custom series is a generic series which can be extended with a custom renderer to
	 * implement chart types which the library doesn't support by default.
	 *
	 * @param customPaneView - A custom series pane view which implements the custom renderer.
	 * @param customOptions - Customization parameters of the series being created.
	 * ```js
	 * const series = chart.addCustomSeries(myCustomPaneView);
	 * ```
	 */
	addCustomSeries<
		TData extends CustomData<HorzScaleItem>,
		TOptions extends CustomSeriesOptions,
		TPartialOptions extends SeriesPartialOptions<TOptions> = SeriesPartialOptions<TOptions>
	>(
		customPaneView: ICustomSeriesPaneView<HorzScaleItem, TData, TOptions>,
		customOptions?: SeriesPartialOptions<TOptions>
	): ISeriesApi<'Custom', HorzScaleItem, TData | WhitespaceData<HorzScaleItem>, TOptions, TPartialOptions>;

	/**
	 * Creates an area series with specified parameters.
	 *
	 * @param areaOptions - Customization parameters of the series being created.
	 * @returns An interface of the created series.
	 * @example
	 * ```js
	 * const series = chart.addAreaSeries();
	 * ```
	 */
	addAreaSeries(areaOptions?: AreaSeriesPartialOptions): ISeriesApi<'Area', HorzScaleItem>;

	/**
	 * Creates a baseline series with specified parameters.
	 *
	 * @param baselineOptions - Customization parameters of the series being created.
	 * @returns An interface of the created series.
	 * @example
	 * ```js
	 * const series = chart.addBaselineSeries();
	 * ```
	 */
	addBaselineSeries(baselineOptions?: BaselineSeriesPartialOptions): ISeriesApi<'Baseline', HorzScaleItem>;

	/**
	 * Creates a bar series with specified parameters.
	 *
	 * @param barOptions - Customization parameters of the series being created.
	 * @returns An interface of the created series.
	 * @example
	 * ```js
	 * const series = chart.addBarSeries();
	 * ```
	 */
	addBarSeries(barOptions?: BarSeriesPartialOptions): ISeriesApi<'Bar', HorzScaleItem>;

	/**
	 * Creates a candlestick series with specified parameters.
	 *
	 * @param candlestickOptions - Customization parameters of the series being created.
	 * @returns An interface of the created series.
	 * @example
	 * ```js
	 * const series = chart.addCandlestickSeries();
	 * ```
	 */
	addCandlestickSeries(candlestickOptions?: CandlestickSeriesPartialOptions): ISeriesApi<'Candlestick', HorzScaleItem>;

	/**
	 * Creates a histogram series with specified parameters.
	 *
	 * @param histogramOptions - Customization parameters of the series being created.
	 * @returns An interface of the created series.
	 * @example
	 * ```js
	 * const series = chart.addHistogramSeries();
	 * ```
	 */
	addHistogramSeries(histogramOptions?: HistogramSeriesPartialOptions): ISeriesApi<'Histogram', HorzScaleItem>;

	/**
	 * Creates a line series with specified parameters.
	 *
	 * @param lineOptions - Customization parameters of the series being created.
	 * @returns An interface of the created series.
	 * @example
	 * ```js
	 * const series = chart.addLineSeries();
	 * ```
	 */
	addLineSeries(lineOptions?: LineSeriesPartialOptions): ISeriesApi<'Line', HorzScaleItem>;

	/**
	 * Removes a series of any type. This is an irreversible operation, you cannot do anything with the series after removing it.
	 *
	 * @example
	 * ```js
	 * chart.removeSeries(series);
	 * ```
	 */
	removeSeries(seriesApi: ISeriesApi<SeriesType, HorzScaleItem>): void;

	/**
	 * Subscribe to the chart click event.
	 *
	 * @param handler - Handler to be called on mouse click.
	 * @example
	 * ```js
	 * function myClickHandler(param) {
	 *     if (!param.point) {
	 *         return;
	 *     }
	 *
	 *     console.log(`Click at ${param.point.x}, ${param.point.y}. The time is ${param.time}.`);
	 * }
	 *
	 * chart.subscribeClick(myClickHandler);
	 * ```
	 */
	subscribeClick(handler: MouseEventHandler<HorzScaleItem>): void;

	/**
	 * Unsubscribe a handler that was previously subscribed using {@link subscribeClick}.
	 *
	 * @param handler - Previously subscribed handler
	 * @example
	 * ```js
	 * chart.unsubscribeClick(myClickHandler);
	 * ```
	 */
	unsubscribeClick(handler: MouseEventHandler<HorzScaleItem>): void;

	/**
	 * Subscribe to the chart double-click event.
	 *
	 * @param handler - Handler to be called on mouse double-click.
	 * @example
	 * ```js
	 * function myDblClickHandler(param) {
	 *     if (!param.point) {
	 *         return;
	 *     }
	 *
	 *     console.log(`Double Click at ${param.point.x}, ${param.point.y}. The time is ${param.time}.`);
	 * }
	 *
	 * chart.subscribeDblClick(myDblClickHandler);
	 * ```
	 */
	subscribeDblClick(handler: MouseEventHandler<HorzScaleItem>): void;

	/**
	 * Unsubscribe a handler that was previously subscribed using {@link subscribeDblClick}.
	 *
	 * @param handler - Previously subscribed handler
	 * @example
	 * ```js
	 * chart.unsubscribeDblClick(myDblClickHandler);
	 * ```
	 */
	unsubscribeDblClick(handler: MouseEventHandler<HorzScaleItem>): void;

	/**
	 * Subscribe to the crosshair move event.
	 *
	 * @param handler - Handler to be called on crosshair move.
	 * @example
	 * ```js
	 * function myCrosshairMoveHandler(param) {
	 *     if (!param.point) {
	 *         return;
	 *     }
	 *
	 *     console.log(`Crosshair moved to ${param.point.x}, ${param.point.y}. The time is ${param.time}.`);
	 * }
	 *
	 * chart.subscribeCrosshairMove(myCrosshairMoveHandler);
	 * ```
	 */
	subscribeCrosshairMove(handler: MouseEventHandler<HorzScaleItem>): void;

	/**
	 * Unsubscribe a handler that was previously subscribed using {@link subscribeCrosshairMove}.
	 *
	 * @param handler - Previously subscribed handler
	 * @example
	 * ```js
	 * chart.unsubscribeCrosshairMove(myCrosshairMoveHandler);
	 * ```
	 */
	unsubscribeCrosshairMove(handler: MouseEventHandler<HorzScaleItem>): void;

	/**
	 * Returns API to manipulate a price scale.
	 *
	 * @param priceScaleId - ID of the price scale.
	 * @returns Price scale API.
	 */
	priceScale(priceScaleId: string): IPriceScaleApi;

	/**
	 * Returns API to manipulate the time scale
	 *
	 * @returns Target API
	 */
	timeScale(): ITimeScaleApi<HorzScaleItem>;

	/**
	 * Applies new options to the chart
	 *
	 * @param options - Any subset of options.
	 */
	applyOptions(options: DeepPartial<ChartOptionsImpl<HorzScaleItem>>): void;

	/**
	 * Returns currently applied options
	 *
	 * @returns Full set of currently applied options, including defaults
	 */
	options(): Readonly<ChartOptionsImpl<HorzScaleItem>>;

	/**
	 * Make a screenshot of the chart with all the elements excluding crosshair.
	 *
	 * @returns A canvas with the chart drawn on. Any `Canvas` methods like `toDataURL()` or `toBlob()` can be used to serialize the result.
	 */
	takeScreenshot(): HTMLCanvasElement;

	/**
	 * Returns the active state of the `autoSize` option. This can be used to check
	 * whether the chart is handling resizing automatically with a `ResizeObserver`.
	 *
	 * @returns Whether the `autoSize` option is enabled and the active.
	 */
	autoSizeActive(): boolean;

	/**
	 * Returns the generated div element containing the chart. This can be used for adding your own additional event listeners, or for measuring the
	 * elements dimensions and position within the document.
	 *
	 * @returns generated div element containing the chart.
	 */
	chartElement(): HTMLDivElement;

	/**
	 * Set the crosshair position within the chart.
	 *
	 * Usually the crosshair position is set automatically by the user's actions. However in some cases you may want to set it explicitly.
	 *
	 * For example if you want to synchronise the crosshairs of two separate charts.
	 *
	 * @param price - The price (vertical coordinate) of the new crosshair position.
	 * @param horizontalPosition - The horizontal coordinate (time by default) of the new crosshair position.
	 */
	setCrosshairPosition(price: number, horizontalPosition: HorzScaleItem, seriesApi: ISeriesApi<SeriesType, HorzScaleItem>): void;

	/**
	 * Clear the crosshair position within the chart.
	 */
	clearCrosshairPosition(): void;

	/**
	 * Returns the dimensions of the chart pane (the plot surface which excludes time and price scales).
	 * This would typically only be useful for plugin development.
	 *
	 * @returns Dimensions of the chart pane
	 */
	paneSize(): PaneSize;
}
