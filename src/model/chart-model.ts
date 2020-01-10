import { assert, ensureNotNull } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { IDestroyable } from '../helpers/idestroyable';
import { ISubscription } from '../helpers/isubscription';
import { DeepPartial, merge } from '../helpers/strict-type-checks';

import { PriceAxisViewRendererOptions } from '../renderers/iprice-axis-view-renderer';
import { PriceAxisRendererOptionsProvider } from '../renderers/price-axis-renderer-options-provider';

import { Coordinate } from './coordinate';
import { Crosshair, CrosshairOptions } from './crosshair';
import { Grid, GridOptions } from './grid';
import { IDataSource } from './idata-source';
import { InvalidateMask, InvalidationLevel } from './invalidate-mask';
import { IPriceDataSource } from './iprice-data-source';
import { LayoutOptions } from './layout-options';
import { LocalizationOptions } from './localization-options';
import { Magnet } from './magnet';
import { DEFAULT_STRETCH_FACTOR, Pane } from './pane';
import { Point } from './point';
import { PriceScale, PriceScaleOptions } from './price-scale';
import { Series } from './series';
import { SeriesOptionsMap, SeriesType } from './series-options';
import { TickMark, TimePoint, TimePointIndex, TimePointsRange } from './time-data';
import { TimeScale, TimeScaleOptions } from './time-scale';
import { Watermark, WatermarkOptions } from './watermark';

export interface HandleScrollOptions {
	mouseWheel: boolean;
	pressedMouseMove: boolean;
	horzTouchDrag: boolean;
	vertTouchDrag: boolean;
}

export interface HandleScaleOptions {
	mouseWheel: boolean;
	pinch: boolean;
	axisPressedMouseMove: boolean;
	axisDoubleClickReset: boolean;
}

export interface HoveredObject {
	hitTestData?: unknown;
	externalId?: string;
}

export interface HoveredSource {
	source: IDataSource;
	object?: HoveredObject;
}

type InvalidateHandler = (mask: InvalidateMask) => void;

/**
 * Structure describing options of the chart. Series options are to be set separately
 */
export interface ChartOptions {
	/** Width of the chart */
	width: number;
	/** Height of the chart */
	height: number;
	/** Structure with watermark options */
	watermark: WatermarkOptions;
	/** Structure with layout options */
	layout: LayoutOptions;
	/** Structure with price scale options */
	priceScale: PriceScaleOptions;
	/** Structure with time scale options */
	timeScale: TimeScaleOptions;
	/** Structure with crosshair options */
	crosshair: CrosshairOptions;
	/** Structure with grid options */
	grid: GridOptions;
	/** Structure with localization options */
	localization: LocalizationOptions;
	/** Structure that describes scrolling behavior or boolean flag that disables/enables all kinds of scrolls */
	handleScroll: HandleScrollOptions | boolean;
	/** Structure that describes scaling behavior or boolean flag that disables/enables all kinds of scales */
	handleScale: HandleScaleOptions | boolean;
}

export type ChartOptionsInternal =
	Omit<ChartOptions, 'handleScroll' | 'handleScale'>
	& {
		handleScroll: HandleScrollOptions;
		handleScale: HandleScaleOptions;
	};

export class ChartModel implements IDestroyable {
	private readonly _options: ChartOptionsInternal;
	private readonly _invalidateHandler: InvalidateHandler;

	private readonly _rendererOptionsProvider: PriceAxisRendererOptionsProvider;

	private readonly _timeScale: TimeScale;
	private readonly _panes: Pane[] = [];
	private readonly _grid: Grid;
	private readonly _crosshair: Crosshair;
	private readonly _magnet: Magnet;
	private readonly _watermark: Watermark;

	private _serieses: Series[] = [];

	private _width: number = 0;
	private _initialTimeScrollPos: number | null = null;
	private _hoveredSource: HoveredSource | null = null;
	private readonly _mainPriceScaleOptionsChanged: Delegate = new Delegate();
	private _crosshairMoved: Delegate<TimePointIndex | null, Point | null> = new Delegate();

