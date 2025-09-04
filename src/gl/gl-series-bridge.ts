import type { IPriceScaleApi } from '../api/iprice-scale-api';
import type { ISeriesApi } from '../api/iseries-api';
import type { ITimeScaleApi } from '../api/itime-scale-api';

import type { PaneWidget } from '../gui/pane-widget';

import { lowerBound } from '../helpers/algorithms';

import type { OhlcData } from '../model/data-consumer';
import { PlotRowValueIndex } from '../model/plot-data';
import type { Series } from '../model/series';
import type { SeriesPlotRow } from '../model/series-data';
import { SeriesType } from '../model/series-options';

import { hitTestCandle, hitTestLine } from './hittest';
import type { WebGLRenderableSeries } from './layers';
import type { CustomWebGLSeriesOptions, ICustomWebGLSeriesPaneView } from './public';
import type { IWebGLPaneContext } from './types';
import { isOhlcRecord, mapCandlesToBars } from './utils';

export interface GLSeriesBridgeDeps<HorzScaleItem, TOptions extends CustomWebGLSeriesOptions> {
	readonly paneWidget: PaneWidget;
	readonly paneIndex: number;
	readonly view: ICustomWebGLSeriesPaneView<TOptions>;
	readonly initialOptions: Readonly<TOptions>;
	readonly timeScale: () => ITimeScaleApi<HorzScaleItem>;
	readonly getHiddenInternal: (api: ISeriesApi<SeriesType, HorzScaleItem> | null) => Series<SeriesType> | undefined;
	readonly addHiddenLineSeed: () => ISeriesApi<'Line', HorzScaleItem> | null;
	readonly addHiddenCandleSeed: () => ISeriesApi<'Candlestick', HorzScaleItem> | null;
	readonly removeSeries: (api: ISeriesApi<SeriesType, HorzScaleItem>) => void;
	readonly registerRebuildListener: (cb: () => void) => () => void;
	readonly priceScaleFallback: () => IPriceScaleApi;
}

export class GLSeriesBridge<HorzScaleItem, TOptions extends CustomWebGLSeriesOptions> {
	private readonly _paneWidget: PaneWidget;
	private readonly _view: ICustomWebGLSeriesPaneView<TOptions>;
	private _options: TOptions;
	private readonly _timeScale: () => ITimeScaleApi<HorzScaleItem>;
	private readonly _getHiddenInternal: (api: ISeriesApi<SeriesType, HorzScaleItem> | null) => Series<SeriesType> | undefined;
	private readonly _addHiddenLineSeed: () => ISeriesApi<'Line', HorzScaleItem> | null;
	private readonly _addHiddenCandleSeed: () => ISeriesApi<'Candlestick', HorzScaleItem> | null;
	private readonly _removeSeries: (api: ISeriesApi<SeriesType, HorzScaleItem>) => void;
	private readonly _registerRebuildListener: (cb: () => void) => () => void;
	private readonly _priceScaleFallback: () => IPriceScaleApi;

	private _hiddenLineApi: ISeriesApi<'Line', HorzScaleItem> | null = null;
	private _hiddenCandleApi: ISeriesApi<'Candlestick', HorzScaleItem> | null = null;
	private _cachedCandles: OhlcData<HorzScaleItem>[] | null = null;
	private _inferredIsCandles: boolean | null = null;
	private _currentLinePoints: { logicalIndex: number; price: number }[] = [];
	private _instanceId: string = Math.random().toString(36).slice(2);
	private _unregisterRebuilder: (() => void) | null = null;
	private _disposed: boolean = false;

	public constructor(deps: GLSeriesBridgeDeps<HorzScaleItem, TOptions>) {
		this._paneWidget = deps.paneWidget;
		this._view = deps.view;
		this._options = { ...(deps.initialOptions as TOptions) };
		this._timeScale = deps.timeScale;
		this._getHiddenInternal = deps.getHiddenInternal;
		this._addHiddenLineSeed = deps.addHiddenLineSeed;
		this._addHiddenCandleSeed = deps.addHiddenCandleSeed;
		this._removeSeries = deps.removeSeries;
		this._registerRebuildListener = deps.registerRebuildListener;
		this._priceScaleFallback = deps.priceScaleFallback;
	}

