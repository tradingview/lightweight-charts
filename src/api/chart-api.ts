import { ChartWidget, MouseEventParamsImpl, MouseEventParamsImplSupplier } from '../gui/chart-widget';
import { PaneWidget } from '../gui/pane-widget';

import { assert, ensureDefined } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { clone, DeepPartial, isBoolean, merge } from '../helpers/strict-type-checks';

import { ChartOptions, ChartOptionsInternal } from '../model/chart-model';
import { Series } from '../model/series';
import { SeriesPlotRow } from '../model/series-data';
import {
	AreaSeriesOptions,
	AreaSeriesPartialOptions,
	BarSeriesOptions,
	BarSeriesPartialOptions,
	BaselineSeriesOptions,
	BaselineSeriesPartialOptions,
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
import { Logical, Time } from '../model/time-data';

import { CandlestickSeriesApi } from './candlestick-series-api';
import { DataUpdatesConsumer, isFulfilledData, SeriesDataItemTypeMap } from './data-consumer';
import { DataLayer, DataUpdateResponse, SeriesChanges } from './data-layer';
import { getSeriesDataCreator } from './get-series-data-creator';
import { IChartApi, MouseEventHandler, MouseEventParams } from './ichart-api';
import { IPriceScaleApi } from './iprice-scale-api';
import { ISeriesApi } from './iseries-api';
import { ITimeScaleApi } from './itime-scale-api';
import { chartOptionsDefaults } from './options/chart-options-defaults';
import {
	areaStyleDefaults,
	barStyleDefaults,
	baselineStyleDefaults,
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

function toInternalOptions(options: DeepPartial<ChartOptions>): DeepPartial<ChartOptionsInternal> {
	migrateHandleScaleScrollOptions(options);

	return options as DeepPartial<ChartOptionsInternal>;
}

export type IPriceScaleApiProvider = Pick<IChartApi, 'priceScale'>;

export class ChartApi implements IChartApi, DataUpdatesConsumer<SeriesType> {
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
		this._timeScaleApi = new TimeScaleApi(model, this._chartWidget.timeAxisWidget());
	}

	public remove(): void {
		this._chartWidget.clicked().unsubscribeAll(this);
		this._chartWidget.crosshairMoved().unsubscribeAll(this);

		this._timeScaleApi.destroy();
		this._chartWidget.destroy();

		this._seriesMap.clear();
		this._seriesMapReversed.clear();

		this._clickedDelegate.destroy();
		this._crosshairMovedDelegate.destroy();
		this._dataLayer.destroy();
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

	public addBaselineSeries(options: BaselineSeriesPartialOptions = {}): ISeriesApi<'Baseline'> {
		patchPriceFormat(options.priceFormat);

		// to avoid assigning fields to defaults we have to clone them
		const strictOptions = merge(clone(seriesOptionsDefaults), clone(baselineStyleDefaults), options) as BaselineSeriesOptions;
		const series = this._chartWidget.model().createSeries('Baseline', strictOptions);

		const res = new SeriesApi<'Baseline'>(series, this, this);
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

	public removeSeries(seriesApi: SeriesApi<SeriesType>): void {
		const series = ensureDefined(this._seriesMap.get(seriesApi));

		const update = this._dataLayer.removeSeries(series);
		const model = this._chartWidget.model();
		model.removeSeries(series);

		this._sendUpdateToChart(update);

		this._seriesMap.delete(seriesApi);
		this._seriesMapReversed.delete(series);
	}

	public applyNewData<TSeriesType extends SeriesType>(series: Series<TSeriesType>, data: SeriesDataItemTypeMap[TSeriesType][]): void {
		this._sendUpdateToChart(this._dataLayer.setSeriesData(series, data));
	}

	public updateData<TSeriesType extends SeriesType>(series: Series<TSeriesType>, data: SeriesDataItemTypeMap[TSeriesType]): void {
		this._sendUpdateToChart(this._dataLayer.updateSeriesData(series, data));
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

	public priceScale(priceScaleId: string): IPriceScaleApi {
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

	public removePane(index: number): void {
		this._chartWidget.model().removePane(index);
	}

	public swapPane(first: number, second: number): void {
		this._chartWidget.model().swapPane(first, second);
	}

	public getPaneElements(): HTMLElement[] {
		return this._chartWidget.paneWidgets().map((paneWidget: PaneWidget) => paneWidget.getPaneCell());
	}

	private _sendUpdateToChart(update: DataUpdateResponse): void {
		const model = this._chartWidget.model();

		model.updateTimeScale(update.timeScale.baseIndex, update.timeScale.points, update.timeScale.firstChangedPointIndex);
		update.series.forEach((value: SeriesChanges, series: Series) => series.setData(value.data, value.info));

		model.recalculateAllPanes();
	}

	private _mapSeriesToApi(series: Series): ISeriesApi<SeriesType> {
		return ensureDefined(this._seriesMapReversed.get(series));
	}

	private _convertMouseParams(param: MouseEventParamsImpl): MouseEventParams {
		const seriesData: MouseEventParams['seriesData'] = new Map();
		param.seriesData.forEach((plotRow: SeriesPlotRow, series: Series) => {
			const data = getSeriesDataCreator(series.seriesType())(plotRow);
			assert(isFulfilledData(data));
			seriesData.set(this._mapSeriesToApi(series), data);
		});

		const hoveredSeries = param.hoveredSeries === undefined ? undefined : this._mapSeriesToApi(param.hoveredSeries);

		return {
			time: param.time as Time | undefined,
			logical: param.index as Logical | undefined,
			point: param.point,
			paneIndex: param.paneIndex,
			hoveredSeries,
			hoveredMarkerId: param.hoveredObject,
			seriesData,
		};
	}
}
