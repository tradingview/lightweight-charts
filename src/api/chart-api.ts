/// <reference types="_build-time-constants" />
import { ChartWidget, MouseEventParamsImpl, MouseEventParamsImplSupplier } from '../gui/chart-widget';

import { lowerBound } from '../helpers/algorithms';
import { assert, ensure, ensureDefined } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { warn } from '../helpers/logger';
import { clone, DeepPartial, isBoolean, merge } from '../helpers/strict-type-checks';

import { ChartOptionsImpl, ChartOptionsInternal } from '../model/chart-model';
import { DataUpdatesConsumer, isFulfilledBarData, isFulfilledData, LineData, OhlcData, SeriesDataItemTypeMap, WhitespaceData } from '../model/data-consumer';
import { DataLayer, DataUpdateResponse, SeriesChanges } from '../model/data-layer';
import { CustomData, ICustomSeriesPaneView } from '../model/icustom-series';
import { IHorzScaleBehavior } from '../model/ihorz-scale-behavior';
import { IPanePrimitiveBase } from '../model/ipane-primitive';
import { Pane } from '../model/pane';
import { PlotRowValueIndex } from '../model/plot-data';
import { Series } from '../model/series';
import { SeriesPlotRow } from '../model/series-data';
import {
    CandlestickStyleOptions,
    CustomSeriesOptions,
    CustomSeriesPartialOptions,
    fillUpDownCandlesticksColors,
    precisionByMinMove,
    PriceFormat,
    PriceFormatBuiltIn,
    SeriesOptionsMap,
    SeriesPartialOptions,
    SeriesPartialOptionsMap,
    SeriesType,
} from '../model/series-options';
import { createCustomSeriesDefinition } from '../model/series/custom-series';
import { lineSeries } from '../model/series/line-series';
import { isSeriesDefinition, SeriesDefinition } from '../model/series/series-def';
import { Logical } from '../model/time-data';