	public createRenderable(): WebGLRenderableSeries {
		return {
			onInit: (ctx: IWebGLPaneContext): void => {
				try { this._view.onInit(ctx, this._options as Readonly<TOptions>); } catch { /* ignore user errors */ }
			},
			onRender: (ctx: IWebGLPaneContext): void => {
				try { this._view.onRender(ctx); } catch { /* ignore user errors */ }
			},
			onDestroy: () => { try { this._view.onDestroy?.(); } catch { /* ignore user errors */ } },
			order: (this._options as { order?: number }).order ?? 0,
			hitTest: (ctx: IWebGLPaneContext, xCss: number, yCss: number) => {
				const ts = this._timeScale();
				if (this._currentLinePoints.length === 0) { return null; }
				const logical = ts.coordinateToLogical(xCss as unknown as number);
				if (logical == null) { return null; }
				const target = logical as unknown as number;
				const idx = lowerBound(this._currentLinePoints, target, (p: { logicalIndex: number }, val: number) => p.logicalIndex < val);
				let bestIdx = Math.min(Math.max(0, idx), this._currentLinePoints.length - 1);
				if (bestIdx > 0) {
					const prev = this._currentLinePoints[bestIdx - 1];
					if (Math.abs(prev.logicalIndex - target) < Math.abs(this._currentLinePoints[bestIdx].logicalIndex - target)) {
						bestIdx = bestIdx - 1;
					}
				}
				const threshold = (this._options as { hitTestThresholdPx?: number }).hitTestThresholdPx ?? 6;
				const zOrder = (this._options as { hitTestZOrder?: 'top' | 'normal' | 'bottom' }).hitTestZOrder ?? 'normal';
				const cursorStyle = (this._options as { hitTestCursorStyle?: string }).hitTestCursorStyle;
				if (this._inferredIsCandles && Array.isArray(this._cachedCandles) && this._cachedCandles.length > 0) {
					const l0 = Math.floor(this._currentLinePoints[bestIdx].logicalIndex);
					const r = hitTestCandle({ bestIdx, l0, x: xCss, y: yCss, thresholdPx: threshold, ts, ctx, candles: this._cachedCandles, instanceId: this._instanceId });
					return r ? { externalId: r.externalId, zOrder, cursorStyle } : null;
				}
				const r = hitTestLine({ bestIdx, targetLogical: target, x: xCss, y: yCss, thresholdPx: threshold, ts, ctx, points: this._currentLinePoints, instanceId: this._instanceId });
				return r ? { externalId: r.externalId, zOrder, cursorStyle } : null;
			},
		};
	}

	public registerLifecycle(renderable: WebGLRenderableSeries): void {
		if (this._unregisterRebuilder) { return; }
		this._rebuildFromHiddenSeed();
		this._unregisterRebuilder = this._registerRebuildListener(() => this._rebuildFromHiddenSeed());
		// Register in GL layer
		this._paneWidget.registerWebGLRenderable(renderable);
	}

	public dispose(renderable: WebGLRenderableSeries): void {
		if (this._disposed) { return; }
		this._paneWidget.unregisterWebGLRenderable(renderable);
		try { this._view.onDestroy?.(); } catch { /* ignore */ }
		if (this._hiddenLineApi) { try { this._removeSeries(this._hiddenLineApi); } catch { /* ignore */ } }
		if (this._unregisterRebuilder) { try { this._unregisterRebuilder(); } catch { /* ignore */ } }
		this._disposed = true;
	}

	public applyOptions(partial: Partial<TOptions>): void {
		this._options = { ...this._options, ...partial };
		const ctx = this._paneWidget.getWebGLPaneContext();
		if (ctx && this._view.onUpdate) {
			try { this._view.onUpdate(ctx, partial as Readonly<Partial<TOptions>>); } catch { /* ignore user errors */ }
			ctx.requestRender(false);
		}
	}

	public setDataLineOrCandle(data: unknown): void {
		const arr = Array.isArray(data) ? (data as unknown[]) : null;
		const candles = arr !== null && arr.length > 0 && isOhlcRecord<HorzScaleItem>(arr[0]) ? (data as OhlcData<HorzScaleItem>[]) : null;
		this._inferredIsCandles = candles !== null;
		if (candles) {
			this._ensureHiddenCandleSeed();
			if (this._hiddenLineApi) { try { this._removeSeries(this._hiddenLineApi); } catch { /* ignore */ } this._hiddenLineApi = null; }
			this._hiddenCandleApi?.setData(candles as Parameters<ISeriesApi<'Candlestick', HorzScaleItem>['setData']>[0]);
			this._cachedCandles = candles;
			const bars = mapCandlesToBars(this._cachedCandles, this._timeScale());
			const ctx = this._paneWidget.getWebGLPaneContext();
			if (ctx && this._view.onUpdate) {
				try { this._view.onUpdate?.(ctx, { bars } as unknown as Readonly<Partial<TOptions>>); } catch { /* ignore */ }
				ctx.requestRender(false);
			}
		} else {
			this._cachedCandles = null;
			this._ensureHiddenLineSeed();
			this._hiddenLineApi?.setData(data as Parameters<ISeriesApi<'Line', HorzScaleItem>['setData']>[0]);
			if (this._hiddenCandleApi) { try { this._removeSeries(this._hiddenCandleApi); } catch { /* ignore */ } this._hiddenCandleApi = null; }
			this._rebuildFromHiddenSeed();
		}
	}

