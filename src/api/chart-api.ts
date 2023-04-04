import { ChartWidget, MouseEventParamsImpl, MouseEventParamsImplSupplier } from '../gui/chart-widget';

import { assert, ensureDefined } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { warn } from '../helpers/logger';
import { clone, DeepPartial, isBoolean, merge } from '../helpers/strict-type-checks';

import { ChartOptions, ChartOptionsInternal } from '../model/chart-model';
import { IHorzScaleBehavior } from '../model/ihorz-scale-behavior';
import { Series } from '../model/series';
import { SeriesPlotRow } from '../model/series-data';
import {
	AreaSeriesPartialOptions,
	BarSeriesPartialOptions,
	BaselineSeriesPartialOptions,
	CandlestickSeriesPartialOptions,
	fillUpDownCandlesticksColors,
	HistogramSeriesPartialOptions,
	LineSeriesPartialOptions,
	precisionByMinMove,
	PriceFormat,
	PriceFormatBuiltIn,
	SeriesOptionsMap,
	SeriesPartialOptionsMap,
	SeriesStyleOptionsMap,
	SeriesType,
} from '../model/series-options';
import { Logical } from '../model/time-data';

import { DataUpdatesConsumer, isFulfilledData, SeriesDataItemTypeMap } from '../model/data-consumer';
import { DataLayer, DataUpdateResponse, SeriesChanges } from '../model/data-layer';
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

