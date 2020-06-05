import { ChartWidget, MouseEventParamsImpl, MouseEventParamsImplSupplier } from '../gui/chart-widget';

import { ensureDefined } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { warn } from '../helpers/logger';
import { clone, DeepPartial, isBoolean, merge } from '../helpers/strict-type-checks';

import { BarPrice, BarPrices } from '../model/bar';
import { ChartOptions, ChartOptionsInternal } from '../model/chart-model';
import { Series } from '../model/series';
import {
	AreaSeriesOptions,
	AreaSeriesPartialOptions,
	BarSeriesOptions,
	BarSeriesPartialOptions,
	CandlestickSeriesOptions,
	CandlestickSeriesPartialOptions,
	fillUpDownCandlesticksColors,
	HistogramSeriesOptions,
	HistogramSeriesPartialOptions,
	LineSeriesOptions,
	LineSeriesPartialOptions,
	precisionByMinMove,
	PriceFormat,
	PriceFormatBuiltIn,
	SeriesType,
} from '../model/series-options';
import { TimePointIndex } from '../model/time-data';

import { CandlestickSeriesApi } from './candlestick-series-api';
import { DataUpdatesConsumer, SeriesDataItemTypeMap } from './data-consumer';
import { DataLayer, SeriesUpdatePacket } from './data-layer';
import { IChartApi, MouseEventHandler, MouseEventParams } from './ichart-api';
import { IPriceScaleApi } from './iprice-scale-api';
import { ISeriesApi } from './iseries-api';
import { ITimeScaleApi } from './itime-scale-api';
import { chartOptionsDefaults } from './options/chart-options-defaults';
import {
	areaStyleDefaults,
	barStyleDefaults,
	candlestickStyleDefaults,
	histogramStyleDefaults,
	lineStyleDefaults,
	seriesOptionsDefaults,
} from './options/series-options-defaults';
import { PriceScaleApi } from './price-scale-api';
import { SeriesApi } from './series-api';
import { TimeScaleApi } from './time-scale-api';

function patchPriceFormat(priceFormat?: DeepPartial<PriceFormat>): void {
	if (priceFormat === undefined || priceFormat.type === 'custom') {
		return;
	}
	const priceFormatBuiltIn = priceFormat as DeepPartial<PriceFormatBuiltIn>;
	if (priceFormatBuiltIn.minMove !== undefined && priceFormatBuiltIn.precision === undefined) {
		priceFormatBuiltIn.precision = precisionByMinMove(priceFormatBuiltIn.minMove);
	}
}

function migrateHandleScaleScrollOptions(options: DeepPartial<ChartOptions>): void {
	if (isBoolean(options.handleScale)) {
		const handleScale = options.handleScale;
		options.handleScale = {
			axisDoubleClickReset: handleScale,
			axisPressedMouseMove: {
				time: handleScale,
				price: handleScale,
			},
			mouseWheel: handleScale,
			pinch: handleScale,
		};
	} else if (options.handleScale !== undefined && isBoolean(options.handleScale.axisPressedMouseMove)) {
		const axisPressedMouseMove = options.handleScale.axisPressedMouseMove;
		options.handleScale.axisPressedMouseMove = {
			time: axisPressedMouseMove,
			price: axisPressedMouseMove,
		};
	}

	const handleScroll = options.handleScroll;
	if (isBoolean(handleScroll)) {
		options.handleScroll = {
			horzTouchDrag: handleScroll,
			vertTouchDrag: handleScroll,
			mouseWheel: handleScroll,
			pressedMouseMove: handleScroll,
		};
	}
}

function migratePriceScaleOptions(options: DeepPartial<ChartOptions>): void {
	if (options.priceScale) {
		warn('"priceScale" option has been deprecated, use "leftPriceScale", "rightPriceScale" and "overlayPriceScales" instead');
		options.leftPriceScale = options.leftPriceScale || {};
		options.rightPriceScale = options.rightPriceScale || {};
		// tslint:disable-next-line:deprecation
		const position = options.priceScale.position;
		// tslint:disable-next-line:deprecation
		delete options.priceScale.position;
		options.leftPriceScale = merge(options.leftPriceScale, options.priceScale);
		options.rightPriceScale = merge(options.rightPriceScale, options.priceScale);
		if (position === 'left') {
			options.leftPriceScale.visible = true;
			options.rightPriceScale.visible = false;
		}
		if (position === 'right') {
			options.leftPriceScale.visible = false;
			options.rightPriceScale.visible = true;
		}
		if (position === 'none') {
			options.leftPriceScale.visible = false;
			options.rightPriceScale.visible = false;
		}
		// copy defaults for overlays
		options.overlayPriceScales = options.overlayPriceScales || {};
		if (options.priceScale.invertScale !== undefined) {
			options.overlayPriceScales.invertScale = options.priceScale.invertScale;
		}
		// do not migrate mode for backward compatibility
		if (options.priceScale.scaleMargins !== undefined) {
			options.overlayPriceScales.scaleMargins = options.priceScale.scaleMargins;
		}
	}
}