	public constructor(invalidateHandler: InvalidateHandler, options: ChartOptionsInternal) {
		this._invalidateHandler = invalidateHandler;
		this._options = options;

		this._rendererOptionsProvider = new PriceAxisRendererOptionsProvider(this);

		this._timeScale = new TimeScale(this, options.timeScale, this._options.localization);
		this._grid = new Grid();
		this._crosshair = new Crosshair(this, options.crosshair);
		this._magnet = new Magnet(options.crosshair);
		this._watermark = new Watermark(this, options.watermark);

		this.createPane();
		this._panes[0].setStretchFactor(DEFAULT_STRETCH_FACTOR * 2);
		this._panes[0].addDataSource(this._watermark, true, false);
	}

	public fullUpdate(): void {
		this._invalidate(new InvalidateMask(InvalidationLevel.Full));
	}

	public lightUpdate(): void {
		this._invalidate(new InvalidateMask(InvalidationLevel.Light));
	}

	public updateSource(source: IDataSource): void {
		const inv = this._invalidationMaskForSource(source);
		this._invalidate(inv);
	}

	public hoveredSource(): HoveredSource | null {
		return this._hoveredSource;
	}

	public setHoveredSource(source: HoveredSource | null): void {
		const prevSource = this._hoveredSource;
		this._hoveredSource = source;
		if (prevSource !== null) {
			this.updateSource(prevSource.source);
		}
		if (source !== null) {
			this.updateSource(source.source);
		}
	}

	public options(): Readonly<ChartOptionsInternal> {
		return this._options;
	}

	public applyOptions(options: DeepPartial<ChartOptionsInternal>): void {
		// TODO: implement this
		merge(this._options, options);
		if (options.priceScale !== undefined) {
			this.mainPriceScale().applyOptions(options.priceScale);
			this._mainPriceScaleOptionsChanged.fire();
		}

		if (options.timeScale !== undefined) {
			this._timeScale.applyOptions(options.timeScale);
		}

		if (options.localization !== undefined) {
			this._timeScale.applyLocalizationOptions(options.localization);
			this.mainPriceScale().updateFormatter();
		}

		this.fullUpdate();
	}

	public updateAllPaneViews(): void {
		this._panes.forEach((p: Pane) => p.updateAllViews());
		this.updateCrosshair();
	}

	public timeScale(): TimeScale {
		return this._timeScale;
	}

	public panes(): ReadonlyArray<Pane> {
		return this._panes;
	}

	public gridSource(): Grid {
		return this._grid;
	}

	public watermarkSource(): Watermark | null {
		return this._watermark;
	}

	public crosshairSource(): Crosshair {
		return this._crosshair;
	}

	public crosshairMoved(): ISubscription<TimePointIndex | null, Point | null> {
		return this._crosshairMoved;
	}

	public width(): number {
		return this._width;
	}

	public setPaneHeight(pane: Pane, height: number): void {
		pane.setHeight(height);
		this.recalculateAllPanes();
		this.lightUpdate();
	}

	public setWidth(width: number): void {
		this._width = width;
		this._timeScale.setWidth(this._width);
		this._panes.forEach((pane: Pane) => pane.setWidth(width));
		this.recalculateAllPanes();
	}

	public createPane(index?: number): Pane {
		const pane = new Pane(this._timeScale, this);

		if (index !== undefined) {
			this._panes.splice(index, 0, pane);
		} else {
			// adding to the end - common case
			this._panes.push(pane);
		}

		const actualIndex = (index === undefined) ? this._panes.length - 1 : index;

		// we always do autoscaling on the creation
		// if autoscale option is true, it is ok, just recalculate by invalidation mask
		// if autoscale option is false, autoscale anyway on the first draw
		// also there is a scenario when autoscale is true in constructor and false later on applyOptions
		const mask = new InvalidateMask(InvalidationLevel.Full);
		mask.invalidatePane(actualIndex, {
			level: InvalidationLevel.None,
			autoScale: true,
		});
		this.invalidate(mask);

		return pane;
	}

