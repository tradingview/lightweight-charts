/// <reference types="_build-time-constants" />

import { assert, ensureNotNull } from '../helpers/assertions';
import { gradientColorAtPercent } from '../helpers/color';
import { Delegate } from '../helpers/delegate';
import { IDestroyable } from '../helpers/idestroyable';
import { ISubscription } from '../helpers/isubscription';
import { DeepPartial, merge } from '../helpers/strict-type-checks';

import { PriceAxisViewRendererOptions } from '../renderers/iprice-axis-view-renderer';
import { PriceAxisRendererOptionsProvider } from '../renderers/price-axis-renderer-options-provider';

import { Coordinate } from './coordinate';
import { Crosshair, CrosshairOptions } from './crosshair';
import { DefaultPriceScaleId, isDefaultPriceScale } from './default-price-scale';
import { GridOptions } from './grid';
import { InvalidateMask, InvalidationLevel, ITimeScaleAnimation } from './invalidate-mask';
import { IPriceDataSource } from './iprice-data-source';
import { ColorType, LayoutOptions } from './layout-options';
import { LocalizationOptions } from './localization-options';
import { Magnet } from './magnet';
import { DEFAULT_STRETCH_FACTOR, Pane } from './pane';
import { Point } from './point';
import { PriceScale, PriceScaleOptions } from './price-scale';
import { Series, SeriesOptionsInternal } from './series';
import { SeriesOptionsMap, SeriesType } from './series-options';
import { LogicalRange, TimePointIndex, TimeScalePoint } from './time-data';
import { TimeScale, TimeScaleOptions } from './time-scale';
import { TouchMouseEventData } from './touch-mouse-event-data';
import { Watermark, WatermarkOptions } from './watermark';

/**
 * Represents options for how the chart is scrolled by the mouse and touch gestures.
 */
export interface HandleScrollOptions {
	/**
	 * Enable scrolling with the mouse wheel.
	 *
	 * @defaultValue `true`
	 */
	mouseWheel: boolean;

	/**
	 * Enable scrolling by holding down the left mouse button and moving the mouse.
	 *
	 * @defaultValue `true`
	 */
	pressedMouseMove: boolean;

	/**
	 * Enable horizontal touch scrolling.
	 *
	 * When enabled the chart handles touch gestures that would normally scroll the webpage horizontally.
	 *
	 * @defaultValue `true`
	 */
	horzTouchDrag: boolean;

	/**
	 * Enable vertical touch scrolling.
	 *
	 * When enabled the chart handles touch gestures that would normally scroll the webpage vertically.
	 *
	 * @defaultValue `true`
	 */
	vertTouchDrag: boolean;
}

/**
 * Represents options for how the chart is scaled by the mouse and touch gestures.
 */
export interface HandleScaleOptions {
	/**
	 * Enable scaling with the mouse wheel.
	 *
	 * @defaultValue `true`
	 */
	mouseWheel: boolean;

	/**
	 * Enable scaling with pinch/zoom gestures.
	 *
	 * @defaultValue `true`
	 */
	pinch: boolean;

	/**
	 * Enable scaling the price and/or time scales by holding down the left mouse button and moving the mouse.
	 */
	axisPressedMouseMove: AxisPressedMouseMoveOptions | boolean;

	/**
	 * Enable resetting scaling by double-clicking the left mouse button.
	 */
	axisDoubleClickReset: AxisDoubleClickOptions | boolean;
}

/**
 * Represents options for enabling or disabling kinetic scrolling with mouse and touch gestures.
 */
export interface KineticScrollOptions {
	/**
	 * Enable kinetic scroll with touch gestures.
	 *
	 * @defaultValue `true`
	 */
	touch: boolean;

	/**
	 * Enable kinetic scroll with the mouse.
	 *
	 * @defaultValue `false`
	 */
	mouse: boolean;
}

type HandleScaleOptionsInternal =
	Omit<HandleScaleOptions, 'axisPressedMouseMove' | 'axisDoubleClickReset'>
	& {
		/** @public */
		axisPressedMouseMove: AxisPressedMouseMoveOptions;

		/** @public */
		axisDoubleClickReset: AxisDoubleClickOptions;
	};

