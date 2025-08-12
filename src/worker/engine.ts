/* tslint:disable: no-any no-unsafe-any no-unsafe-member-access typedef member-access align ter-indent */
import { chartOptionsDefaults } from '../api/options/chart-options-defaults';
import { seriesOptionsDefaults } from '../api/options/series-options-defaults';

import { ChartModel } from '../model/chart-model';
import { DataLayer, DataUpdateResponse, SeriesChanges } from '../model/data-layer';
import { HorzScaleBehaviorTime } from '../model/horz-scale-behavior-time/horz-scale-behavior-time';
import { InvalidateMask, InvalidationLevel, TimeScaleInvalidationType } from '../model/invalidate-mask';
import { Pane } from '../model/pane';
import { RangeImpl } from '../model/range-impl';
import { Series } from '../model/series';
import { SeriesType } from '../model/series-options';
import { areaSeries as AreaSeriesDef } from '../model/series/area-series';
import { barSeries as BarSeriesDef } from '../model/series/bar-series';
import { candlestickSeries as CandlestickSeriesDef } from '../model/series/candlestick-series';
import { histogramSeries as HistogramSeriesDef } from '../model/series/histogram-series';
import { lineSeries as LineSeriesDef } from '../model/series/line-series';
import { SeriesDefinitionInternal } from '../model/series/series-def';

export interface WorkerEngineInit {
	width: number;
	height: number;
}

export class WorkerEngine {
    public readonly model: ChartModel<unknown>;
    private readonly _dataLayer: DataLayer<unknown>;
    private readonly _seriesById: Map<string, Series<SeriesType>> = new Map();
    private _pane: Pane;
    private _width = 0;
    private _height = 0;

    public constructor(init: WorkerEngineInit) {
		// Build full chart defaults and ensure HorzScaleBehaviorTime gets options before use
		const chartDefaults = chartOptionsDefaults<unknown>();
		const horz = new HorzScaleBehaviorTime();
		// Provide complete chart options including localization/timeScale to the behavior
		horz.setOptions(chartDefaults as unknown as import('../model/horz-scale-behavior-time/time-based-chart-options').TimeChartOptions);
        this.model = new ChartModel(this._onInvalidate, chartDefaults as unknown as import('../model/chart-model').ChartOptionsInternal<unknown>, horz);
        this._dataLayer = new DataLayer(horz);
        // ensure initial full update
		this.model.fullUpdate();
        // create default pane and set initial sizes
        this._pane = this.model.panes()[0] ?? this.model.addPane();
        this._width = init.width;
        this._height = init.height;
        this.model.setWidth(this._width);
        this.model.setPaneHeight(this._pane, this._height);

        // Broadcast initial visible logical range and subscribe for further changes
        try { this._postVisibleLogicalRange(); } catch { /* ignore */ }
        try {
            this.model.timeScale().logicalRangeChanged().subscribe(() => {
                this._postVisibleLogicalRange();
            }, this);
        } catch { /* ignore */ }
        // Broadcast initial visible time range and subscribe to changes
        try { this._postVisibleTimeRange(); } catch { /* ignore */ }
        try {
            this.model.timeScale().visibleBarsChanged().subscribe(() => {
                this._postVisibleTimeRange();
            }, this);
        } catch { /* ignore */ }
	}

    public setWidth(width: number): void {
        this._width = width;
        this.model.setWidth(this._width);
	}

    public setHeight(height: number): void {
        this._height = height;
        this.model.setPaneHeight(this._pane, this._height);
	}

	public invalidateFull(): void {
		this.model.fullUpdate();
	}

	public addSeries(seriesId: string, type: 'Line'|'Area'|'Histogram'|'Candlestick'|'Bar', options?: Record<string, unknown>): void {
        if (this._seriesById.has(seriesId)) {return;}
		const def = this._definitionFor(type);
		const mergedOptions = { ...(seriesOptionsDefaults as any), ...(def.defaultOptions), ...((options ?? {}) as any) };
		const series = new Series(this.model, def.type, mergedOptions, def.createPaneView, def.customPaneView);
		this.model.addSeriesToPane(series, 0);
        this._seriesById.set(seriesId, series);
	}

