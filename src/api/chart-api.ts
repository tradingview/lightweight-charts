import { ChartWidget, MouseEventParamsImpl, MouseEventParamsImplSupplier } from '../gui/chart-widget';

import { assert, ensure, ensureDefined } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { warn } from '../helpers/logger';
import { clone, DeepPartial, isBoolean, merge } from '../helpers/strict-type-checks';

import { ChartOptionsImpl, ChartOptionsInternal } from '../model/chart-model';
import { DataUpdatesConsumer, isFulfilledData, SeriesDataItemTypeMap, WhitespaceData } from '../model/data-consumer';
import { DataLayer, DataUpdateResponse, SeriesChanges } from '../model/data-layer';
import { CustomData, ICustomSeriesPaneView } from '../model/icustom-series';
import { IHorzScaleBehavior } from '../model/ihorz-scale-behavior';
import { Series } from '../model/series';
import { SeriesPlotRow } from '../model/series-data';
import {
	AreaSeriesPartialOptions,
	BarSeriesPartialOptions,
	BaselineSeriesPartialOptions,
	CandlestickSeriesPartialOptions,
	CustomSeriesOptions,
	CustomSeriesPartialOptions,
	fillUpDownCandlesticksColors,
	HistogramSeriesPartialOptions,
	LineSeriesPartialOptions,
	precisionByMinMove,
	PriceFormat,
	PriceFormatBuiltIn,
	SeriesOptionsMap,
	SeriesPartialOptions,
	SeriesPartialOptionsMap,
	SeriesStyleOptionsMap,
	SeriesType,
} from '../model/series-options';
import { Logical } from '../model/time-data';

