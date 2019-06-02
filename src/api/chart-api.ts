import { ChartWidget, MouseEventParamsImpl } from '../gui/chart-widget';

import { ensureDefined } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { clone, DeepPartial, merge } from '../helpers/strict-type-checks';

import { ChartOptions } from '../model/chart-model';
import { Palette } from '../model/palette';
import { Series } from '../model/series';
import {
	AreaSeriesOptions,
	BarSeriesOptions,
	CandleSeriesOptions,
	fillUpDownCandlesColors,
	HistogramSeriesOptions,
	LineSeriesOptions,
	precisionByMinMove,
	PriceFormat,
	SeriesType,
} from '../model/series-options';
import { TimePointIndex } from '../model/time-data';

import { AreaSeriesApi } from './area-series-api';
import { BarSeriesApi } from './bar-series-api';
import { CandleSeriesApi } from './candle-series-api';
import { DataLayer, SeriesUpdatePacket, TimedData } from './data-layer';
import { HistogramSeriesApi } from './histogram-series-api';
import { IAreaSeriesApi } from './iarea-series-api';
import { IBarSeriesApi } from './ibar-series-api';
import { ICandleSeries } from './icandle-series-api';
import { IChartApi, MouseEventHandler, MouseEventParams, TimeRangeChangeEventHandler } from './ichart-api';
import { IHistogramSeriesApi } from './ihistogram-series-api';
import { ILineSeriesApi } from './iline-series-api';
import { IPriceScaleApi } from './iprice-scale-api';
import { ISeriesApi } from './iseries-api';
import { ITimeScaleApi, TimeRange } from './itime-scale-api';
import { LineSeriesApi } from './line-series-api';
import {
	areaStyleDefaults,
	barStyleDefaults,
	candleStyleDefaults,
	histogramStyleDefaults,
	lineStyleDefaults,
	seriesOptionsDefaults,
} from './options/series-options-defaults';
import { PriceScaleApi } from './price-scale-api';
import { DataUpdatesConsumer, SeriesApiBase } from './series-api-base';
import { TimeScaleApi } from './time-scale-api';

function patchPriceFormat(priceFormat?: DeepPartial<PriceFormat>): void {
	if (priceFormat === undefined) {
		return;
	}
	if (priceFormat.minMove !== undefined && priceFormat.precision === undefined) {
		priceFormat.precision = precisionByMinMove(priceFormat.minMove);
	}
}

export class ChartApi implements IChartApi, DataUpdatesConsumer<SeriesType> {
	private _chartWidget: ChartWidget;
	private _dataLayer: DataLayer = new DataLayer();
	private readonly _timeRangeChanged: Delegate<TimeRange | null> = new Delegate();
	private readonly _seriesMap: Map<SeriesApiBase<SeriesType>, Series> = new Map();
	private readonly _seriesMapReversed: Map<Series, SeriesApiBase<SeriesType>> = new Map();

	private readonly _clickedDelegate: Delegate<MouseEventParams> = new Delegate();
	private readonly _crosshairMovedDelegate: Delegate<MouseEventParams> = new Delegate();

	private readonly _priceScaleApi: PriceScaleApi;
	private readonly _timeScaleApi: TimeScaleApi;

	public constructor(container: HTMLElement, options: ChartOptions) {
		this._chartWidget = new ChartWidget(container, options);
		this._chartWidget.model().timeScale().visibleBarsChanged().subscribe(this._onVisibleBarsChanged.bind(this));

		this._chartWidget.clicked().subscribe((param: MouseEventParamsImpl) => this._clickedDelegate.fire(this._convertMouseParams(param)), this);
		this._chartWidget.crosshairMoved().subscribe((param: MouseEventParamsImpl) => this._crosshairMovedDelegate.fire(this._convertMouseParams(param)), this);

		const model = this._chartWidget.model();
		this._priceScaleApi = new PriceScaleApi(model);
		this._timeScaleApi = new TimeScaleApi(model);
	}

