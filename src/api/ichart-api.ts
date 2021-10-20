import { DeepPartial } from '../helpers/strict-type-checks';

import { BarPrice, BarPrices } from '../model/bar';
import { ChartOptions } from '../model/chart-model';
import { Point } from '../model/point';
import { SeriesMarker } from '../model/series-markers';
import {
	AreaSeriesPartialOptions,
	BarSeriesPartialOptions,
	CandlestickSeriesPartialOptions,
	HistogramSeriesPartialOptions,
	LineSeriesPartialOptions,
	SeriesType,
} from '../model/series-options';
import { BusinessDay, UTCTimestamp } from '../model/time-data';

import { Time } from './data-consumer';
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
	time?: UTCTimestamp | BusinessDay;
	/**
	 * Location of the event in the chart.
	 *
	 * The value will be `undefined` if the event is fired outside the chart, for example a mouse leave event.
	 */
	point?: Point;
	/**
	 * Prices of all series at the location of the event in the chart.
	 *
	 * Keys of the map are {@link ISeriesApi} instances. Values are prices.
	 * Each price is a number for line, area, and histogram series or a OHLC object for candlestick and bar series.
	 */
	seriesPrices: Map<ISeriesApi<SeriesType>, BarPrice | BarPrices>;
	/**
	 * The {@link ISeriesApi} for the series at the point of the mouse event.
	 */
	hoveredSeries?: ISeriesApi<SeriesType>;
	/**
	 * The ID of the marker at the point of the mouse event.
	 */
	hoveredMarkerId?: SeriesMarker<Time>['id'];
}

/**
 * A custom function use to handle mouse events.
 */
export type MouseEventHandler = (param: MouseEventParams) => void;

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
	 * @param width - target width of the chart.
	 * @param height - target height of the chart.
	 * @param forceRepaint - true to initiate resize immediately. One could need this to get screenshot immediately after resize.
	 */
	resize(width: number, height: number, forceRepaint?: boolean): void;

	/**
	 * Creates an area series with specified parameters.
	 *
	 * @param areaOptions - customization parameters of the series being created.
	 * @returns an interface of the created series.
	 */
	addAreaSeries(areaOptions?: AreaSeriesPartialOptions): ISeriesApi<'Area'>;

	/**
	 * Creates a bar series with specified parameters.
	 *
	 * @param barOptions - customization parameters of the series being created.
	 * @returns an interface of the created series.
	 */
	addBarSeries(barOptions?: BarSeriesPartialOptions): ISeriesApi<'Bar'>;

	/**
	 * Creates a candlestick series with specified parameters.
	 *
	 * @param candlestickOptions - customization parameters of the series being created.
	 * @returns an interface of the created series.
	 */
	addCandlestickSeries(candlestickOptions?: CandlestickSeriesPartialOptions): ISeriesApi<'Candlestick'>;

	/**
	 * Creates a histogram series with specified parameters.
	 *
	 * @param histogramOptions - customization parameters of the series being created.
	 * @returns an interface of the created series.
	 */
	addHistogramSeries(histogramOptions?: HistogramSeriesPartialOptions): ISeriesApi<'Histogram'>;

	/**
	 * Creates a line series with specified parameters.
	 *
	 * @param lineOptions - customization parameters of the series being created.
	 * @returns an interface of the created series.
	 */
	addLineSeries(lineOptions?: LineSeriesPartialOptions): ISeriesApi<'Line'>;

	/**
	 * Removes a series of any type. This is an irreversible operation, you cannot do anything with the series after removing it
	 */
	removeSeries(seriesApi: ISeriesApi<SeriesType>): void;

	/**
	 * Subscribe to the chart click event.
	 *
	 * @param handler - handler to be called on mouse click.
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
	 * @param handler - previously subscribed handler
	 * @example
	 * ```js
	 * chart.unsubscribeClick(myClickHandler);
	 * ```
	 */
	unsubscribeClick(handler: MouseEventHandler): void;

	/**
	 * Subscribe to the crosshair move event.
	 *
	 * @param handler - handler to be called on crosshair move.
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
	 * chart.subscribeClick(myCrosshairMoveHandler);
	 * ```
	 */
	subscribeCrosshairMove(handler: MouseEventHandler): void;

	/**
	 * Unsubscribe a handler that was previously subscribed using {@link subscribeCrosshairMove}.
	 *
	 * @param handler - previously subscribed handler
	 * @example
	 * ```js
	 * chart.unsubscribeCrosshairMove(myCrosshairMoveHandler);
	 * ```
	 */
	unsubscribeCrosshairMove(handler: MouseEventHandler): void;

	/**
	 * Returns API to manipulate a price scale.
	 *
	 * @param priceScaleId - id of the price scale.
	 * @returns Price scale API.
	 */
	priceScale(priceScaleId?: string): IPriceScaleApi;

	/**
	 * Returns API to manipulate the time scale
	 *
	 * @returns target API
	 */
	timeScale(): ITimeScaleApi;

	/**
	 * Applies new options to the chart
	 *
	 * @param options - any subset of chart options
	 */
	applyOptions(options: DeepPartial<ChartOptions>): void;

	/**
	 * Returns currently applied options
	 *
	 * @returns full set of currently applied options, including defaults
	 */
	options(): Readonly<ChartOptions>;

	/**
	 * Make a screenshot of the chart with all the elements excluding crosshair.
	 *
	 * @returns a canvas with the chart drawn on
	 */
	takeScreenshot(): HTMLCanvasElement;
}
