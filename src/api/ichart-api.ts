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

export interface MouseEventParams {
	time?: UTCTimestamp | BusinessDay;
	point?: Point;
	seriesPrices: Map<ISeriesApi<SeriesType>, BarPrice | BarPrices>;
	hoveredSeries?: ISeriesApi<SeriesType>;
	hoveredMarkerId?: SeriesMarker<Time>['id'];
}

export type MouseEventHandler = (param: MouseEventParams) => void;

 /*
 * The main interface of a single chart
 */
export interface IChartApi {
	/**
	 * Removes the chart object including all DOM elements. This is an irreversible operation, you cannot do anything with the chart after removing it.
	 */
	remove(): void;

	/**
	 * Sets fixed size of the chart. By default chart takes up 100% of its container
	 * @param width - target width of the chart
	 * @param height - target height of the chart
	 * @param forceRepaint - true to initiate resize immediately. One could need this to get screenshot immediately after resize
	 */
	resize(width: number, height: number, forceRepaint?: boolean): void;

	/**
	 * Creates an area series with specified parameters
	 * @param areaOptions - customization parameters of the series being created
	 * @returns an interface of the created series
	 */
	addAreaSeries(areaOptions?: AreaSeriesPartialOptions): ISeriesApi<'Area'>;

	/**
	 * Creates a bar series with specified parameters
	 * @param barOptions - customization parameters of the series being created
	 * @returns an interface of the created series
	 */
	addBarSeries(barOptions?: BarSeriesPartialOptions): ISeriesApi<'Bar'>;

	/**
	 * Creates a candlestick series with specified parameters
	 * @param candlestickOptions - customization parameters of the series being created
	 * @returns an interface of the created series
	 */
	addCandlestickSeries(candlestickOptions?: CandlestickSeriesPartialOptions): ISeriesApi<'Candlestick'>;

	/**
	 * Creates a histogram series with specified parameters
	 * @param histogramOptions - customization parameters of the series being created
	 * @returns an interface of the created series
	 */
	addHistogramSeries(histogramOptions?: HistogramSeriesPartialOptions): ISeriesApi<'Histogram'>;

	/**
	 * Creates a line series with specified parameters
	 * @param lineOptions - customization parameters of the series being created
	 * @returns an interface of the created series
	 */
	addLineSeries(lineOptions?: LineSeriesPartialOptions): ISeriesApi<'Line'>;

	/**
	 * Removes a series of any type. This is an irreversible operation, you cannot do anything with the series after removing it
	 */
	removeSeries(seriesApi: ISeriesApi<SeriesType>): void;

	/*
	 * Adds a subscription to mouse click event
	 * @param handler - handler (function) to be called on mouse click
	 */
	subscribeClick(handler: MouseEventHandler): void;

	/**
	 * Removes mouse click subscription
	 * @param handler - previously subscribed handler
	 */
	unsubscribeClick(handler: MouseEventHandler): void;

	/**
	 * Adds a subscription to crosshair movement to receive notifications on crosshair movements
	 * @param handler - handler (function) to be called on crosshair move
	 */
	subscribeCrosshairMove(handler: MouseEventHandler): void;

	/**
	 * Removes a subscription on crosshair movement
	 * @param handler - previously subscribed handler
	 */
	unsubscribeCrosshairMove(handler: MouseEventHandler): void;

	/**
	 * Returns API to manipulate the price scale
	 * @param priceScaleId - id of scale to access to
	 * @returns target API
	 */
	priceScale(priceScaleId?: string): IPriceScaleApi;

	/**
	 * Returns API to manipulate the time scale
	 * @returns target API
	 */
	timeScale(): ITimeScaleApi;

	/**
	 * Applies new options to the chart
	 * @param options - any subset of chart options
	 */
	applyOptions(options: DeepPartial<ChartOptions>): void;

	/**
	 * Returns currently applied options
	 * @returns full set of currently applied options, including defaults
	 */
	options(): Readonly<ChartOptions>;

	/**
	 * Make a screenshot of the chart with all the elements excluding crosshair.
	 * @returns a canvas with the chart drawn on
	 */
	takeScreenshot(): HTMLCanvasElement;
}
