import { DeepPartial } from '../helpers/strict-type-checks';

import { ChartOptions } from '../model/chart-model';
import { CustomPriceLine } from '../model/custom-price-line';
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
import { Logical, Time } from '../model/time-data';
import { TouchMouseEventData } from '../model/touch-mouse-event-data';

import { BarData, HistogramData, LineData, WhitespaceData } from './data-consumer';
import { IPriceScaleApi } from './iprice-scale-api';
import { ISeriesApi } from './iseries-api';
import { ITimeScaleApi } from './itime-scale-api';

/**
 * Represents a mouse event.
 */
export interface MouseEventParams {
	/**
	 * Time of the data at the location of the mouse event.
	 *
	 * The value will be `undefined` if the location of the event in the chart is outside the range of available data.
	 */
	time?: Time;
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
	seriesData: Map<ISeriesApi<SeriesType>, BarData | LineData | HistogramData | CustomData>;
	/**
	 * The {@link ISeriesApi} for the series at the point of the mouse event.
	 */
	hoveredSeries?: ISeriesApi<SeriesType>;
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
export type MouseEventHandler = (param: MouseEventParams) => void;

export interface CustomPriceLineClickedEventParams {
	customPriceLine: CustomPriceLine;
}

export type CustomPriceLineClickedEventHandler = (param: CustomPriceLineClickedEventParams) => void;

export interface CustomPriceLineDraggedEventParams {
	customPriceLine: CustomPriceLine;
	fromPriceString: string;
}

export type CustomPriceLineDraggedEventHandler = (param: CustomPriceLineDraggedEventParams) => void;

/**
 * The main interface of a single chart.
 */
export interface IChartApi {
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
		TData extends CustomData,
		TOptions extends CustomSeriesOptions,
		TPartialOptions extends SeriesPartialOptions<TOptions> = SeriesPartialOptions<TOptions>
	>(
		customPaneView: ICustomSeriesPaneView<TData, TOptions>,
		customOptions?: SeriesPartialOptions<TOptions>
	): ISeriesApi<'Custom', TData | WhitespaceData, TOptions, TPartialOptions>;

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
	addAreaSeries(areaOptions?: AreaSeriesPartialOptions): ISeriesApi<'Area'>;

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
	addBaselineSeries(baselineOptions?: BaselineSeriesPartialOptions): ISeriesApi<'Baseline'>;

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
	addBarSeries(barOptions?: BarSeriesPartialOptions): ISeriesApi<'Bar'>;

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
	addCandlestickSeries(candlestickOptions?: CandlestickSeriesPartialOptions): ISeriesApi<'Candlestick'>;

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
	addHistogramSeries(histogramOptions?: HistogramSeriesPartialOptions): ISeriesApi<'Histogram'>;

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
	addLineSeries(lineOptions?: LineSeriesPartialOptions): ISeriesApi<'Line'>;

	/**
	 * Removes a series of any type. This is an irreversible operation, you cannot do anything with the series after removing it.
	 *
	 * @example
	 * ```js
	 * chart.removeSeries(series);
	 * ```
	 */
	removeSeries(seriesApi: ISeriesApi<SeriesType>): void;

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
	subscribeClick(handler: MouseEventHandler): void;

	/**
	 * Unsubscribe a handler that was previously subscribed using {@link subscribeClick}.
	 *
	 * @param handler - Previously subscribed handler
	 * @example
	 * ```js
	 * chart.unsubscribeClick(myClickHandler);
	 * ```
	 */
	unsubscribeClick(handler: MouseEventHandler): void;

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
	subscribeCrosshairMove(handler: MouseEventHandler): void;

	/**
	 * Unsubscribe a handler that was previously subscribed using {@link subscribeCrosshairMove}.
	 *
	 * @param handler - Previously subscribed handler
	 * @example
	 * ```js
	 * chart.unsubscribeCrosshairMove(myCrosshairMoveHandler);
	 * ```
	 */
	unsubscribeCrosshairMove(handler: MouseEventHandler): void;

    /**
	 * Adds a subscription to receive notifications on custom price lines being dragged
	 *
	 * @param handler - handler (function) to be called on dragged
	 */
	subscribeCustomPriceLineDragged(handler: CustomPriceLineDraggedEventHandler): void;

	/**
	 * Removes custom price line dragged subscription
	 *
	 * @param handler - previously subscribed handler
	 */
	unsubscribeCustomPriceLineDragged(handler: CustomPriceLineDraggedEventHandler): void;

    /**
	 * Adds a subscription to receive notifications on custom price close icon clicked
	 *
	 * @param handler - handler (function) to be called on dragged
	 */
	subscribeCustomPriceLineCloseClicked(handler: CustomPriceLineClickedEventHandler): void;

	/**
	 * Removes custom price line close click subscription
	 *
	 * @param handler - previously subscribed handler
	 */
	unsubscribeCustomPriceLineCloseClicked(handler: CustomPriceLineClickedEventHandler): void;

     /**
	 * Adds a subscription to receive notifications on add button click
	 *
	 * @param handler - handler (function) to be called on dragged
	 */
	subscribeAddButtonClicked(handler: MouseEventHandler): void;

      /**
       * Removes add button click subscription
       *
       * @param handler - previously subscribed handler
       */
	unsubscribeAddButtonClicked(handler: MouseEventHandler): void;

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
	timeScale(): ITimeScaleApi;

	/**
	 * Applies new options to the chart
	 *
	 * @param options - Any subset of options.
	 */
	applyOptions(options: DeepPartial<ChartOptions>): void;

	/**
	 * Returns currently applied options
	 *
	 * @returns Full set of currently applied options, including defaults
	 */
	options(): Readonly<ChartOptions>;

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
}