	public remove(): void {
		this._chartWidget.model().timeScale().visibleBarsChanged().unsubscribeAll(this);
		this._chartWidget.clicked().unsubscribeAll(this);
		this._chartWidget.crosshairMoved().unsubscribeAll(this);
		this._priceScaleApi.destroy();
		this._timeScaleApi.destroy();
		this._chartWidget.destroy();
		delete this._chartWidget;
		this._seriesMap.forEach((series: Series, api: SeriesApiBase<SeriesType>) => {
			api.destroy();
		});
		this._seriesMap.clear();
		this._seriesMapReversed.clear();
		this._timeRangeChanged.destroy();
		this._clickedDelegate.destroy();
		this._crosshairMovedDelegate.destroy();
		this._dataLayer.destroy();
		delete this._dataLayer;
	}

	public resize(height: number, width: number, forceRepaint?: boolean): void {
		this._chartWidget.resize(height, width, forceRepaint);
	}

	public addAreaSeries(options: DeepPartial<AreaSeriesOptions> = {}): IAreaSeriesApi {
		patchPriceFormat(options.priceFormat);

		const strictOptions = merge(clone(seriesOptionsDefaults), areaStyleDefaults, options) as AreaSeriesOptions;
		const series = this._chartWidget.model().createSeries('Area', strictOptions, Boolean(options.overlay), options.title, options.scaleMargins);

		const res = new AreaSeriesApi(series, this);
		this._seriesMap.set(res, series);
		this._seriesMapReversed.set(series, res);

		return res;
	}

	public addBarSeries(options: DeepPartial<BarSeriesOptions> = {}): IBarSeriesApi {
		patchPriceFormat(options.priceFormat);

		const strictOptions = merge(clone(seriesOptionsDefaults), barStyleDefaults, options) as BarSeriesOptions;
		const series = this._chartWidget.model().createSeries('Bar', strictOptions, Boolean(options.overlay), options.title, options.scaleMargins);

		const res = new BarSeriesApi(series, this);
		this._seriesMap.set(res, series);
		this._seriesMapReversed.set(series, res);

		return res;
	}

	public addCandleSeries(options: DeepPartial<CandleSeriesOptions> = {}): ICandleSeries {
		fillUpDownCandlesColors(options);
		patchPriceFormat(options.priceFormat);

		const strictOptions = merge(clone(seriesOptionsDefaults), candleStyleDefaults, options) as CandleSeriesOptions;
		const series = this._chartWidget.model().createSeries('Candle', strictOptions, Boolean(options.overlay), options.title, options.scaleMargins);

		const res = new CandleSeriesApi(series, this);
		this._seriesMap.set(res, series);
		this._seriesMapReversed.set(series, res);

		return res;
	}

	public addHistogramSeries(options: DeepPartial<HistogramSeriesOptions> = {}): IHistogramSeriesApi {
		patchPriceFormat(options.priceFormat);

		const strictOptions = merge(clone(seriesOptionsDefaults), histogramStyleDefaults, options) as HistogramSeriesOptions;
		const series = this._chartWidget.model().createSeries('Histogram', strictOptions, Boolean(options.overlay), options.title, options.scaleMargins);

		const res = new HistogramSeriesApi(series, this);
		this._seriesMap.set(res, series);
		this._seriesMapReversed.set(series, res);

		return res;
	}

	public addLineSeries(options: DeepPartial<LineSeriesOptions> = {}): ILineSeriesApi {
		patchPriceFormat(options.priceFormat);

		const strictOptions = merge(clone(seriesOptionsDefaults), lineStyleDefaults, options) as LineSeriesOptions;
		const series = this._chartWidget.model().createSeries('Line', strictOptions, Boolean(options.overlay), options.title, options.scaleMargins);

		const res = new LineSeriesApi(series, this);
		this._seriesMap.set(res, series);
		this._seriesMapReversed.set(series, res);

		return res;
	}

