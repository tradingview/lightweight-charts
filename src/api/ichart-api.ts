import { DeepPartial } from '../helpers/strict-type-checks';

import { ChartOptions } from '../model/chart-model';
import { Point } from '../model/point';
import {
	AreaSeriesOptions,
	BarSeriesOptions,
	CandleSeriesOptions,
	HistogramSeriesOptions,
	LineSeriesOptions,
} from '../model/series-options';
import { BusinessDay, UTCTimestamp } from '../model/time-data';

import { IAreaSeriesApi } from './iarea-series-api';
import { IBarSeriesApi } from './ibar-series-api';
import { ICandleSeries } from './icandle-series-api';
import { IHistogramSeriesApi } from './ihistogram-series-api';
import { ILineSeriesApi } from './iline-series-api';
import { IPriceScaleApi } from './iprice-scale-api';
import { ISeriesApi } from './iseries-api';
import { ITimeScaleApi, TimeRange } from './itime-scale-api';

export interface MouseEventParams {
	time?: UTCTimestamp | BusinessDay;
	point?: Point;
	seriesPrices: Map<ISeriesApi, number>;
}

export type MouseEventHandler = (param: MouseEventParams) => void;
export type TimeRangeChangeEventHandler = (timeRange: TimeRange | null) => void;

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
	 * @param height - target height of the chart
	 * @param width - target width of the chart
	 * @param [forceRepaint=false] - true to initiate resize immediately. One could need this to get screenshot immediately after resize
	 */
	resize(height: number, width: number, forceRepaint?: boolean): void;

	/**
	 * Creates an area series with specified parameters
	 * @param [areaParams = undefined] - customization parameters of the series being created
	 * @return an interface of the created series
	 */
	addAreaSeries(areaParams?: DeepPartial<AreaSeriesOptions>): IAreaSeriesApi;

	/**
	 * Creates a bar series with specified parameters
	 * @param [barParams = undefined] - customization parameters of the series being created
	 * @return an interface of the created series
	 */
	addBarSeries(barParams?: DeepPartial<BarSeriesOptions>): IBarSeriesApi;

	/**
	 * Creates a candle series with specified parameters
	 * @param [candleParams = undefined] - customization parameters of the series being created
	 * @return an interface of the created series
	 */
	addCandleSeries(candleParams?: DeepPartial<CandleSeriesOptions>): ICandleSeries;

	/**
	 * Creates a histogram series with specified parameters
	 * @param [histogramParams=undefined] - customization parameters of the series being created
	 * @return an interface of the created series
	 */
	addHistogramSeries(histogramParams?: DeepPartial<HistogramSeriesOptions>): IHistogramSeriesApi;

	/**
	 * Creates a line series with specified parameters
	 * @param [lineParams=undefined] - customization parameters of the series being created
	 * @return an interface of the created series
	 */
	addLineSeries(lineParams?: DeepPartial<LineSeriesOptions>): ILineSeriesApi;

	/**
	 * Removes a series of any type. This is an irreversible operation, you cannot do anything with the series after removing it
	 */
	removeSeries(seriesApi: ISeriesApi): void;

	/*
	 * Adds a subscription to mouse click event
	 * @param handler - handler (funtion) to be called on mouse click
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
	subscribeCrossHairMove(handler: MouseEventHandler): void;

	/**
	 * Removes a subscription on crosshair movement
	 * @param handler - previously subscribed handler
	 */
	unsubscribeCrossHairMove(handler: MouseEventHandler): void;

	/**
	 * Adds a subscription to visible range changes to receive notification about visible range of data changes
	 * @param handler - handler (function) to be called on changing visible data range
	 */
	subscribeVisibleTimeRangeChange(handler: TimeRangeChangeEventHandler): void;

	/**
	 * Removes a subscription to visible range changes
	 * @param handler - previously subscribed handler
	 */
	unsubscribeVisibleTimeRangeChange(handler: TimeRangeChangeEventHandler): void;

	/**
	 * Returns API to manipulate the price scale
	 * @returns - target API
	 */
	priceScale(): IPriceScaleApi;

	/**
	 * Returns API to manipulate the time scale
	 * @return - target API
	 */
	timeScale(): ITimeScaleApi;

	/**
	 * Applies new options to the chart
	 * @param - options, any subset of chart options
	 */
	applyOptions(options: DeepPartial<ChartOptions>): void;

	/**
	 * Returns currently applied options
	 * @return - full set of currently applied options, including defautls
	 */
	options(): ChartOptions;

	/**
	 * Removes branding text from the chart.
	 * Please read the description of this method in the documentation to learn more about the conditions of branding removal.
	 */
	disableBranding(): void;
}