    public applySeriesOptions(seriesId: string, options: Partial<import('../model/series-options').SeriesOptionsMap[SeriesType]>): void {
        const s = this._seriesById.get(seriesId);
		if (!s) { return; }
		// Allow partial options
		s.applyOptions(options as Partial<import('../model/series').SeriesPartialOptionsInternal<SeriesType>> as unknown as import('../model/series').SeriesPartialOptionsInternal<SeriesType>);
	}

    public setData(seriesId: string, items: unknown[]): void {
        const series = this._seriesById.get(seriesId);
		if (!series) {return;}
        // Accept array of typed items and trust DataLayer to validate/convert
        const update = (this._dataLayer as unknown as import('../model/data-layer').DataLayer<unknown>)
            .setSeriesData(series, items as import('../model/data-consumer').SeriesDataItemTypeMap<unknown>[SeriesType][]);
		this._applyDataUpdate(update);
	}

    public updateData(seriesId: string, item: unknown, historicalUpdate: boolean): void {
        const series = this._seriesById.get(seriesId);
		if (!series) {return;}
        const update = (this._dataLayer as unknown as import('../model/data-layer').DataLayer<unknown>)
            .updateSeriesData(series, item as import('../model/data-consumer').SeriesDataItemTypeMap<unknown>[SeriesType], historicalUpdate);
		this._applyDataUpdate(update);
	}