	public startScalePrice(pane: Pane, priceScale: PriceScale, x: number): void {
		pane.startScalePrice(priceScale, x);
	}

	public scalePriceTo(pane: Pane, priceScale: PriceScale, x: number): void {
		pane.scalePriceTo(priceScale, x);
		this.updateCrosshair();
		this._invalidate(this._paneInvalidationMask(pane, InvalidationLevel.Light));
	}

	public endScalePrice(pane: Pane, priceScale: PriceScale): void {
		pane.endScalePrice(priceScale);
		this._invalidate(this._paneInvalidationMask(pane, InvalidationLevel.Light));
	}

	public startScrollPrice(pane: Pane, priceScale: PriceScale, x: number): void {
		if (priceScale.isAutoScale()) {
			return;
		}
		pane.startScrollPrice(priceScale, x);
	}

	public scrollPriceTo(pane: Pane, priceScale: PriceScale, x: number): void {
		if (priceScale.isAutoScale()) {
			return;
		}
		pane.scrollPriceTo(priceScale, x);
		this.updateCrosshair();
		this._invalidate(this._paneInvalidationMask(pane, InvalidationLevel.Light));
	}

	public endScrollPrice(pane: Pane, priceScale: PriceScale): void {
		if (priceScale.isAutoScale()) {
			return;
		}
		pane.endScrollPrice(priceScale);
		this._invalidate(this._paneInvalidationMask(pane, InvalidationLevel.Light));
	}

	public setPriceAutoScale(pane: Pane, priceScale: PriceScale, autoScale: boolean): void {
		pane.setPriceAutoScale(priceScale, autoScale);
		this._invalidate(this._paneInvalidationMask(pane, InvalidationLevel.Light));
	}

	public resetPriceScale(pane: Pane, priceScale: PriceScale): void {
		pane.resetPriceScale(priceScale);
		this._invalidate(this._paneInvalidationMask(pane, InvalidationLevel.Light));
	}

	public startScaleTime(position: Coordinate): void {
		this._timeScale.startScale(position);
	}

	/**
	 * Zoom in/out the chart (depends on scale value).
	 * @param pointX - X coordinate of the point to apply the zoom (the point which should stay on its place)
	 * @param scale - Zoom value. Negative value means zoom out, positive - zoom in.
	 */
	public zoomTime(pointX: Coordinate, scale: number): void {
		const timeScale = this.timeScale();
		if (timeScale.isEmpty() || scale === 0) {
			return;
		}

		const timeScaleWidth = timeScale.width();
		pointX = Math.max(1, Math.min(pointX, timeScaleWidth)) as Coordinate;

		timeScale.zoom(pointX, scale);

		this.updateCrosshair();
		this.recalculateAllPanes();
		this.lightUpdate();
	}

	public scrollChart(x: Coordinate): void {
		this.startScrollTime(0 as Coordinate);
		this.scrollTimeTo(x);
		this.endScrollTime();
	}

	public scaleTimeTo(x: Coordinate): void {
		this._timeScale.scaleTo(x);
		this.recalculateAllPanes();
		this.updateCrosshair();
		this.lightUpdate();
	}

	public endScaleTime(): void {
		this._timeScale.endScale();
		this.lightUpdate();
	}

	public startScrollTime(x: Coordinate): void {
		this._initialTimeScrollPos = x;
		this._timeScale.startScroll(x);
	}

	public scrollTimeTo(x: Coordinate): boolean {
		let res = false;
		if (this._initialTimeScrollPos !== null && Math.abs(x - this._initialTimeScrollPos) > 20) {
			this._initialTimeScrollPos = null;
			res = true;
		}

		this._timeScale.scrollTo(x);
		this.recalculateAllPanes();
		this.updateCrosshair();
		this.lightUpdate();
		return res;
	}

	public endScrollTime(): void {
		this._timeScale.endScroll();
		this.lightUpdate();

		this._initialTimeScrollPos = null;
	}