	public updateDataLineOrCandle(bar: unknown, historicalUpdate?: boolean): void {
		if (this._inferredIsCandles) {
			if (!this._isOhlcRecord(bar)) {
				if (this._hiddenLineApi) { this._hiddenLineApi.update(bar as Parameters<ISeriesApi<'Line', HorzScaleItem>['update']>[0], historicalUpdate); }
				this._rebuildFromHiddenSeed();
				return;
			}
			const c = bar;
			this._ensureHiddenCandleSeed();
			if (this._hiddenLineApi) { try { this._removeSeries(this._hiddenLineApi); } catch { /* ignore */ } this._hiddenLineApi = null; }
			this._hiddenCandleApi?.update(c as Parameters<ISeriesApi<'Candlestick', HorzScaleItem>['update']>[0], historicalUpdate);
			if (!this._cachedCandles) { this._cachedCandles = []; }
			if (this._cachedCandles.length > 0 && this._cachedCandles[this._cachedCandles.length - 1].time === c.time) {
				this._cachedCandles[this._cachedCandles.length - 1] = c;
			} else {
				this._cachedCandles.push(c);
			}
			const bars = mapCandlesToBars(this._cachedCandles, this._timeScale());
			const ctx = this._paneWidget.getWebGLPaneContext();
			if (ctx && this._view.onUpdate) {
				try { this._view.onUpdate?.(ctx, { bars } as unknown as Readonly<Partial<TOptions>>); } catch { /* ignore */ }
				ctx.requestRender(false);
			}
		} else {
			if (this._hiddenLineApi) { this._hiddenLineApi.update(bar as Parameters<ISeriesApi<'Line', HorzScaleItem>['update']>[0], historicalUpdate); }
			this._rebuildFromHiddenSeed();
		}
	}

	public getApiCompat(): { remove: () => void; applyOptions: (p: Partial<TOptions>) => void; setData: (data: unknown) => void; update: (bar: unknown, historicalUpdate?: boolean) => void; priceScale: () => IPriceScaleApi; timeScale: () => ITimeScaleApi<HorzScaleItem> } {
		return {
			remove: () => this.dispose(this.createRenderable()),
			applyOptions: (p: Partial<TOptions>) => this.applyOptions(p),
			setData: (data: unknown) => this.setDataLineOrCandle(data),
			update: (bar: unknown, historicalUpdate?: boolean) => this.updateDataLineOrCandle(bar, historicalUpdate),
			priceScale: (): IPriceScaleApi => {
				const s = this._hiddenCandleApi ?? this._hiddenLineApi;
				return s ? s.priceScale() : this._priceScaleFallback();
			},
			timeScale: (): ITimeScaleApi<HorzScaleItem> => this._timeScale(),
		};
	}

	private _isOhlcRecord(v: unknown): v is OhlcData<HorzScaleItem> {
		if (v === null || typeof v !== 'object') { return false; }
		const o = v as { open?: unknown; high?: unknown; low?: unknown; close?: unknown };
		return o.open !== undefined && o.high !== undefined && o.low !== undefined && o.close !== undefined;
	}

	private _ensureHiddenLineSeed(): void {
		if (!this._hiddenLineApi) { this._hiddenLineApi = this._addHiddenLineSeed(); }
	}

	private _ensureHiddenCandleSeed(): void {
		if (!this._hiddenCandleApi) { this._hiddenCandleApi = this._addHiddenCandleSeed(); }
	}

	private _rebuildFromHiddenSeed(): void {
		const api = (this._inferredIsCandles && this._hiddenCandleApi) ? this._hiddenCandleApi : this._hiddenLineApi;
		const hiddenInternal = this._getHiddenInternal(api);
		if (!hiddenInternal) { return; }
		const rows = hiddenInternal.bars().rows();
		const usingCandleSeed = !!(this._inferredIsCandles && this._hiddenCandleApi);
		const points = usingCandleSeed
			? rows.map((row: SeriesPlotRow<SeriesType>) => ({ logicalIndex: (row.index as unknown as number), price: 0 }))
			: (rows as readonly SeriesPlotRow<'Line'>[]).map((row: SeriesPlotRow<'Line'>) => ({ logicalIndex: (row.index as unknown as number), price: row.value[PlotRowValueIndex.Close] }));
		this._currentLinePoints = points;
		const ctx = this._paneWidget.getWebGLPaneContext();
		if (!ctx) { return; }
		try {
			if (this._inferredIsCandles && Array.isArray(this._cachedCandles) && this._cachedCandles.length > 0) {
				const bars = mapCandlesToBars(this._cachedCandles, this._timeScale());
				if (bars.length === 0) {
					const rows2 = hiddenInternal.bars().rows();
					if (rows2 && rows2.length > 0) {
						const minLen = Math.min(rows2.length, this._cachedCandles.length);
						for (let i = 0; i < minLen; i++) {
							const row = rows2[i];
							const c = this._cachedCandles[i];
							bars.push({ logicalIndex: (row.index as unknown as number), open: c.open, high: c.high, low: c.low, close: c.close });
						}
					}
				}
				this._view.onUpdate?.(ctx, { bars } as unknown as Readonly<Partial<TOptions>>);
			} else {
				this._view.onUpdate?.(ctx, { points } as unknown as Readonly<Partial<TOptions>>);
			}
		} catch { /* ignore */ }
		ctx.requestRender(false);
	}
}