function toInternalOptions(options: DeepPartial<ChartOptions>): DeepPartial<ChartOptionsInternal> {
	migrateHandleScaleScrollOptions(options);
	migratePriceScaleOptions(options);

	return options as DeepPartial<ChartOptionsInternal>;
}

export interface IPriceScaleApiProvider {
	priceScale(id: string): IPriceScaleApi;
}

export class ChartApi implements IChartApi, IPriceScaleApiProvider, DataUpdatesConsumer<SeriesType> {
	private _chartWidget: ChartWidget;
	private _dataLayer: DataLayer = new DataLayer();
	private readonly _seriesMap: Map<SeriesApi<SeriesType>, Series> = new Map();
	private readonly _seriesMapReversed: Map<Series, SeriesApi<SeriesType>> = new Map();

	private readonly _clickedDelegate: Delegate<MouseEventParams> = new Delegate();
	private readonly _crosshairMovedDelegate: Delegate<MouseEventParams> = new Delegate();

	private readonly _timeScaleApi: TimeScaleApi;

	public constructor(container: HTMLElement, options?: DeepPartial<ChartOptions>) {
		const internalOptions = (options === undefined) ?
			clone(chartOptionsDefaults) :
			merge(clone(chartOptionsDefaults), toInternalOptions(options)) as ChartOptionsInternal;

		this._chartWidget = new ChartWidget(container, internalOptions);

		this._chartWidget.clicked().subscribe(
			(paramSupplier: MouseEventParamsImplSupplier) => {
				if (this._clickedDelegate.hasListeners()) {
					this._clickedDelegate.fire(this._convertMouseParams(paramSupplier()));
				}
			},
			this
		);
		this._chartWidget.crosshairMoved().subscribe(
			(paramSupplier: MouseEventParamsImplSupplier) => {
				if (this._crosshairMovedDelegate.hasListeners()) {
					this._crosshairMovedDelegate.fire(this._convertMouseParams(paramSupplier()));
				}
			},
			this
		);

		const model = this._chartWidget.model();
		this._timeScaleApi = new TimeScaleApi(model);
	}

	public remove(): void {
		this._chartWidget.clicked().unsubscribeAll(this);
		this._chartWidget.crosshairMoved().unsubscribeAll(this);

		this._timeScaleApi.destroy();
		this._chartWidget.destroy();
		delete this._chartWidget;
		this._seriesMap.forEach((series: Series, api: SeriesApi<SeriesType>) => {
			api.destroy();
		});
		this._seriesMap.clear();
		this._seriesMapReversed.clear();
		this._clickedDelegate.destroy();
		this._crosshairMovedDelegate.destroy();
		this._dataLayer.destroy();
		delete this._dataLayer;
	}

	public resize(width: number, height: number, forceRepaint?: boolean): void {
		this._chartWidget.resize(width, height, forceRepaint);
	}

	public addAreaSeries(options: AreaSeriesPartialOptions = {}): ISeriesApi<'Area'> {
		patchPriceFormat(options.priceFormat);

		const strictOptions = merge(clone(seriesOptionsDefaults), areaStyleDefaults, options) as AreaSeriesOptions;
		const series = this._chartWidget.model().createSeries('Area', strictOptions);

		const res = new SeriesApi<'Area'>(series, this, this);
		this._seriesMap.set(res, series);
		this._seriesMapReversed.set(series, res);

		return res;
	}

	public addBarSeries(options: BarSeriesPartialOptions = {}): ISeriesApi<'Bar'> {
		patchPriceFormat(options.priceFormat);

		const strictOptions = merge(clone(seriesOptionsDefaults), barStyleDefaults, options) as BarSeriesOptions;
		const series = this._chartWidget.model().createSeries('Bar', strictOptions);

		const res = new SeriesApi<'Bar'>(series, this, this);
		this._seriesMap.set(res, series);
		this._seriesMapReversed.set(series, res);

		return res;
	}

	public addCandlestickSeries(options: CandlestickSeriesPartialOptions = {}): ISeriesApi<'Candlestick'> {
		fillUpDownCandlesticksColors(options);
		patchPriceFormat(options.priceFormat);

		const strictOptions = merge(clone(seriesOptionsDefaults), candlestickStyleDefaults, options) as CandlestickSeriesOptions;
		const series = this._chartWidget.model().createSeries('Candlestick', strictOptions);

		const res = new CandlestickSeriesApi(series, this, this);
		this._seriesMap.set(res, series);
		this._seriesMapReversed.set(series, res);

		return res;
	}