import { WebGLRenderableSeries } from '../gl/layers';
import { CustomWebGLSeriesOptions, ICustomWebGLSeriesPaneView, IGLSeriesApi } from '../gl/public';
import { IWebGLPaneContext } from '../gl/types';
import { getSeriesDataCreator } from './get-series-data-creator';
import { IChartApiBase, MouseEventHandler, MouseEventParams, PaneSize } from './ichart-api';
import { IPaneApi } from './ipane-api';
import { IPriceScaleApi } from './iprice-scale-api';
import { ISeriesApi } from './iseries-api';
import { ITimeScaleApi } from './itime-scale-api';
import { chartOptionsDefaults } from './options/chart-options-defaults';
import { seriesOptionsDefaults } from './options/series-options-defaults';
import { PaneApi } from './pane-api';
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
	if (isBoolean(options['handleScale'])) {
		const handleScale = options['handleScale'];
		options['handleScale'] = {
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
	} else if (options['handleScale'] !== undefined) {
		const { axisPressedMouseMove, axisDoubleClickReset } = options['handleScale'];
		if (isBoolean(axisPressedMouseMove)) {
			options['handleScale'].axisPressedMouseMove = {
				time: axisPressedMouseMove,
				price: axisPressedMouseMove,
			};
		}
		if (isBoolean(axisDoubleClickReset)) {
			options['handleScale'].axisDoubleClickReset = {
				time: axisDoubleClickReset,
				price: axisDoubleClickReset,
			};
		}
	}

	const handleScroll = options['handleScroll'];
	if (isBoolean(handleScroll)) {
		options['handleScroll'] = {
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
	protected readonly _horzScaleBehavior: IHorzScaleBehavior<HorzScaleItem>;

	private _chartWidget: ChartWidget<HorzScaleItem>;
	private _dataLayer: DataLayer<HorzScaleItem>;
	private readonly _seriesMap: Map<SeriesApi<SeriesType, HorzScaleItem>, Series<SeriesType>> = new Map();
	private readonly _seriesMapReversed: Map<Series<SeriesType>, SeriesApi<SeriesType, HorzScaleItem>> = new Map();

	private readonly _clickedDelegate: Delegate<MouseEventParams<HorzScaleItem>> = new Delegate();
	private readonly _dblClickedDelegate: Delegate<MouseEventParams<HorzScaleItem>> = new Delegate();
	private readonly _crosshairMovedDelegate: Delegate<MouseEventParams<HorzScaleItem>> = new Delegate();

	private readonly _timeScaleApi: TimeScaleApi<HorzScaleItem>;
	private readonly _panes: WeakMap<Pane, PaneApi<HorzScaleItem>> = new WeakMap();
	// callbacks to rebuild GL logical indices when time scale points change (data union changes)
	// @TODO: this is a hack to get GL series to rebuild logical indices when time scale points change (data union changes)
	private readonly _glRebuildListeners: Set<() => void> = new Set();

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

		this._glRebuildListeners.clear();
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
		TPartialOptions extends CustomSeriesPartialOptions = SeriesPartialOptions<TOptions>,
	>(
		customPaneView: ICustomSeriesPaneView<HorzScaleItem, TData, TOptions>,
		options: SeriesPartialOptions<TOptions> = {},
		paneIndex: number = 0
	): ISeriesApi<'Custom', HorzScaleItem, TData, TOptions, TPartialOptions> {
		const paneView = ensure(customPaneView);
		const definition = createCustomSeriesDefinition<HorzScaleItem, TData, TOptions>(paneView);
		return this._addSeriesImpl<'Custom', TData, TOptions, TPartialOptions>(
			definition,
			options,
			paneIndex
		);
	}

	public addSeries<T extends SeriesType>(
		definition: SeriesDefinition<T>,
		options: SeriesPartialOptionsMap[T] = {},
		paneIndex: number = 0
    ): ISeriesApi<T, HorzScaleItem> {
		return this._addSeriesImpl<T>(
				definition,
				options,
				paneIndex
			);
	}

	public addCustomWebGLSeries<
		TOptions extends CustomWebGLSeriesOptions = CustomWebGLSeriesOptions
	>(
		view: ICustomWebGLSeriesPaneView<TOptions>,
		options: Partial<TOptions> = {},
		paneIndex: number = 0
	): IGLSeriesApi<TOptions> {
		const toOhlcArray = (data: unknown): OhlcData<HorzScaleItem>[] | null => {
			if (!Array.isArray(data) || data.length === 0) { return null; }
			const first = data[0] as unknown;
			return isFulfilledBarData(first as SeriesDataItemTypeMap<HorzScaleItem>[SeriesType])
				? (data as OhlcData<HorzScaleItem>[])
				: null;
		};

		while (this._chartWidget.paneWidgets().length <= paneIndex) {
			this.addPane(false);
		}
		const paneWidget = this._chartWidget.paneWidgets()[paneIndex];
		const baseOptions: TOptions = { ...(options as TOptions) };
		let mergedOptions: TOptions = baseOptions;
		let isDisposed = false;

		const renderable: WebGLRenderableSeries = {
			onInit: (ctx: IWebGLPaneContext): void => {
				try { view.onInit(ctx, mergedOptions as Readonly<TOptions>); } catch { /* ignore user errors */ }
			},
			onRender: (ctx: IWebGLPaneContext): void => {
				try { view.onRender(ctx); } catch { /* ignore user errors */ }
			},
			onDestroy: () => {
				try { view.onDestroy?.(); } catch { /* ignore user errors */ }
			},
			order: (options as { order?: number }).order ?? 0,
		};

		const registered = paneWidget.registerWebGLRenderable(renderable);
		if (!registered) {
			// eslint-disable-next-line no-console
			console.warn('[Lightweight Charts] WebGL layer is not available on this pane. addCustomWebGLSeries will be inactive.');
		}

		// Bridge: create a hidden standard Line series on the same pane to plug into scales and enable setData/update API.
		const hiddenLineApi = this._addSeriesImpl<'Line'>(lineSeries, { lineVisible: false }, paneIndex);
		const hiddenLineInternal = this._seriesMap.get(hiddenLineApi as unknown as SeriesApi<SeriesType, HorzScaleItem>);

		// OHLC handling when user sets OHLC data
		let cachedCandles: OhlcData<HorzScaleItem>[] | null = null;
		let inferredIsCandles: boolean | null = null;
		let currentLinePoints: { logicalIndex: number; price: number }[] = [];
		const instanceId = Math.random().toString(36).slice(2);

		const rebuildFromHiddenLine = (): void => {
			if (!hiddenLineInternal) { return; }
			const rows: readonly SeriesPlotRow<'Line'>[] = hiddenLineInternal.bars().rows();
			const points = rows.map((row: SeriesPlotRow<'Line'>) => ({ logicalIndex: (row.index as unknown as number), price: row.value[PlotRowValueIndex.Close] }));
			currentLinePoints = points;
			const ctx = paneWidget.getWebGLPaneContext();
			if (!ctx) { return; }
			try {
				if (inferredIsCandles && Array.isArray(cachedCandles) && cachedCandles.length > 0) {
					// Map cached candles to the hidden line's time indices for consistent unioned time scale
					const minLen = Math.min(rows.length, cachedCandles.length);
					const bars: { logicalIndex: number; open: number; high: number; low: number; close: number }[] = [];
					for (let i = 0; i < minLen; i++) {
						const c = cachedCandles[i];
						bars.push({ logicalIndex: (rows[i].index as unknown as number), open: c.open, high: c.high, low: c.low, close: c.close });
					}
					view.onUpdate?.(ctx, { bars } as unknown as Readonly<Partial<TOptions>>);
				} else {
					view.onUpdate?.(ctx, { points } as unknown as Readonly<Partial<TOptions>>);
				}
			} catch { /* ignore */ }
			ctx.requestRender(false);
		};

		rebuildFromHiddenLine();
		// Subscribe to data changes on the hidden line to keep GL in sync
		hiddenLineApi.subscribeDataChanged(() => rebuildFromHiddenLine());
		// Resync when time scale points set changes due to data union changes across series
		const unregisterGlRebuilder = this._registerGLRebuildListener(rebuildFromHiddenLine);

		// WebGL series hit test hack
		// Attach a lightweight hit-test primitive so hoveredObjectId works with GL series
		const pane = paneWidget.state();
		const glHitPrimitive: IPanePrimitiveBase<{ chart: IChartApiBase<HorzScaleItem>; requestUpdate: () => void }> = {
			attached: () => {},
			paneViews: () => [],
			hitTest: (x: number, y: number) => {
				const ts = this.timeScale();
				const logical = ts.coordinateToLogical(x as unknown as number);
				if (logical == null || currentLinePoints.length === 0) { return null; }
				const target = logical as unknown as number;
				const idx = lowerBound(currentLinePoints, target, (p: { logicalIndex: number }, val: number) => p.logicalIndex < val);
				let bestIdx = Math.min(Math.max(0, idx), currentLinePoints.length - 1);
				if (bestIdx > 0) {
					const prev = currentLinePoints[bestIdx - 1];
					if (Math.abs(prev.logicalIndex - target) < Math.abs(currentLinePoints[bestIdx].logicalIndex - target)) {
						bestIdx = bestIdx - 1;
					}
				}
				const l0 = Math.floor(currentLinePoints[bestIdx].logicalIndex);
				const c0 = ts.logicalToCoordinate(l0 as unknown as Logical);
				const c1 = ts.logicalToCoordinate((l0 + 1) as unknown as Logical);
				const pxPerIndex = (c0 != null && c1 != null) ? Math.abs(c1 - c0) : 10;
				const dxPx = Math.abs((target - currentLinePoints[bestIdx].logicalIndex) * pxPerIndex);
				const thresholdPx = 8;
				if (dxPx <= thresholdPx) {
					return { externalId: `gl-series:${instanceId}:${bestIdx}`, zOrder: 'normal' };
				}
				return null;
			},
		};
		pane.attachPrimitive(glHitPrimitive);

		// Build a result that is compatible with IGLSeriesApi but also exposes a subset of ISeriesApi for parity
		const apiCompat = {
			remove: () => {
				if (isDisposed) { return; }
				paneWidget.unregisterWebGLRenderable(renderable);
				try { view.onDestroy?.(); } catch { /* ignore user errors */ }
				try { this.removeSeries(hiddenLineApi as unknown as SeriesApi<SeriesType, HorzScaleItem>); } catch { /* noop */ }
				try { unregisterGlRebuilder(); } catch { /* noop */ }
				isDisposed = true;
			},
			applyOptions: (partial: Partial<TOptions>) => {
				mergedOptions = { ...mergedOptions, ...partial };
				const ctx = paneWidget.getWebGLPaneContext();
				if (ctx && view.onUpdate) {
					try { view.onUpdate(ctx, partial as Readonly<Partial<TOptions>>); } catch { /* ignore user errors */ }
					ctx.requestRender(false);
				}
				// update draw order if provided
				if (typeof (partial as { order?: number }).order === 'number') {
					(renderable as { order?: number }).order = (partial as { order?: number }).order;
				}
			},
			// ISeriesApi-compatible subset
			setData: (data: Parameters<ISeriesApi<'Line', HorzScaleItem>['setData']>[0]) => {
				const candles: OhlcData<HorzScaleItem>[] | null = toOhlcArray(data as unknown);
				inferredIsCandles = candles !== null;
				if (candles) {
					// seed time scale with close price from OHLC
					const lineSeed: LineData<HorzScaleItem>[] = candles.map((c: OhlcData<HorzScaleItem>) => ({ time: c.time, value: c.close }));
					hiddenLineApi.setData(lineSeed as Parameters<ISeriesApi<'Line', HorzScaleItem>['setData']>[0]);
					cachedCandles = candles;
					// mirror into GL bars using chart's time->index mapping to tolerate different time bases
					const bars: { logicalIndex: number; open: number; high: number; low: number; close: number }[] = [];
					for (let i = 0; i < cachedCandles.length; i++) {
						const cndl = cachedCandles[i];
						const idx = this.timeScale().timeToIndex(cndl.time as unknown as HorzScaleItem, true);
						if (idx != null) {
							bars.push({ logicalIndex: (idx as unknown as number), open: cndl.open, high: cndl.high, low: cndl.low, close: cndl.close });
						}
					}
					if (bars.length === 0) {
						// fallback to hidden-line rows order if time->index not yet available
						try {
							const rows: readonly SeriesPlotRow<'Line'>[] | undefined = hiddenLineInternal?.bars().rows();
							if (rows && rows.length > 0) {
								const minLen = Math.min(rows.length, cachedCandles.length);
								for (let i = 0; i < minLen; i++) {
									const row = rows[i];
									const c = cachedCandles[i];
									bars.push({ logicalIndex: (row.index as unknown as number), open: c.open, high: c.high, low: c.low, close: c.close });
								}
							}
						} catch { /* ignore mapping errors */ }
					}
					const ctx = paneWidget.getWebGLPaneContext();
					if (ctx && view.onUpdate) {
						try { view.onUpdate?.(ctx, { bars } as unknown as Readonly<Partial<TOptions>>); } catch { /* ignore */ }
						ctx.requestRender(false);
					}
				} else {
					cachedCandles = null;
					hiddenLineApi.setData(data);
					// let the generic rebuild reflect into GL (for line)
					rebuildFromHiddenLine();
				}
			},
			update: (bar: Parameters<ISeriesApi<'Line' | 'Candlestick', HorzScaleItem>['update']>[0], historicalUpdate?: boolean) => {
				if (inferredIsCandles) {
					const maybeCandle: unknown = bar as unknown;
					if (!isFulfilledBarData(maybeCandle as SeriesDataItemTypeMap<HorzScaleItem>[SeriesType])) {
						// fallback to line semantics if the shape doesn't match
						hiddenLineApi.update(bar as Parameters<ISeriesApi<'Line', HorzScaleItem>['update']>[0], historicalUpdate);
						rebuildFromHiddenLine();
						return;
					}
					const c: OhlcData<HorzScaleItem> = maybeCandle as OhlcData<HorzScaleItem>;
					// seed/update time scale with close
					const linePoint: LineData<HorzScaleItem> = { time: c.time, value: c.close };
					hiddenLineApi.update(linePoint as Parameters<ISeriesApi<'Line', HorzScaleItem>['update']>[0], historicalUpdate);
					if (!cachedCandles) { cachedCandles = []; }
					// append or replace last by time equality
					if (cachedCandles.length > 0 && cachedCandles[cachedCandles.length - 1].time === c.time) {
						cachedCandles[cachedCandles.length - 1] = c;
					} else {
						cachedCandles.push(c);
					}
					const bars: { logicalIndex: number; open: number; high: number; low: number; close: number }[] = [];
					for (let i = 0; i < cachedCandles.length; i++) {
						const x = cachedCandles[i];
						const idx = this.timeScale().timeToIndex(x.time as unknown as HorzScaleItem, true);
						if (idx != null) {
							bars.push({ logicalIndex: (idx as unknown as number), open: x.open, high: x.high, low: x.low, close: x.close });
						}
					}
					if (bars.length === 0) {
						try {
							const rows: readonly SeriesPlotRow<'Line'>[] | undefined = hiddenLineInternal?.bars().rows();
							if (rows && rows.length > 0) {
								const minLen = Math.min(rows.length, cachedCandles.length);
								for (let i = 0; i < minLen; i++) {
									const row = rows[i];
									const y = cachedCandles[i];
									bars.push({ logicalIndex: (row.index as unknown as number), open: y.open, high: y.high, low: y.low, close: y.close });
								}
							}
						} catch { /* ignore mapping errors */ }
					}
					const ctx = paneWidget.getWebGLPaneContext();
					if (ctx && view.onUpdate) {
						try { view.onUpdate?.(ctx, { bars } as unknown as Readonly<Partial<TOptions>>); } catch { /* ignore */ }
						ctx.requestRender(false);
					}
				} else {
					hiddenLineApi.update(bar as Parameters<ISeriesApi<'Line', HorzScaleItem>['update']>[0], historicalUpdate);
					rebuildFromHiddenLine();
				}
			},
			priceScale: (): IPriceScaleApi => hiddenLineApi.priceScale(),
			timeScale: (): ITimeScaleApi<HorzScaleItem> => this.timeScale(),
		};
		return apiCompat as unknown as IGLSeriesApi<TOptions>;
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

	public updateData<TSeriesType extends SeriesType>(series: Series<TSeriesType>, data: SeriesDataItemTypeMap<HorzScaleItem>[TSeriesType], historicalUpdate: boolean): void {
		this._sendUpdateToChart(this._dataLayer.updateSeriesData(series, data, historicalUpdate));
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

	public priceScale(priceScaleId: string, paneIndex: number = 0): IPriceScaleApi {
		return new PriceScaleApi(this._chartWidget, priceScaleId, paneIndex);
	}

	public timeScale(): ITimeScaleApi<HorzScaleItem> {
		return this._timeScaleApi;
	}

	public applyOptions(options: DeepPartial<ChartOptionsImpl<HorzScaleItem>>): void {
		if (process.env.NODE_ENV === 'development') {
			const colorSpace = options.layout?.colorSpace;
			if (colorSpace !== undefined && colorSpace !== this.options().layout.colorSpace) {
				throw new Error(`colorSpace option should not be changed once the chart has been created.`);
			}
			const colorParsers = options.layout?.colorParsers;
			if (colorParsers !== undefined && colorParsers !== this.options().layout.colorParsers) {
				throw new Error(`colorParsers option should not be changed once the chart has been created.`);
			}
		}
		this._chartWidget.applyOptions(toInternalOptions(options));
	}

	public options(): Readonly<ChartOptionsImpl<HorzScaleItem>> {
		return this._chartWidget.options() as Readonly<ChartOptionsImpl<HorzScaleItem>>;
	}

	public takeScreenshot(): HTMLCanvasElement {
		return this._chartWidget.takeScreenshot();
	}

	public addPane(preserveEmptyPane: boolean = false): IPaneApi<HorzScaleItem> {
		const pane = this._chartWidget.model().addPane();
		pane.setPreserveEmptyPane(preserveEmptyPane);
		return this._getPaneApi(pane);
	}

	public removePane(index: number): void {
		this._chartWidget.model().removePane(index);
	}

	public swapPanes(first: number, second: number): void {
		this._chartWidget.model().swapPanes(first, second);
	}

	public autoSizeActive(): boolean {
		return this._chartWidget.autoSizeActive();
	}

	public chartElement(): HTMLDivElement {
		return this._chartWidget.element();
	}

	public panes(): IPaneApi<HorzScaleItem>[] {
		return this._chartWidget.model().panes().map((pane: Pane) => this._getPaneApi(pane));
	}

	public paneSize(paneIndex: number = 0): PaneSize {
		const size = this._chartWidget.paneSize(paneIndex);
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

	public horzBehaviour(): IHorzScaleBehavior<HorzScaleItem> {
		return this._horzScaleBehavior;
	}

	private _addSeriesImpl<
		TSeries extends SeriesType,
		TData extends WhitespaceData<HorzScaleItem> = SeriesDataItemTypeMap<HorzScaleItem>[TSeries],
		TOptions extends SeriesOptionsMap[TSeries] = SeriesOptionsMap[TSeries],
		TPartialOptions extends SeriesPartialOptionsMap[TSeries] = SeriesPartialOptionsMap[TSeries]
	>(
		definition: SeriesDefinition<TSeries>,
		options: SeriesPartialOptionsMap[TSeries] = {},
		paneIndex: number = 0
	): ISeriesApi<TSeries, HorzScaleItem, TData, TOptions, TPartialOptions> {
		assert(isSeriesDefinition<TSeries>(definition));
		patchPriceFormat(options.priceFormat);
		if (definition.type === 'Candlestick') {
			fillUpDownCandlesticksColors(options as DeepPartial<CandlestickStyleOptions>);
		}
		const strictOptions = merge(clone(seriesOptionsDefaults), clone(definition.defaultOptions), options) as SeriesOptionsMap[TSeries];
		const createPaneView = definition.createPaneView;
		const series = new Series(this._chartWidget.model(), definition.type, strictOptions, createPaneView, definition.customPaneView);
		this._chartWidget.model().addSeriesToPane(
			series,
			paneIndex
		);
		const res = new SeriesApi<TSeries, HorzScaleItem, TData, TOptions, TPartialOptions>(series, this, this, this, this._horzScaleBehavior, (pane: Pane) => this._getPaneApi(pane));
		this._seriesMap.set(res, series);
		this._seriesMapReversed.set(series, res);

		return res;
	}

	private _sendUpdateToChart(update: DataUpdateResponse): void {
		const model = this._chartWidget.model();

		model.updateTimeScale(update.timeScale.baseIndex, update.timeScale.points, update.timeScale.firstChangedPointIndex);
		update.series.forEach((value: SeriesChanges, series: Series<SeriesType>) => series.setData(value.data, value.info));

		model.timeScale().recalculateIndicesWithData();
		model.recalculateAllPanes();

		// Notify GL series to rebuild logical indices after union of time scale points changes
		if (update.timeScale.points !== undefined) {
			for (const cb of this._glRebuildListeners) {
				try { cb(); } catch { /* ignore */ }
			}
		}
	}

	// Store a rebuild callback and return unregister function
	private _registerGLRebuildListener(cb: () => void): () => void {
		this._glRebuildListeners.add(cb);
		return () => { this._glRebuildListeners.delete(cb); };
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
			logical: param.index as unknown as Logical | undefined,
			point: param.point,
			paneIndex: param.paneIndex,
			hoveredSeries,
			hoveredObjectId: param.hoveredObject,
			seriesData,
			sourceEvent: param.touchMouseEventData,
		};
	}

	private _getPaneApi(pane: Pane): PaneApi<HorzScaleItem> {
		let result = this._panes.get(pane);
		if (!result) {
			result = new PaneApi(this._chartWidget, (series: Series<SeriesType>) => this._mapSeriesToApi(series), pane, this);
			this._panes.set(pane, result);
		}

		return result;
	}
}