	public resetTimeScale(): void {
		this._timeScale.restoreDefault();
		this.recalculateAllPanes();
		this.updateCrosshair();
		this.lightUpdate();
	}

	public invalidate(mask: InvalidateMask): void {
		if (this._invalidateHandler) {
			this._invalidateHandler(mask);
		}

		this._grid.invalidate();
		this.lightUpdate();
	}

	public dataSources(): ReadonlyArray<IDataSource> {
		return this._panes.reduce((arr: IDataSource[], pane: Pane) => arr.concat(pane.dataSources()), []);
	}

	public serieses(): ReadonlyArray<Series> {
		return this._serieses;
	}

	public setAndSaveCurrentPosition(x: Coordinate, y: Coordinate, pane: Pane): void {
		this._crosshair.saveOriginCoord(x, y);
		let price = NaN;
		let index = this._timeScale.coordinateToIndex(x);

		const visibleBars = this._timeScale.visibleBars();
		if (visibleBars !== null) {
			index = Math.min(Math.max(visibleBars.firstBar(), index), visibleBars.lastBar()) as TimePointIndex;
		}

		const mainSource = pane.mainDataSource();
		if (mainSource !== null) {
			const priceScale = pane.defaultPriceScale();
			const firstValue = priceScale.firstValue();
			if (firstValue !== null) {
				price = priceScale.coordinateToPrice(y, firstValue);
			}
			price = this._magnet.align(price, index, pane);
		}

		this._crosshair.setPosition(index, price, pane);

		this._cursorUpdate();
		this._crosshairMoved.fire(this._crosshair.appliedIndex(), { x, y });
	}

	public clearCurrentPosition(): void {
		const crosshair = this.crosshairSource();
		crosshair.clearPosition();
		this._cursorUpdate();
		this._crosshairMoved.fire(null, null);
	}

	public updateCrosshair(): void {
		// apply magnet
		const pane = this._crosshair.pane();
		if (pane !== null) {
			const x = this._crosshair.originCoordX();
			const y = this._crosshair.originCoordY();
			this.setAndSaveCurrentPosition(x, y, pane);
		}
	}

	public updateTimeScale(index: TimePointIndex, values: TimePoint[], marks: TickMark[], clearFlag: boolean): void {
		if (clearFlag) {
			// refresh timescale
			this._timeScale.reset();
		}

		this._timeScale.update(index, values, marks);
	}

	public updateTimeScaleBaseIndex(earliestRowIndex?: TimePointIndex): void {
		// get the latest series bar index
		const lastSeriesBarIndex = this._serieses.reduce(
			(currentRes: TimePointIndex | undefined, series: Series) => {
				const seriesBars = series.bars();
				if (seriesBars.isEmpty()) {
					return currentRes;
				}
				const currentLastIndex = ensureNotNull(seriesBars.lastIndex());
				return (currentRes === undefined) ? currentLastIndex : Math.max(currentLastIndex, currentRes) as TimePointIndex;
			},
			undefined);

		if (lastSeriesBarIndex !== undefined) {
			const timeScale = this._timeScale;
			const currentBaseIndex = timeScale.baseIndex();

			const visibleBars = timeScale.visibleBars();

			// if time scale cannot return current visible bars range (e.g. time scale has zero-width)
			// then we do not need to update right offset to shift visible bars range to have the same right offset as we have before new bar
			// (and actually we cannot)
			if (visibleBars !== null) {
				const isLastSeriesBarVisible = visibleBars.contains(currentBaseIndex);

				if (earliestRowIndex !== undefined && earliestRowIndex > 0 && !isLastSeriesBarVisible) {
					const compensationShift = lastSeriesBarIndex - currentBaseIndex;

					timeScale.setRightOffset(timeScale.rightOffset() - compensationShift);
				}
			}

			timeScale.setBaseIndex(lastSeriesBarIndex);
		}

		this.updateCrosshair();
		this.recalculateAllPanes();
		this.lightUpdate();
	}