	public removeSeries(seriesApi: ISeriesApi): void {
		const seriesObj = seriesApi as SeriesApiBase<SeriesType>;
		const series = ensureDefined(this._seriesMap.get(seriesObj));

		const update = this._dataLayer.removeSeries(series);
		const model = this._chartWidget.model();
		model.removeSeries(series);
		const timeScaleUpdate = update.timeScaleUpdate;
		model.updateTimeScale(timeScaleUpdate.index, timeScaleUpdate.changes, timeScaleUpdate.marks, true);
		timeScaleUpdate.seriesUpdates.forEach((value: SeriesUpdatePacket, key: Series) => {
			key.setData(value.update, false);
		});
		model.updateTimeScaleBaseIndex(0 as TimePointIndex);
		this._seriesMap.delete(seriesObj);
		this._seriesMapReversed.delete(series);
	}

	public applyNewData(series: Series, data: TimedData[], palette?: Palette): void {
		const update = this._dataLayer.setSeriesData(series, data, palette);
		const model = this._chartWidget.model();
		const timeScaleUpdate = update.timeScaleUpdate;
		model.updateTimeScale(timeScaleUpdate.index, timeScaleUpdate.changes, timeScaleUpdate.marks, true);
		timeScaleUpdate.seriesUpdates.forEach((value: SeriesUpdatePacket, key: Series) => {
			key.setData(value.update, series === key, palette);
		});
		model.updateTimeScaleBaseIndex(0 as TimePointIndex);
	}

	public updateData(series: Series, data: TimedData, palette?: Palette): void {
		const update = this._dataLayer.updateSeriesData(series, data, palette);
		const model = this._chartWidget.model();
		const timeScaleUpdate = update.timeScaleUpdate;
		model.updateTimeScale(timeScaleUpdate.index, timeScaleUpdate.changes, timeScaleUpdate.marks, false);
		timeScaleUpdate.seriesUpdates.forEach((value: SeriesUpdatePacket, key: Series) => {
			key.updateData(value.update);
		});
		model.updateTimeScaleBaseIndex(0 as TimePointIndex);
	}

	public subscribeClick(handler: MouseEventHandler): void {
		this._clickedDelegate.subscribe(handler);
	}

	public unsubscribeClick(handler: MouseEventHandler): void {
		this._clickedDelegate.unsubscribe(handler);
	}

	public subscribeCrosshairMove(handler: MouseEventHandler): void {
		this._crosshairMovedDelegate.subscribe(handler);
	}

	public unsubscribeCrosshairMove(handler: MouseEventHandler): void {
		this._crosshairMovedDelegate.unsubscribe(handler);
	}

	public subscribeVisibleTimeRangeChange(handler: TimeRangeChangeEventHandler): void {
		this._timeRangeChanged.subscribe(handler);
	}

	public unsubscribeVisibleTimeRangeChange(handler: TimeRangeChangeEventHandler): void {
		this._timeRangeChanged.unsubscribe(handler);
	}

	// TODO: add more subscriptions

	public priceScale(): IPriceScaleApi {
		return this._priceScaleApi;
	}

	public timeScale(): ITimeScaleApi {
		return this._timeScaleApi;
	}

	public applyOptions(options: DeepPartial<ChartOptions>): void {
		this._chartWidget.applyOptions(options);
	}

	public options(): ChartOptions {
		return this._chartWidget.options();
	}

	public disableBranding(): void {
		this._chartWidget.disableBranding();
	}

	private _onVisibleBarsChanged(): void {
		if (this._timeRangeChanged.hasListeners()) {
			this._timeRangeChanged.fire(this.timeScale().getVisibleRange());
		}
	}

	private _mapSeriesToApi(series: Series): ISeriesApi {
		return ensureDefined(this._seriesMapReversed.get(series));
	}

	private _convertMouseParams(param: MouseEventParamsImpl): MouseEventParams {
		const seriesPrices = new Map<ISeriesApi, number>();
		param.seriesPrices.forEach((price: number, series: Series) => {
			seriesPrices.set(this._mapSeriesToApi(series), price);
		});
		return {
			time: param.time && (param.time.businessDay || param.time.timestamp),
			point: param.point,
			seriesPrices,
		};
	}
}