/**
 * Represents options for how the time and price axes react to mouse movements.
 */
export interface AxisPressedMouseMoveOptions {
	/**
	 * Enable scaling the time axis by holding down the left mouse button and moving the mouse.
	 *
	 * @defaultValue `true`
	 */
	time: boolean;

	/**
	 * Enable scaling the price axis by holding down the left mouse button and moving the mouse.
	 *
	 * @defaultValue `true`
	 */
	price: boolean;
}

/**
 * Represents options for how the time and price axes react to mouse double click.
 */
export interface AxisDoubleClickOptions {
	/**
	 * Enable resetting scaling the time axis by double-clicking the left mouse button.
	 *
	 * @defaultValue `true`
	 */
	time: boolean;

	/**
	 * Enable reseting scaling the price axis by by double-clicking the left mouse button.
	 *
	 * @defaultValue `true`
	 */
	price: boolean;
}

export interface HoveredObject {
	hitTestData?: unknown;
	externalId?: string;
}

export interface HoveredSource {
	source: IPriceDataSource;
	object?: HoveredObject;
}

export interface PriceScaleOnPane {
	priceScale: PriceScale;
	pane: Pane;
}

const enum BackgroundColorSide {
	Top,
	Bottom,
}

type InvalidateHandler = (mask: InvalidateMask) => void;

/**
 * Represents a visible price scale's options.
 *
 * @see {@link PriceScaleOptions}
 */
export type VisiblePriceScaleOptions = PriceScaleOptions;

/**
 * Represents overlay price scale options.
 */
export type OverlayPriceScaleOptions = Omit<PriceScaleOptions, 'visible' | 'autoScale'>;

/**
 * Determine how to exit the tracking mode.
 *
 * By default, mobile users will long press to deactivate the scroll and have the ability to check values and dates.
 * Another press is required to activate the scroll, be able to move left/right, zoom, etc.
 */
export const enum TrackingModeExitMode {
	/**
	 * Tracking Mode will be deactivated on touch end event.
	 */
	OnTouchEnd,
	/**
	 * Tracking Mode will be deactivated on the next tap event.
	 */
	OnNextTap,
}

/**
 * Represent options for the tracking mode's behavior.
 *
 * Mobile users will not have the ability to see the values/dates like they do on desktop.
 * To see it, they should enter the tracking mode. The tracking mode will deactivate the scrolling
 * and make it possible to check values and dates.
 */
export interface TrackingModeOptions {
	// eslint-disable-next-line tsdoc/syntax
	/** @inheritDoc TrackingModeExitMode
	 *
	 * @defaultValue {@link TrackingModeExitMode.OnNextTap}
	 */
	exitMode: TrackingModeExitMode;
}

/**
 * Structure describing options of the chart. Series options are to be set separately
 */
export interface ChartOptions {
	/**
	 * Width of the chart in pixels
	 *
	 * @defaultValue If `0` (default) or none value provided, then a size of the widget will be calculated based its container's size.
	 */
	width: number;

	/**
	 * Height of the chart in pixels
	 *
	 * @defaultValue If `0` (default) or none value provided, then a size of the widget will be calculated based its container's size.
	 */
	height: number;

	/**
	 * Watermark options.
	 *
	 * A watermark is a background label that includes a brief description of the drawn data. Any text can be added to it.
	 *
	 * Please make sure you enable it and set an appropriate font color and size to make your watermark visible in the background of the chart.
	 * We recommend a semi-transparent color and a large font. Also note that watermark position can be aligned vertically and horizontally.
	 */
	watermark: WatermarkOptions;

	/**
	 * Layout options
	 */
	layout: LayoutOptions;

	/**
	 * Left price scale options
	 */
	leftPriceScale: VisiblePriceScaleOptions;
	/**
	 * Right price scale options
	 */
	rightPriceScale: VisiblePriceScaleOptions;
	/**
	 * Overlay price scale options
	 */
	overlayPriceScales: OverlayPriceScaleOptions;