	public recalculatePane(pane: Pane | null): void {
		if (pane !== null) {
			pane.recalculate();
		}
	}

	public paneForSource(source: IDataSource): Pane | null {
		const pane = this._panes.find((p: Pane) => p.orderedSources().includes(source));
		return pane === undefined ? null : pane;
	}

	public recalculateAllPanes(): void {
		this._panes.forEach((p: Pane) => p.recalculate());
		this.updateAllPaneViews();
	}

	public destroy(): void {
		this._panes.forEach((p: Pane) => p.destroy());
		this._panes.length = 0;

		// to avoid memleaks
		this._options.localization.priceFormatter = undefined;
		this._options.localization.timeFormatter = undefined;
	}

	public setPriceAutoScaleForAllMainSources(): void {
		this._panes.map((p: Pane) => p.mainDataSource())
			.forEach((s: IPriceDataSource | null) => {
				if (s !== null) {
					const priceScale = ensureNotNull(s.priceScale());
					priceScale.setMode({
						autoScale: true,
					});
				}
			});
	}

	public rendererOptionsProvider(): PriceAxisRendererOptionsProvider {
		return this._rendererOptionsProvider;
	}

	public priceAxisRendererOptions(): Readonly<PriceAxisViewRendererOptions> {
		return this._rendererOptionsProvider.options();
	}

	public mainPriceScaleOptionsChanged(): ISubscription {
		return this._mainPriceScaleOptionsChanged;
	}

	public mainPriceScale(): PriceScale {
		return this._panes[0].defaultPriceScale();
	}

	public createSeries<T extends SeriesType>(seriesType: T, options: SeriesOptionsMap[T]): Series<T> {
		const pane = this._panes[0];
		const series = this._createSeries(options, seriesType, pane);
		this._serieses.push(series);

		if (this._serieses.length === 1) {
			// call fullUpdate to recalculate chart's parts geometry
			this.fullUpdate();
		} else {
			this.lightUpdate();
		}

		return series;
	}

	public removeSeries(series: Series): void {
		const pane = this.paneForSource(series);

		const seriesIndex = this._serieses.indexOf(series);
		assert(seriesIndex !== -1, 'Series not found');

		this._serieses.splice(seriesIndex, 1);
		ensureNotNull(pane).removeDataSource(series);
		if (series.destroy) {
			series.destroy();
		}
	}

	public fitContent(): void {
		const mask = new InvalidateMask(InvalidationLevel.Light);
		mask.setFitContent();
		this._invalidate(mask);
	}

	public setTargetTimeRange(range: TimePointsRange): void {
		const mask = new InvalidateMask(InvalidationLevel.Light);
		mask.setTargetTimeRange(range);
		this._invalidate(mask);
	}

	private _paneInvalidationMask(pane: Pane | null, level: InvalidationLevel): InvalidateMask {
		const inv = new InvalidateMask(level);
		if (pane !== null) {
			const index = this._panes.indexOf(pane);
			inv.invalidatePane(index, {
				level,
			});
		}
		return inv;
	}

	private _invalidationMaskForSource(source: IDataSource, invalidateType?: InvalidationLevel): InvalidateMask {
		if (invalidateType === undefined) {
			invalidateType = InvalidationLevel.Light;
		}

		return this._paneInvalidationMask(this.paneForSource(source), invalidateType);
	}

	private _invalidate(mask: InvalidateMask): void {
		if (this._invalidateHandler) {
			this._invalidateHandler(mask);
		}

		this._grid.invalidate();
	}

	private _cursorUpdate(): void {
		this._invalidate(new InvalidateMask(InvalidationLevel.Cursor));
	}

	private _createSeries<T extends SeriesType>(options: SeriesOptionsMap[T], seriesType: T, pane: Pane): Series<T> {
		const series = new Series<T>(this, options, seriesType);

		pane.addDataSource(series, Boolean(options.overlay), false);

		if (options.overlay) {
			// let's apply that options again to apply margins
			series.applyOptions(options);
		}

		return series;
	}
}