	public addHistogramSeries(options: HistogramSeriesPartialOptions = {}): ISeriesApi<'Histogram'> {
		patchPriceFormat(options.priceFormat);

		const strictOptions = merge(clone(seriesOptionsDefaults), histogramStyleDefaults, options) as HistogramSeriesOptions;
		const series = this._chartWidget.model().createSeries('Histogram', strictOptions);

		const res = new SeriesApi<'Histogram'>(series, this, this);
		this._seriesMap.set(res, series);
		this._seriesMapReversed.set(series, res);

		return res;
	}

	public addLineSeries(options: LineSeriesPartialOptions = {}): ISeriesApi<'Line'> {
		patchPriceFormat(options.priceFormat);

		const strictOptions = merge(clone(seriesOptionsDefaults), lineStyleDefaults, options) as LineSeriesOptions;
		const series = this._chartWidget.model().createSeries('Line', strictOptions);

		const res = new SeriesApi<'Line'>(series, this, this);
		this._seriesMap.set(res, series);
		this._seriesMapReversed.set(series, res);

		return res;
	}

	public removeSeries(seriesApi: ISeriesApi<SeriesType>): void {
		const seriesObj = seriesApi as SeriesApi<SeriesType>;
		const series = ensureDefined(this._seriesMap.get(seriesObj));

		const update = this._dataLayer.removeSeries(series);
		const model = this._chartWidget.model();
		model.removeSeries(series);
		const timeScaleUpdate = update.timeScaleUpdate;
		model.updateTimeScale(timeScaleUpdate.index, timeScaleUpdate.changes, timeScaleUpdate.marks, true);
		timeScaleUpdate.seriesUpdates.forEach((value: SeriesUpdatePacket, key: Series) => {
			key.updateData(value.update);
		});
		model.updateTimeScaleBaseIndex(0 as TimePointIndex);
		this._seriesMap.delete(seriesObj);
		this._seriesMapReversed.delete(series);
	}

	public applyNewData<TSeriesType extends SeriesType>(series: Series<TSeriesType>, data: SeriesDataItemTypeMap[TSeriesType][]): void {
		const update = this._dataLayer.setSeriesData(series, data);
		const model = this._chartWidget.model();
		const timeScaleUpdate = update.timeScaleUpdate;
		model.updateTimeScale(timeScaleUpdate.index, timeScaleUpdate.changes, timeScaleUpdate.marks, true);
		timeScaleUpdate.seriesUpdates.forEach((value: SeriesUpdatePacket, key: Series) => {
			// the latest arg `true` must be removed in https://github.com/tradingview/lightweight-charts/issues/270
			// here we don't need to clear palettes because they were just filled in DataLayer
			// see https://github.com/tradingview/lightweight-charts/pull/330#discussion_r379415805
			key.updateData(value.update, true);
		});
		model.updateTimeScaleBaseIndex(0 as TimePointIndex);
	}

	public updateData<TSeriesType extends SeriesType>(series: Series<TSeriesType>, data: SeriesDataItemTypeMap[TSeriesType]): void {
		const update = this._dataLayer.updateSeriesData(series, data);
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

	public priceScale(priceScaleId?: string): IPriceScaleApi {
		if (priceScaleId === undefined) {
			warn('Using ChartApi.priceScale() method without arguments has been deprecated, pass valid price scale id instead');
		}

		priceScaleId = priceScaleId || this._chartWidget.model().defaultVisiblePriceScaleId();
		return new PriceScaleApi(this._chartWidget, priceScaleId);
	}

	public timeScale(): ITimeScaleApi {
		return this._timeScaleApi;
	}

	public applyOptions(options: DeepPartial<ChartOptions>): void {
		this._chartWidget.applyOptions(toInternalOptions(options));
	}

	public options(): Readonly<ChartOptions> {
		return this._chartWidget.options() as Readonly<ChartOptions>;
	}

	public takeScreenshot(): HTMLCanvasElement {
		return this._chartWidget.takeScreenshot();
	}

	private _mapSeriesToApi(series: Series): ISeriesApi<SeriesType> {
		return ensureDefined(this._seriesMapReversed.get(series));
	}

	private _convertMouseParams(param: MouseEventParamsImpl): MouseEventParams {
		const seriesPrices = new Map<ISeriesApi<SeriesType>, BarPrice | BarPrices>();
		param.seriesPrices.forEach((price: BarPrice | BarPrices, series: Series) => {
			seriesPrices.set(this._mapSeriesToApi(series), price);
		});

		const hoveredSeries = param.hoveredSeries === undefined ? undefined : this._mapSeriesToApi(param.hoveredSeries);

		return {
			time: param.time && (param.time.businessDay || param.time.timestamp),
			point: param.point,
			hoveredSeries,
			hoveredMarkerId: param.hoveredObject,
			seriesPrices,
		};
	}
}