    // Helper to publish current axis labels explicitly when needed
	public publishAxes(): void {
            const marks = this.model.timeScale().marks()?.map(m => ({ x: m.coord, label: m.label })) ?? [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (self as unknown as any).postMessage({ type: 'timeMarks', marks });
		const firstPane = this.model.panes()[0];
		if (firstPane) {
			const left = firstPane.leftPriceScale();
			const right = firstPane.rightPriceScale();
			const leftMarks = left.options().visible ? left.marks().map(m => ({ y: m.coord, label: m.label })) : [];
			const rightMarks = right.options().visible ? right.marks().map(m => ({ y: m.coord, label: m.label })) : [];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (self as unknown as any).postMessage({ type: 'priceLabels', side: 'left', labels: leftMarks });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (self as unknown as any).postMessage({ type: 'priceLabels', side: 'right', labels: rightMarks });
		}
	}

    private _applyDataUpdate(update: DataUpdateResponse): void {
		const model = this.model;
        model.updateTimeScale(update.timeScale.baseIndex, update.timeScale.points, update.timeScale.firstChangedPointIndex);
		update.series.forEach((value: SeriesChanges, series: Series<SeriesType>) => series.setData(value.data, value.info));
		model.timeScale().recalculateIndicesWithData();
		model.recalculateAllPanes();
	}

	private _definitionFor(type: 'Line'|'Area'|'Histogram'|'Candlestick'|'Bar'):
        SeriesDefinitionInternal<any> {
		switch (type) {
			case 'Line': return LineSeriesDef as unknown as SeriesDefinitionInternal<any>;
			case 'Area': return AreaSeriesDef as unknown as SeriesDefinitionInternal<any>;
			case 'Histogram': return HistogramSeriesDef as unknown as SeriesDefinitionInternal<any>;
			case 'Bar': return BarSeriesDef as unknown as SeriesDefinitionInternal<any>;
			case 'Candlestick':
			default:
				return CandlestickSeriesDef as unknown as SeriesDefinitionInternal<any>;
		}
	}

    // eslint-disable-next-line complexity
    private _onInvalidate = (mask: InvalidateMask): void => {
        // During ChartModel construction, the invalidate handler can be invoked
        // before "this.model" is assigned due to JS evaluation order. Guard early.
		if (!this.model) {
			return;
		}
        // For now, translate invalidation to axis label updates only.
        // Painting is managed by chart.worker.ts.
        if (mask.fullInvalidation() === InvalidationLevel.Full || mask.fullInvalidation() === InvalidationLevel.Light) {
            // Apply time-scale invalidations locally (main-thread ChartWidget normally does this)
            const tsInv = mask.timeScaleInvalidations();
            if (tsInv.length > 0) {
                const ts = this.model.timeScale();
                for (const inv of tsInv) {
                    switch (inv.type) {
                        case TimeScaleInvalidationType.FitContent:
                            ts.fitContent();
                            break;
                        case TimeScaleInvalidationType.ApplyRange: {
                            const r = inv.value;
                            const range = new RangeImpl(r.from as unknown as number, r.to as unknown as number);
                            ts.setVisibleRange(range as unknown as RangeImpl<any>);
                            break;
                        }
                        case TimeScaleInvalidationType.ApplyBarSpacing:
                            ts.setBarSpacing(inv.value);
                            break;
                        case TimeScaleInvalidationType.ApplyRightOffset:
                            ts.setRightOffset(inv.value);
                            break;
                        case TimeScaleInvalidationType.Reset:
                            ts.restoreDefault();
                            break;
                        case TimeScaleInvalidationType.Animation:
                        case TimeScaleInvalidationType.StopAnimation:
                            // Animations are not handled in worker mode yet
                            break;
                    }
                }
                // after applying time-scale invalidations, broadcast new logical range
                try { this._postVisibleLogicalRange(); } catch { /* ignore */ }
            }
			const marks = this.model.timeScale().marks()?.map(m => ({ x: m.coord, label: m.label })) ?? [];
			(self as any).postMessage({ type: 'timeMarks', marks });
            // Left/right price axes per first pane
			const firstPane = this.model.panes()[0];
			if (firstPane) {
				const left = firstPane.leftPriceScale();
				const right = firstPane.rightPriceScale();
				const leftMarks = left.options().visible ? left.marks().map(m => ({ y: m.coord, label: m.label })) : [];
				const rightMarks = right.options().visible ? right.marks().map(m => ({ y: m.coord, label: m.label })) : [];
				(self as any).postMessage({ type: 'priceLabels', side: 'left', labels: leftMarks });
				(self as any).postMessage({ type: 'priceLabels', side: 'right', labels: rightMarks });
			}
            // Cursor style
            const hovered = this.model.hoveredSource();
            if (hovered?.cursorStyle != null) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (self as unknown as any).postMessage({ type: 'cursor', style: hovered.cursorStyle });
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (self as unknown as any).postMessage({ type: 'cursor', style: null });
            }
            // Crosshair labels (basic)
			const cross = this.model.crosshairSource();
			const pane = cross.pane();
			if (pane) {
				const x = cross.appliedX();
				const y = cross.appliedY();
				const priceScale = pane.defaultPriceScale();
				const firstValue = priceScale.firstValue();
				let priceLabel: string | null = null;
				if (firstValue !== null) {
					const price = priceScale.coordinateToPrice(y as any, firstValue);
					priceLabel = priceScale.formatPrice(price, firstValue);
				}
				const idx = cross.appliedIndex();
				const time = idx != null ? this.model.timeScale().indexToTime(idx) : null;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (self as unknown as any).postMessage({ type: 'crosshairUpdate', x, y, priceLabel, time });
			}
		}
	};

    private _postVisibleLogicalRange(): void {
        const lr = this.model.timeScale().visibleLogicalRange();
        if (lr !== null) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (self as unknown as any).postMessage({ type: 'visibleLogicalRange', range: { from: lr.left(), to: lr.right() } });
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (self as unknown as any).postMessage({ type: 'visibleLogicalRange', range: null });
        }
    }

    private _postVisibleTimeRange(): void {
        const tr = this.model.timeScale().visibleTimeRange();
        if (tr !== null) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (self as unknown as any).postMessage({ type: 'visibleTimeRange', range: { from: tr.from.originalTime, to: tr.to.originalTime } });
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (self as unknown as any).postMessage({ type: 'visibleTimeRange', range: null });
        }
    }
}