	/**
	 * Time scale options
	 */
	timeScale: TimeScaleOptions;

	/**
	 * The crosshair shows the intersection of the price and time scale values at any point on the chart.
	 *
	 */
	crosshair: CrosshairOptions;

	/**
	 * A grid is represented in the chart background as a vertical and horizontal lines drawn at the levels of visible marks of price and the time scales.
	 */
	grid: GridOptions;

	/**
	 * Localization options.
	 */
	localization: LocalizationOptions;

	/**
	 * Scroll options, or a boolean flag that enables/disables scrolling
	 */
	handleScroll: HandleScrollOptions | boolean;

	/**
	 * Scale options, or a boolean flag that enables/disables scaling
	 */
	handleScale: HandleScaleOptions | boolean;

	/**
	 * Kinetic scroll options
	 */
	kineticScroll: KineticScrollOptions;

	// eslint-disable-next-line tsdoc/syntax
	/** @inheritDoc TrackingModeOptions
	 */
	trackingMode: TrackingModeOptions;

}

export type ChartOptionsInternal =
	Omit<ChartOptions, 'handleScroll' | 'handleScale' | 'layout'>
	& {
		/** @public */
		handleScroll: HandleScrollOptions;
		/** @public */
		handleScale: HandleScaleOptionsInternal;
		/** @public */
		layout: LayoutOptions;
	};

interface GradientColorsCache {
	topColor: string;
	bottomColor: string;
	colors: Map<number, string>;
}

export class ChartModel implements IDestroyable {
	private readonly _options: ChartOptionsInternal;
	private readonly _invalidateHandler: InvalidateHandler;

	private readonly _rendererOptionsProvider: PriceAxisRendererOptionsProvider;

	private readonly _timeScale: TimeScale;
	private readonly _panes: Pane[] = [];
	private readonly _crosshair: Crosshair;
	private readonly _magnet: Magnet;
	private readonly _watermark: Watermark;

	private _serieses: Series[] = [];

	private _width: number = 0;
	private _hoveredSource: HoveredSource | null = null;
	private readonly _priceScalesOptionsChanged: Delegate = new Delegate();
	private _crosshairMoved: Delegate<TimePointIndex | null, Point | null, TouchMouseEventData | null> = new Delegate();

	private _backgroundTopColor: string;
	private _backgroundBottomColor: string;
	private _gradientColorsCache: GradientColorsCache | null = null;

	public constructor(invalidateHandler: InvalidateHandler, options: ChartOptionsInternal) {
		this._invalidateHandler = invalidateHandler;
		this._options = options;

		this._rendererOptionsProvider = new PriceAxisRendererOptionsProvider(this);

		this._timeScale = new TimeScale(this, options.timeScale, this._options.localization);
		this._crosshair = new Crosshair(this, options.crosshair);
		this._magnet = new Magnet(options.crosshair);
		this._watermark = new Watermark(this, options.watermark);

		this.createPane();
		this._panes[0].setStretchFactor(DEFAULT_STRETCH_FACTOR * 2);

		this._backgroundTopColor = this._getBackgroundColor(BackgroundColorSide.Top);
		this._backgroundBottomColor = this._getBackgroundColor(BackgroundColorSide.Bottom);
	}

	public fullUpdate(): void {
		this._invalidate(InvalidateMask.full());
	}

	public lightUpdate(): void {
		this._invalidate(InvalidateMask.light());
	}

	public cursorUpdate(): void {
		this._invalidate(new InvalidateMask(InvalidationLevel.Cursor));
	}

	public updateSource(source: IPriceDataSource): void {
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
		merge(this._options, options);

		this._panes.forEach((p: Pane) => p.applyScaleOptions(options));

		if (options.timeScale !== undefined) {
			this._timeScale.applyOptions(options.timeScale);
		}

		if (options.localization !== undefined) {
			this._timeScale.applyLocalizationOptions(options.localization);
		}

		if (options.leftPriceScale || options.rightPriceScale) {
			this._priceScalesOptionsChanged.fire();
		}

		this._backgroundTopColor = this._getBackgroundColor(BackgroundColorSide.Top);
		this._backgroundBottomColor = this._getBackgroundColor(BackgroundColorSide.Bottom);

		this.fullUpdate();
	}

