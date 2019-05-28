import { DeepPartial } from '../helpers/strict-type-checks';

import { ChartOptions } from '../model/chart-model';
import { Point } from '../model/point';
import { BusinessDay, UTCTimestamp } from '../model/time-data';

import { AreaSeriesParams, IAreaSeriesApi } from './iarea-series-api';
import { BarSeriesParams, IBarSeriesApi } from './ibar-series-api';
import { CandleSeriesParams, ICandleSeries } from './icandle-series-api';
import { HistogramSeriesParams, IHistogramSeriesApi } from './ihistogram-series-api';
import { ILineSeriesApi, LineSeriesParams } from './iline-series-api';
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

export interface IChartApi {
	remove(): void;

	resize(height: number, width: number, forceRepaint?: boolean): void;

	addAreaSeries(areaParams?: DeepPartial<AreaSeriesParams>): IAreaSeriesApi;
	addBarSeries(barParams?: DeepPartial<BarSeriesParams>): IBarSeriesApi;
	addCandleSeries(candleParams?: DeepPartial<CandleSeriesParams>): ICandleSeries;
	addHistogramSeries(histogramParams?: DeepPartial<HistogramSeriesParams>): IHistogramSeriesApi;
	addLineSeries(lineParams?: DeepPartial<LineSeriesParams>): ILineSeriesApi;

	removeSeries(seriesApi: ISeriesApi): void;

	subscribeClick(handler: MouseEventHandler): void;
	unsubscribeClick(handler: MouseEventHandler): void;

	subscribeCrossHairMove(handler: MouseEventHandler): void;
	unsubscribeCrossHairMove(handler: MouseEventHandler): void;

	subscribeVisibleTimeRangeChange(handler: TimeRangeChangeEventHandler): void;
	unsubscribeVisibleTimeRangeChange(handler: TimeRangeChangeEventHandler): void;

	// TODO: add more subscriptions

	priceScale(): IPriceScaleApi;
	timeScale(): ITimeScaleApi;

	applyOptions(options: DeepPartial<ChartOptions>): void;
	options(): ChartOptions;

	disableBranding(): void;
}