function migrateHandleScaleScrollOptions<HorzScaleItem>(options: DeepPartial<ChartOptions<HorzScaleItem>>): void {
	if (isBoolean(options.handleScale)) {
		const handleScale = options.handleScale;
		options.handleScale = {
			axisDoubleClickReset: {
				time: handleScale,
				price: handleScale,
			},
			axisPressedMouseMove: {
				time: handleScale,
				price: handleScale,
			},
			mouseWheel: handleScale,
			pinch: handleScale,
		};
	} else if (options.handleScale !== undefined) {
		const { axisPressedMouseMove, axisDoubleClickReset } = options.handleScale;
		if (isBoolean(axisPressedMouseMove)) {
			options.handleScale.axisPressedMouseMove = {
				time: axisPressedMouseMove,
				price: axisPressedMouseMove,
			};
		}
		if (isBoolean(axisDoubleClickReset)) {
			options.handleScale.axisDoubleClickReset = {
				time: axisDoubleClickReset,
				price: axisDoubleClickReset,
			};
		}
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

function toInternalOptions<HorzScaleItem>(options: DeepPartial<ChartOptions<HorzScaleItem>>): DeepPartial<ChartOptionsInternal<HorzScaleItem>> {
	migrateHandleScaleScrollOptions(options);

	return options as DeepPartial<ChartOptionsInternal<HorzScaleItem>>;
}

export type IPriceScaleApiProvider<HorzScaleItem> = Pick<IChartApi<HorzScaleItem>, 'priceScale'>;

export class ChartApi<HorzScaleItem> implements IChartApi<HorzScaleItem>, DataUpdatesConsumer<SeriesType, HorzScaleItem> {
	private _chartWidget: ChartWidget<HorzScaleItem>;
	private _dataLayer: DataLayer<HorzScaleItem>;
	private readonly _seriesMap: Map<SeriesApi<SeriesType, HorzScaleItem>, Series<SeriesType, HorzScaleItem>> = new Map();
	private readonly _seriesMapReversed: Map<Series<SeriesType, HorzScaleItem>, SeriesApi<SeriesType, HorzScaleItem>> = new Map();

	private readonly _clickedDelegate: Delegate<MouseEventParams<HorzScaleItem>> = new Delegate();
	private readonly _crosshairMovedDelegate: Delegate<MouseEventParams<HorzScaleItem>> = new Delegate();

	private readonly _timeScaleApi: TimeScaleApi<HorzScaleItem>;

	private readonly _horzScaleBehavior: IHorzScaleBehavior<HorzScaleItem>;

	public constructor(container: HTMLElement, horzScaleBehavior: IHorzScaleBehavior<HorzScaleItem>, options?: DeepPartial<ChartOptions<HorzScaleItem>>) {
		this._dataLayer = new DataLayer<HorzScaleItem>(horzScaleBehavior);
		const internalOptions = (options === undefined) ?
			clone(chartOptionsDefaults<HorzScaleItem>()) :
			merge(clone(chartOptionsDefaults()), toInternalOptions(options)) as ChartOptionsInternal<HorzScaleItem>;

		this._horzScaleBehavior = horzScaleBehavior;
		this._chartWidget = new ChartWidget(container, internalOptions, horzScaleBehavior);

		this._chartWidget.clicked().subscribe(
			(paramSupplier: MouseEventParamsImplSupplier<HorzScaleItem>) => {
				if (this._clickedDelegate.hasListeners()) {
					this._clickedDelegate.fire(this._convertMouseParams(paramSupplier()));
				}
			},
			this
		);
		this._chartWidget.crosshairMoved().subscribe(
			(paramSupplier: MouseEventParamsImplSupplier<HorzScaleItem>) => {
				if (this._crosshairMovedDelegate.hasListeners()) {
					this._crosshairMovedDelegate.fire(this._convertMouseParams(paramSupplier()));
				}
			},
			this
		);

		const model = this._chartWidget.model();
		this._timeScaleApi = new TimeScaleApi(model, this._chartWidget.timeAxisWidget(), this._horzScaleBehavior);
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
		if (this.autoSizeActive()) {
			// We return early here instead of checking this within the actual _chartWidget.resize method
			// because this should only apply to external resize requests.
			warn(`Height and width values ignored because 'autoSize' option is enabled.`);
			return;
		}
		this._chartWidget.resize(width, height, forceRepaint);
	}

	public addAreaSeries(options?: AreaSeriesPartialOptions): ISeriesApi<'Area', HorzScaleItem> {
		return this._addSeriesImpl('Area', areaStyleDefaults, options);
	}

	public addBaselineSeries(options?: BaselineSeriesPartialOptions): ISeriesApi<'Baseline', HorzScaleItem> {
		return this._addSeriesImpl('Baseline', baselineStyleDefaults, options);
	}

	public addBarSeries(options?: BarSeriesPartialOptions): ISeriesApi<'Bar', HorzScaleItem> {
		return this._addSeriesImpl('Bar', barStyleDefaults, options);
	}

	public addCandlestickSeries(options: CandlestickSeriesPartialOptions = {}): ISeriesApi<'Candlestick', HorzScaleItem> {
		fillUpDownCandlesticksColors(options);

		return this._addSeriesImpl('Candlestick', candlestickStyleDefaults, options);
	}

	public addHistogramSeries(options?: HistogramSeriesPartialOptions): ISeriesApi<'Histogram', HorzScaleItem> {
		return this._addSeriesImpl('Histogram', histogramStyleDefaults, options);
	}

	public addLineSeries(options?: LineSeriesPartialOptions): ISeriesApi<'Line', HorzScaleItem> {
		return this._addSeriesImpl('Line', lineStyleDefaults, options);
	}

	public removeSeries(seriesApi: SeriesApi<SeriesType, HorzScaleItem>): void {
		const series = ensureDefined(this._seriesMap.get(seriesApi));

		const update = this._dataLayer.removeSeries(series);
		const model = this._chartWidget.model();
		model.removeSeries(series);

		this._sendUpdateToChart(update);

		this._seriesMap.delete(seriesApi);
		this._seriesMapReversed.delete(series);
	}

	public applyNewData<TSeriesType extends SeriesType>(series: Series<TSeriesType, HorzScaleItem>, data: SeriesDataItemTypeMap<HorzScaleItem>[TSeriesType][]): void {
		this._sendUpdateToChart(this._dataLayer.setSeriesData(series, data));
	}

	public updateData<TSeriesType extends SeriesType>(series: Series<TSeriesType, HorzScaleItem>, data: SeriesDataItemTypeMap<HorzScaleItem>[TSeriesType]): void {
		this._sendUpdateToChart(this._dataLayer.updateSeriesData(series, data));
	}

	public subscribeClick(handler: MouseEventHandler<HorzScaleItem>): void {
		this._clickedDelegate.subscribe(handler);
	}

	public unsubscribeClick(handler: MouseEventHandler<HorzScaleItem>): void {
		this._clickedDelegate.unsubscribe(handler);
	}

	public subscribeCrosshairMove(handler: MouseEventHandler<HorzScaleItem>): void {
		this._crosshairMovedDelegate.subscribe(handler);
	}

	public unsubscribeCrosshairMove(handler: MouseEventHandler<HorzScaleItem>): void {
		this._crosshairMovedDelegate.unsubscribe(handler);
	}

	public priceScale(priceScaleId: string): IPriceScaleApi {
		return new PriceScaleApi(this._chartWidget, priceScaleId);
	}

	public timeScale(): ITimeScaleApi<HorzScaleItem> {
		return this._timeScaleApi;
	}

	public applyOptions(options: DeepPartial<ChartOptions<HorzScaleItem>>): void {
		this._chartWidget.applyOptions(toInternalOptions(options));
	}

	public options(): Readonly<ChartOptions<HorzScaleItem>> {
		return this._chartWidget.options() as Readonly<ChartOptions<HorzScaleItem>>;
	}

	public takeScreenshot(): HTMLCanvasElement {
		return this._chartWidget.takeScreenshot();
	}

	public autoSizeActive(): boolean {
		return this._chartWidget.autoSizeActive();
	}

	private _addSeriesImpl<TSeries extends SeriesType>(
		type: TSeries,
		styleDefaults: SeriesStyleOptionsMap[TSeries],
		options: SeriesPartialOptionsMap[TSeries] = {}
	): ISeriesApi<TSeries, HorzScaleItem> {
		patchPriceFormat(options.priceFormat);

		const strictOptions = merge(clone(seriesOptionsDefaults), clone(styleDefaults), options) as SeriesOptionsMap[TSeries];
		const series = this._chartWidget.model().createSeries(type, strictOptions);

		const res = new SeriesApi<TSeries, HorzScaleItem>(series, this, this, this._horzScaleBehavior);
		this._seriesMap.set(res, series);
		this._seriesMapReversed.set(series, res);

		return res;
	}

	private _sendUpdateToChart(update: DataUpdateResponse<HorzScaleItem>): void {
		const model = this._chartWidget.model();

		model.updateTimeScale(update.timeScale.baseIndex, update.timeScale.points, update.timeScale.firstChangedPointIndex);
		update.series.forEach((value: SeriesChanges<HorzScaleItem>, series: Series<SeriesType, HorzScaleItem>) => series.setData(value.data, value.info));

		model.recalculateAllPanes();
	}

	private _mapSeriesToApi(series: Series<SeriesType, HorzScaleItem>): ISeriesApi<SeriesType, HorzScaleItem> {
		return ensureDefined(this._seriesMapReversed.get(series));
	}

	private _convertMouseParams(param: MouseEventParamsImpl<HorzScaleItem>): MouseEventParams<HorzScaleItem> {
		const seriesData: MouseEventParams<HorzScaleItem>['seriesData'] = new Map();
		param.seriesData.forEach((plotRow: SeriesPlotRow<SeriesType, HorzScaleItem>, series: Series<SeriesType, HorzScaleItem>) => {
			const data = getSeriesDataCreator<SeriesType, HorzScaleItem>(series.seriesType())(plotRow);
			assert(isFulfilledData(data));
			seriesData.set(this._mapSeriesToApi(series), data);
		});

		const hoveredSeries = param.hoveredSeries === undefined ? undefined : this._mapSeriesToApi(param.hoveredSeries);

		return {
			time: param.time,
			logical: param.index as Logical | undefined,
			point: param.point,
			hoveredSeries,
			hoveredObjectId: param.hoveredObject,
			seriesData,
			sourceEvent: param.touchMouseEventData,
		};
	}
}