	public applyPriceScaleOptions(priceScaleId: string, options: DeepPartial<PriceScaleOptions>): void {
		if (priceScaleId === DefaultPriceScaleId.Left) {
			this.applyOptions({
				leftPriceScale: options,
			});
			return;
		} else if (priceScaleId === DefaultPriceScaleId.Right) {
			this.applyOptions({
				rightPriceScale: options,
			});
			return;
		}

		const res = this.findPriceScale(priceScaleId);

		if (res === null) {
			if (process.env.NODE_ENV === 'development') {
				throw new Error(`Trying to apply price scale options with incorrect ID: ${priceScaleId}`);
			}

			return;
		}

		res.priceScale.applyOptions(options);
		this._priceScalesOptionsChanged.fire();
	}

	public findPriceScale(priceScaleId: string): PriceScaleOnPane | null {
		for (const pane of this._panes) {
			const priceScale = pane.priceScaleById(priceScaleId);
			if (priceScale !== null) {
				return {
					pane,
					priceScale,
				};
			}
		}
		return null;
	}

	public timeScale(): TimeScale {
		return this._timeScale;
	}

	public panes(): readonly Pane[] {
		return this._panes;
	}

	public watermarkSource(): Watermark {
		return this._watermark;
	}

	public crosshairSource(): Crosshair {
		return this._crosshair;
	}

	public crosshairMoved(): ISubscription<TimePointIndex | null, Point | null, TouchMouseEventData | null> {
		return this._crosshairMoved;
	}