import { getSeriesDataCreator } from './get-series-data-creator';
import { IChartApiBase, MouseEventHandler, MouseEventParams, PaneSize } from './ichart-api';
import { IPriceScaleApi } from './iprice-scale-api';
import { ISeriesApi } from './iseries-api';
import { ITimeScaleApi } from './itime-scale-api';
import { chartOptionsDefaults } from './options/chart-options-defaults';
import {
	areaStyleDefaults,
	barStyleDefaults,
	baselineStyleDefaults,
	candlestickStyleDefaults,
	customStyleDefaults,
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

function migrateHandleScaleScrollOptions<HorzScaleItem>(options: DeepPartial<ChartOptionsImpl<HorzScaleItem>>): void {
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

function toInternalOptions<HorzScaleItem>(options: DeepPartial<ChartOptionsImpl<HorzScaleItem>>): DeepPartial<ChartOptionsInternal<HorzScaleItem>> {
	migrateHandleScaleScrollOptions(options);

	return options as DeepPartial<ChartOptionsInternal<HorzScaleItem>>;
}

export type IPriceScaleApiProvider<HorzScaleItem> = Pick<IChartApiBase<HorzScaleItem>, 'priceScale'>;

export class ChartApi<HorzScaleItem> implements IChartApiBase<HorzScaleItem>, DataUpdatesConsumer<SeriesType, HorzScaleItem> {
	private _chartWidget: ChartWidget<HorzScaleItem>;
	private _dataLayer: DataLayer<HorzScaleItem>;
	private readonly _seriesMap: Map<SeriesApi<SeriesType, HorzScaleItem>, Series<SeriesType>> = new Map();
	private readonly _seriesMapReversed: Map<Series<SeriesType>, SeriesApi<SeriesType, HorzScaleItem>> = new Map();

	private readonly _clickedDelegate: Delegate<MouseEventParams<HorzScaleItem>> = new Delegate();
	private readonly _dblClickedDelegate: Delegate<MouseEventParams<HorzScaleItem>> = new Delegate();
	private readonly _crosshairMovedDelegate: Delegate<MouseEventParams<HorzScaleItem>> = new Delegate();

	private readonly _timeScaleApi: TimeScaleApi<HorzScaleItem>;

	private readonly _horzScaleBehavior: IHorzScaleBehavior<HorzScaleItem>;

	public constructor(container: HTMLElement, horzScaleBehavior: IHorzScaleBehavior<HorzScaleItem>, options?: DeepPartial<ChartOptionsImpl<HorzScaleItem>>) {
		this._dataLayer = new DataLayer<HorzScaleItem>(horzScaleBehavior);
		const internalOptions = (options === undefined) ?
			clone(chartOptionsDefaults<HorzScaleItem>()) :
			merge(clone(chartOptionsDefaults()), toInternalOptions(options)) as ChartOptionsInternal<HorzScaleItem>;

		this._horzScaleBehavior = horzScaleBehavior;
		this._chartWidget = new ChartWidget(container, internalOptions, horzScaleBehavior);

		this._chartWidget.clicked().subscribe(
			(paramSupplier: MouseEventParamsImplSupplier) => {
				if (this._clickedDelegate.hasListeners()) {
					this._clickedDelegate.fire(this._convertMouseParams(paramSupplier()));
				}
			},
			this
		);
		this._chartWidget.dblClicked().subscribe(
			(paramSupplier: MouseEventParamsImplSupplier) => {
				if (this._dblClickedDelegate.hasListeners()) {
					this._dblClickedDelegate.fire(this._convertMouseParams(paramSupplier()));
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
		this._timeScaleApi = new TimeScaleApi(model, this._chartWidget.timeAxisWidget(), this._horzScaleBehavior);
	}

	public remove(): void {
		this._chartWidget.clicked().unsubscribeAll(this);
		this._chartWidget.dblClicked().unsubscribeAll(this);
		this._chartWidget.crosshairMoved().unsubscribeAll(this);

		this._timeScaleApi.destroy();
		this._chartWidget.destroy();

		this._seriesMap.clear();
		this._seriesMapReversed.clear();

		this._clickedDelegate.destroy();
		this._dblClickedDelegate.destroy();
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

	public addCustomSeries<
		TData extends CustomData<HorzScaleItem>,
		TOptions extends CustomSeriesOptions,
		TPartialOptions extends CustomSeriesPartialOptions = SeriesPartialOptions<TOptions>
	>(
		customPaneView: ICustomSeriesPaneView<HorzScaleItem, TData, TOptions>,
		options?: SeriesPartialOptions<TOptions>
	): ISeriesApi<'Custom', HorzScaleItem, TData, TOptions, TPartialOptions> {
		const paneView = ensure(customPaneView);
		const defaults = {
			...customStyleDefaults,
			...paneView.defaultOptions(),
		};
		return this._addSeriesImpl<'Custom', TData, TOptions, TPartialOptions>(
			'Custom',
			defaults,
			options,
			paneView
		);
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

	public applyNewData<TSeriesType extends SeriesType>(series: Series<TSeriesType>, data: SeriesDataItemTypeMap<HorzScaleItem>[TSeriesType][]): void {
		this._sendUpdateToChart(this._dataLayer.setSeriesData(series, data));
	}

	public updateData<TSeriesType extends SeriesType>(series: Series<TSeriesType>, data: SeriesDataItemTypeMap<HorzScaleItem>[TSeriesType]): void {
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

	public subscribeDblClick(handler: MouseEventHandler<HorzScaleItem>): void {
		this._dblClickedDelegate.subscribe(handler);
	}

	public unsubscribeDblClick(handler: MouseEventHandler<HorzScaleItem>): void {
		this._dblClickedDelegate.unsubscribe(handler);
	}

	public priceScale(priceScaleId: string): IPriceScaleApi {
		return new PriceScaleApi(this._chartWidget, priceScaleId);
	}

	public timeScale(): ITimeScaleApi<HorzScaleItem> {
		return this._timeScaleApi;
	}

	public applyOptions(options: DeepPartial<ChartOptionsImpl<HorzScaleItem>>): void {
		this._chartWidget.applyOptions(toInternalOptions(options));
	}

	public options(): Readonly<ChartOptionsImpl<HorzScaleItem>> {
		return this._chartWidget.options() as Readonly<ChartOptionsImpl<HorzScaleItem>>;
	}

	public takeScreenshot(): HTMLCanvasElement {
		return this._chartWidget.takeScreenshot();
	}

	public autoSizeActive(): boolean {
		return this._chartWidget.autoSizeActive();
	}

	public chartElement(): HTMLDivElement {
		return this._chartWidget.element();
	}

	public paneSize(): PaneSize {
		const size = this._chartWidget.paneSize();
		return {
			height: size.height,
			width: size.width,
		};
	}

	public setCrosshairPosition(price: number, horizontalPosition: HorzScaleItem, seriesApi: ISeriesApi<SeriesType, HorzScaleItem>): void {
		const series = this._seriesMap.get(seriesApi as SeriesApi<SeriesType, HorzScaleItem>);

		if (series === undefined) {
			return;
		}

		const pane = this._chartWidget.model().paneForSource(series);

		if (pane === null) {
			return;
		}

		this._chartWidget.model().setAndSaveSyntheticPosition(price, horizontalPosition, pane);
	}

	public clearCrosshairPosition(): void {
		this._chartWidget.model().clearCurrentPosition(true);
	}

	private _addSeriesImpl<
		TSeries extends SeriesType,
		TData extends WhitespaceData<HorzScaleItem> = SeriesDataItemTypeMap<HorzScaleItem>[TSeries],
		TOptions extends SeriesOptionsMap[TSeries] = SeriesOptionsMap[TSeries],
		TPartialOptions extends SeriesPartialOptionsMap[TSeries] = SeriesPartialOptionsMap[TSeries]
	>(
		type: TSeries,
		styleDefaults: SeriesStyleOptionsMap[TSeries],
		options: SeriesPartialOptionsMap[TSeries] = {},
		customPaneView?: ICustomSeriesPaneView<HorzScaleItem>
	): ISeriesApi<TSeries, HorzScaleItem, TData, TOptions, TPartialOptions> {
		patchPriceFormat(options.priceFormat);

		const strictOptions = merge(clone(seriesOptionsDefaults), clone(styleDefaults), options) as SeriesOptionsMap[TSeries];
		const series = this._chartWidget.model().createSeries(type, strictOptions, customPaneView);

		const res = new SeriesApi<TSeries, HorzScaleItem, TData, TOptions, TPartialOptions>(series, this, this, this, this._horzScaleBehavior);
		this._seriesMap.set(res, series);
		this._seriesMapReversed.set(series, res);

		return res;
	}

	private _sendUpdateToChart(update: DataUpdateResponse): void {
		const model = this._chartWidget.model();

		model.updateTimeScale(update.timeScale.baseIndex, update.timeScale.points, update.timeScale.firstChangedPointIndex);
		update.series.forEach((value: SeriesChanges, series: Series<SeriesType>) => series.setData(value.data, value.info));

		model.recalculateAllPanes();
	}

	private _mapSeriesToApi(series: Series<SeriesType>): ISeriesApi<SeriesType, HorzScaleItem> {
		return ensureDefined(this._seriesMapReversed.get(series));
	}

	private _convertMouseParams(param: MouseEventParamsImpl): MouseEventParams<HorzScaleItem> {
		const seriesData: MouseEventParams<HorzScaleItem>['seriesData'] = new Map();
		param.seriesData.forEach((plotRow: SeriesPlotRow<SeriesType>, series: Series<SeriesType>) => {
			const seriesType = series.seriesType();
			const data = getSeriesDataCreator<SeriesType, HorzScaleItem>(seriesType)(plotRow);
			if (seriesType !== 'Custom') {
				assert(isFulfilledData(data));
			} else {
				const customWhitespaceChecker = series.customSeriesWhitespaceCheck();
				assert(!customWhitespaceChecker || customWhitespaceChecker(data) === false);
			}
			seriesData.set(this._mapSeriesToApi(series), data);
		});

		const hoveredSeries =
			param.hoveredSeries === undefined ||
			!this._seriesMapReversed.has(param.hoveredSeries)
				? undefined
				: this._mapSeriesToApi(param.hoveredSeries);

		return {
			time: param.originalTime as HorzScaleItem,
			logical: param.index as Logical | undefined,
			point: param.point,
			hoveredSeries,
			hoveredObjectId: param.hoveredObject,
			seriesData,
			sourceEvent: param.touchMouseEventData,
		};
	}
}