	public setPaneHeight(pane: Pane, height: number): void {
		pane.setHeight(height);
		this.recalculateAllPanes();
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
		const mask = InvalidateMask.full();
		mask.invalidatePane(actualIndex, {
			level: InvalidationLevel.None,
			autoScale: true,
		});
		this._invalidate(mask);

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

	public resetPriceScale(pane: Pane, priceScale: PriceScale): void {
		pane.resetPriceScale(priceScale);
		this._invalidate(this._paneInvalidationMask(pane, InvalidationLevel.Light));
	}

	public startScaleTime(position: Coordinate): void {
		this._timeScale.startScale(position);
	}

	/**
	 * Zoom in/out the chart (depends on scale value).
	 *
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

		this.recalculateAllPanes();
	}

	public scrollChart(x: Coordinate): void {
		this.startScrollTime(0 as Coordinate);
		this.scrollTimeTo(x);
		this.endScrollTime();
	}

	public scaleTimeTo(x: Coordinate): void {
		this._timeScale.scaleTo(x);
		this.recalculateAllPanes();
	}

	public endScaleTime(): void {
		this._timeScale.endScale();
		this.lightUpdate();
	}

	public startScrollTime(x: Coordinate): void {
		this._timeScale.startScroll(x);
	}

	public scrollTimeTo(x: Coordinate): void {
		this._timeScale.scrollTo(x);
		this.recalculateAllPanes();
	}

	public endScrollTime(): void {
		this._timeScale.endScroll();
		this.lightUpdate();
	}

	public serieses(): readonly Series[] {
		return this._serieses;
	}

	public setAndSaveCurrentPosition(x: Coordinate, y: Coordinate, event: TouchMouseEventData | null, pane: Pane): void {
		this._crosshair.saveOriginCoord(x, y);
		let price = NaN;
		let index = this._timeScale.coordinateToIndex(x);

		const visibleBars = this._timeScale.visibleStrictRange();
		if (visibleBars !== null) {
			index = Math.min(Math.max(visibleBars.left(), index), visibleBars.right()) as TimePointIndex;
		}

		const priceScale = pane.defaultPriceScale();
		const firstValue = priceScale.firstValue();
		if (firstValue !== null) {
			price = priceScale.coordinateToPrice(y, firstValue);
		}
		price = this._magnet.align(price, index, pane);

		this._crosshair.setPosition(index, price, pane);

		this.cursorUpdate();
		this._crosshairMoved.fire(this._crosshair.appliedIndex(), { x, y }, event);
	}

	public clearCurrentPosition(): void {
		const crosshair = this.crosshairSource();
		crosshair.clearPosition();
		this.cursorUpdate();
		this._crosshairMoved.fire(null, null, null);
	}

	public updateCrosshair(): void {
		// apply magnet
		const pane = this._crosshair.pane();
		if (pane !== null) {
			const x = this._crosshair.originCoordX();
			const y = this._crosshair.originCoordY();
			this.setAndSaveCurrentPosition(x, y, null, pane);
		}

		this._crosshair.updateAllViews();
	}

	public updateTimeScale(newBaseIndex: TimePointIndex | null, newPoints?: readonly TimeScalePoint[], firstChangedPointIndex?: number): void {
		const oldFirstTime = this._timeScale.indexToTime(0 as TimePointIndex);

		if (newPoints !== undefined && firstChangedPointIndex !== undefined) {
			this._timeScale.update(newPoints, firstChangedPointIndex);
		}

		const newFirstTime = this._timeScale.indexToTime(0 as TimePointIndex);

		const currentBaseIndex = this._timeScale.baseIndex();
		const visibleBars = this._timeScale.visibleStrictRange();

		// if time scale cannot return current visible bars range (e.g. time scale has zero-width)
		// then we do not need to update right offset to shift visible bars range to have the same right offset as we have before new bar
		// (and actually we cannot)
		if (visibleBars !== null && oldFirstTime !== null && newFirstTime !== null) {
			const isLastSeriesBarVisible = visibleBars.contains(currentBaseIndex);
			const isLeftBarShiftToLeft = oldFirstTime.timestamp > newFirstTime.timestamp;
			const isSeriesPointsAdded = newBaseIndex !== null && newBaseIndex > currentBaseIndex;
			const isSeriesPointsAddedToRight = isSeriesPointsAdded && !isLeftBarShiftToLeft;

			const needShiftVisibleRangeOnNewBar = isLastSeriesBarVisible && this._timeScale.options().shiftVisibleRangeOnNewBar;
			if (isSeriesPointsAddedToRight && !needShiftVisibleRangeOnNewBar) {
				const compensationShift = newBaseIndex - currentBaseIndex;
				this._timeScale.setRightOffset(this._timeScale.rightOffset() - compensationShift);
			}
		}

		this._timeScale.setBaseIndex(newBaseIndex);
	}

	public recalculatePane(pane: Pane | null): void {
		if (pane !== null) {
			pane.recalculate();
		}
	}

	public paneForSource(source: IPriceDataSource): Pane | null {
		const pane = this._panes.find((p: Pane) => p.orderedSources().includes(source));
		return pane === undefined ? null : pane;
	}

	public recalculateAllPanes(): void {
		this._watermark.updateAllViews();
		this._panes.forEach((p: Pane) => p.recalculate());
		this.updateCrosshair();
	}

	public destroy(): void {
		this._panes.forEach((p: Pane) => p.destroy());
		this._panes.length = 0;

		// to avoid memleaks
		this._options.localization.priceFormatter = undefined;
		this._options.localization.timeFormatter = undefined;
	}

	public rendererOptionsProvider(): PriceAxisRendererOptionsProvider {
		return this._rendererOptionsProvider;
	}

	public priceAxisRendererOptions(): Readonly<PriceAxisViewRendererOptions> {
		return this._rendererOptionsProvider.options();
	}

	public priceScalesOptionsChanged(): ISubscription {
		return this._priceScalesOptionsChanged;
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

	public moveSeriesToScale(series: Series, targetScaleId: string): void {
		const pane = ensureNotNull(this.paneForSource(series));
		pane.removeDataSource(series);

		// check if targetScaleId exists
		const target = this.findPriceScale(targetScaleId);
		if (target === null) {
			// new scale on the same pane
			const zOrder = series.zorder();
			pane.addDataSource(series, targetScaleId, zOrder);
		} else {
			// if move to the new scale of the same pane, keep zorder
			// if move to new pane
			const zOrder = (target.pane === pane) ? series.zorder() : undefined;
			target.pane.addDataSource(series, targetScaleId, zOrder);
		}
	}

	public fitContent(): void {
		const mask = InvalidateMask.light();
		mask.setFitContent();
		this._invalidate(mask);
	}

	public setTargetLogicalRange(range: LogicalRange): void {
		const mask = InvalidateMask.light();
		mask.applyRange(range);
		this._invalidate(mask);
	}

	public resetTimeScale(): void {
		const mask = InvalidateMask.light();
		mask.resetTimeScale();
		this._invalidate(mask);
	}

	public setBarSpacing(spacing: number): void {
		const mask = InvalidateMask.light();
		mask.setBarSpacing(spacing);
		this._invalidate(mask);
	}

	public setRightOffset(offset: number): void {
		const mask = InvalidateMask.light();
		mask.setRightOffset(offset);
		this._invalidate(mask);
	}

	public setTimeScaleAnimation(animation: ITimeScaleAnimation): void {
		const mask = InvalidateMask.light();
		mask.setTimeScaleAnimation(animation);
		this._invalidate(mask);
	}

	public stopTimeScaleAnimation(): void {
		const mask = InvalidateMask.light();
		mask.stopTimeScaleAnimation();
		this._invalidate(mask);
	}

	public defaultVisiblePriceScaleId(): string {
		return this._options.rightPriceScale.visible ? DefaultPriceScaleId.Right : DefaultPriceScaleId.Left;
	}

	public backgroundBottomColor(): string {
		return this._backgroundBottomColor;
	}

	public backgroundTopColor(): string {
		return this._backgroundTopColor;
	}

	public backgroundColorAtYPercentFromTop(percent: number): string {
		const bottomColor = this._backgroundBottomColor;
		const topColor = this._backgroundTopColor;

		if (bottomColor === topColor) {
			// solid background
			return bottomColor;
		}

		// gradient background

		// percent should be from 0 to 100 (we're using only integer values to make cache more efficient)
		percent = Math.max(0, Math.min(100, Math.round(percent * 100)));

		if (this._gradientColorsCache === null ||
			this._gradientColorsCache.topColor !== topColor || this._gradientColorsCache.bottomColor !== bottomColor) {
			this._gradientColorsCache = {
				topColor: topColor,
				bottomColor: bottomColor,
				colors: new Map(),
			};
		} else {
			const cachedValue = this._gradientColorsCache.colors.get(percent);
			if (cachedValue !== undefined) {
				return cachedValue;
			}
		}

		const result = gradientColorAtPercent(topColor, bottomColor, percent / 100);
		this._gradientColorsCache.colors.set(percent, result);
		return result;
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

	private _invalidationMaskForSource(source: IPriceDataSource, invalidateType?: InvalidationLevel): InvalidateMask {
		if (invalidateType === undefined) {
			invalidateType = InvalidationLevel.Light;
		}

		return this._paneInvalidationMask(this.paneForSource(source), invalidateType);
	}

	private _invalidate(mask: InvalidateMask): void {
		if (this._invalidateHandler) {
			this._invalidateHandler(mask);
		}

		this._panes.forEach((pane: Pane) => pane.grid().paneView().update());
	}

	private _createSeries<T extends SeriesType>(options: SeriesOptionsInternal<T>, seriesType: T, pane: Pane): Series<T> {
		const series = new Series<T>(this, options, seriesType);

		const targetScaleId = options.priceScaleId !== undefined ? options.priceScaleId : this.defaultVisiblePriceScaleId();
		pane.addDataSource(series, targetScaleId);

		if (!isDefaultPriceScale(targetScaleId)) {
			// let's apply that options again to apply margins
			series.applyOptions(options);
		}

		return series;
	}

	private _getBackgroundColor(side: BackgroundColorSide): string {
		const layoutOptions = this._options.layout;

		if (layoutOptions.background.type === ColorType.VerticalGradient) {
			return side === BackgroundColorSide.Top ?
				layoutOptions.background.topColor :
				layoutOptions.background.bottomColor;
		}

		return layoutOptions.background.color;
	}
}
