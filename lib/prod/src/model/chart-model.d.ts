import { IDestroyable } from '../helpers/idestroyable';
import { ISubscription } from '../helpers/isubscription';
import { DeepPartial } from '../helpers/strict-type-checks';
import { PriceAxisViewRendererOptions } from '../renderers/iprice-axis-view-renderer';
import { PriceAxisRendererOptionsProvider } from '../renderers/price-axis-renderer-options-provider';
import { Coordinate } from './coordinate';
import { Crosshair, CrosshairOptions } from './crosshair';
import { GridOptions } from './grid';
import { ICustomSeriesPaneView } from './icustom-series';
import { IHorzScaleBehavior } from './ihorz-scale-behavior';
import { InvalidateMask, ITimeScaleAnimation } from './invalidate-mask';
import { IPriceDataSource } from './iprice-data-source';
import { LayoutOptions } from './layout-options';
import { LocalizationOptions, LocalizationOptionsBase } from './localization-options';
import { Pane } from './pane';
import { Point } from './point';
import { PriceScale, PriceScaleOptions } from './price-scale';
import { ISeries, Series } from './series';
import { SeriesOptionsMap, SeriesType } from './series-options';
import { LogicalRange, TimePointIndex, TimeScalePoint } from './time-data';
import { HorzScaleOptions, ITimeScale, TimeScale } from './time-scale';
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
type HandleScaleOptionsInternal = Omit<HandleScaleOptions, 'axisPressedMouseMove' | 'axisDoubleClickReset'> & {
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
export declare const enum TrackingModeExitMode {
    /**
     * Tracking Mode will be deactivated on touch end event.
     */
    OnTouchEnd = 0,
    /**
     * Tracking Mode will be deactivated on the next tap event.
     */
    OnNextTap = 1
}
/**
 * Represent options for the tracking mode's behavior.
 *
 * Mobile users will not have the ability to see the values/dates like they do on desktop.
 * To see it, they should enter the tracking mode. The tracking mode will deactivate the scrolling
 * and make it possible to check values and dates.
 */
export interface TrackingModeOptions {
    /** @inheritDoc TrackingModeExitMode
     *
     * @defaultValue {@link TrackingModeExitMode.OnNextTap}
     */
    exitMode: TrackingModeExitMode;
}
/**
 * Represents common chart options
 */
export interface ChartOptionsBase {
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
     * Setting this flag to `true` will make the chart watch the chart container's size and automatically resize the chart to fit its container whenever the size changes.
     *
     * This feature requires [`ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) class to be available in the global scope.
     * Note that calling code is responsible for providing a polyfill if required. If the global scope does not have `ResizeObserver`, a warning will appear and the flag will be ignored.
     *
     * Please pay attention that `autoSize` option and explicit sizes options `width` and `height` don't conflict with one another.
     * If you specify `autoSize` flag, then `width` and `height` options will be ignored unless `ResizeObserver` has failed. If it fails then the values will be used as fallback.
     *
     * The flag `autoSize` could also be set with and unset with `applyOptions` function.
     * ```js
     * const chart = LightweightCharts.createChart(document.body, {
     *     autoSize: true,
     * });
     * ```
     */
    autoSize: boolean;
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
    timeScale: HorzScaleOptions;
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
    /** @inheritDoc TrackingModeOptions
     */
    trackingMode: TrackingModeOptions;
    /**
     * Basic localization options
     */
    localization: LocalizationOptionsBase;
}
/**
 * Structure describing options of the chart. Series options are to be set separately
 */
export interface ChartOptionsImpl<HorzScaleItem> extends ChartOptionsBase {
    /**
     * Localization options.
     */
    localization: LocalizationOptions<HorzScaleItem>;
}
export type ChartOptionsInternalBase = Omit<ChartOptionsBase, 'handleScroll' | 'handleScale' | 'layout'> & {
    /** @public */
    handleScroll: HandleScrollOptions;
    /** @public */
    handleScale: HandleScaleOptionsInternal;
    /** @public */
    layout: LayoutOptions;
};
export type ChartOptionsInternal<HorzScaleItem> = Omit<ChartOptionsImpl<HorzScaleItem>, 'handleScroll' | 'handleScale' | 'layout'> & {
    /** @public */
    handleScroll: HandleScrollOptions;
    /** @public */
    handleScale: HandleScaleOptionsInternal;
    /** @public */
    layout: LayoutOptions;
};
export interface IChartModelBase {
    applyPriceScaleOptions(priceScaleId: string, options: DeepPartial<PriceScaleOptions>): void;
    findPriceScale(priceScaleId: string): PriceScaleOnPane | null;
    options(): Readonly<ChartOptionsInternalBase>;
    timeScale(): ITimeScale;
    serieses(): readonly ISeries<SeriesType>[];
    updateSource(source: IPriceDataSource): void;
    updateCrosshair(): void;
    cursorUpdate(): void;
    clearCurrentPosition(): void;
    setAndSaveCurrentPosition(x: Coordinate, y: Coordinate, event: TouchMouseEventData | null, pane: Pane): void;
    recalculatePane(pane: Pane | null): void;
    lightUpdate(): void;
    fullUpdate(): void;
    backgroundBottomColor(): string;
    backgroundTopColor(): string;
    backgroundColorAtYPercentFromTop(percent: number): string;
    paneForSource(source: IPriceDataSource): Pane | null;
    moveSeriesToScale(series: ISeries<SeriesType>, targetScaleId: string): void;
    priceAxisRendererOptions(): Readonly<PriceAxisViewRendererOptions>;
    rendererOptionsProvider(): PriceAxisRendererOptionsProvider;
    priceScalesOptionsChanged(): ISubscription;
    hoveredSource(): HoveredSource | null;
    setHoveredSource(source: HoveredSource | null): void;
    crosshairSource(): Crosshair;
    watermarkSource(): Watermark;
    startScrollPrice(pane: Pane, priceScale: PriceScale, x: number): void;
    scrollPriceTo(pane: Pane, priceScale: PriceScale, x: number): void;
    endScrollPrice(pane: Pane, priceScale: PriceScale): void;
    resetPriceScale(pane: Pane, priceScale: PriceScale): void;
    startScalePrice(pane: Pane, priceScale: PriceScale, x: number): void;
    scalePriceTo(pane: Pane, priceScale: PriceScale, x: number): void;
    endScalePrice(pane: Pane, priceScale: PriceScale): void;
    zoomTime(pointX: Coordinate, scale: number): void;
    startScrollTime(x: Coordinate): void;
    scrollTimeTo(x: Coordinate): void;
    endScrollTime(): void;
    setTimeScaleAnimation(animation: ITimeScaleAnimation): void;
    stopTimeScaleAnimation(): void;
}
export declare class ChartModel<HorzScaleItem> implements IDestroyable, IChartModelBase {
    private readonly _options;
    private readonly _invalidateHandler;
    private readonly _rendererOptionsProvider;
    private readonly _timeScale;
    private readonly _panes;
    private readonly _crosshair;
    private readonly _magnet;
    private readonly _watermark;
    private _serieses;
    private _width;
    private _hoveredSource;
    private readonly _priceScalesOptionsChanged;
    private _crosshairMoved;
    private _backgroundTopColor;
    private _backgroundBottomColor;
    private _gradientColorsCache;
    private readonly _horzScaleBehavior;
    constructor(invalidateHandler: InvalidateHandler, options: ChartOptionsInternal<HorzScaleItem>, horzScaleBehavior: IHorzScaleBehavior<HorzScaleItem>);
    fullUpdate(): void;
    lightUpdate(): void;
    cursorUpdate(): void;
    updateSource(source: IPriceDataSource): void;
    hoveredSource(): HoveredSource | null;
    setHoveredSource(source: HoveredSource | null): void;
    options(): Readonly<ChartOptionsInternal<HorzScaleItem>>;
    applyOptions(options: DeepPartial<ChartOptionsInternal<HorzScaleItem>>): void;
    applyPriceScaleOptions(priceScaleId: string, options: DeepPartial<PriceScaleOptions>): void;
    findPriceScale(priceScaleId: string): PriceScaleOnPane | null;
    timeScale(): TimeScale<HorzScaleItem>;
    panes(): readonly Pane[];
    watermarkSource(): Watermark;
    crosshairSource(): Crosshair;
    crosshairMoved(): ISubscription<TimePointIndex | null, Point | null, TouchMouseEventData | null>;
    setPaneHeight(pane: Pane, height: number): void;
    setWidth(width: number): void;
    createPane(index?: number): Pane;
    startScalePrice(pane: Pane, priceScale: PriceScale, x: number): void;
    scalePriceTo(pane: Pane, priceScale: PriceScale, x: number): void;
    endScalePrice(pane: Pane, priceScale: PriceScale): void;
    startScrollPrice(pane: Pane, priceScale: PriceScale, x: number): void;
    scrollPriceTo(pane: Pane, priceScale: PriceScale, x: number): void;
    endScrollPrice(pane: Pane, priceScale: PriceScale): void;
    resetPriceScale(pane: Pane, priceScale: PriceScale): void;
    startScaleTime(position: Coordinate): void;
    /**
     * Zoom in/out the chart (depends on scale value).
     *
     * @param pointX - X coordinate of the point to apply the zoom (the point which should stay on its place)
     * @param scale - Zoom value. Negative value means zoom out, positive - zoom in.
     */
    zoomTime(pointX: Coordinate, scale: number): void;
    scrollChart(x: Coordinate): void;
    scaleTimeTo(x: Coordinate): void;
    endScaleTime(): void;
    startScrollTime(x: Coordinate): void;
    scrollTimeTo(x: Coordinate): void;
    endScrollTime(): void;
    serieses(): readonly Series<SeriesType>[];
    setAndSaveCurrentPosition(x: Coordinate, y: Coordinate, event: TouchMouseEventData | null, pane: Pane, skipEvent?: boolean): void;
    setAndSaveSyntheticPosition(price: number, horizontalPosition: HorzScaleItem, pane: Pane): void;
    clearCurrentPosition(skipEvent?: boolean): void;
    updateCrosshair(): void;
    updateTimeScale(newBaseIndex: TimePointIndex | null, newPoints?: readonly TimeScalePoint[], firstChangedPointIndex?: number): void;
    recalculatePane(pane: Pane | null): void;
    paneForSource(source: IPriceDataSource): Pane | null;
    recalculateAllPanes(): void;
    destroy(): void;
    rendererOptionsProvider(): PriceAxisRendererOptionsProvider;
    priceAxisRendererOptions(): Readonly<PriceAxisViewRendererOptions>;
    priceScalesOptionsChanged(): ISubscription;
    createSeries<T extends SeriesType>(seriesType: T, options: SeriesOptionsMap[T], customPaneView?: ICustomSeriesPaneView<HorzScaleItem>): Series<T>;
    removeSeries(series: Series<SeriesType>): void;
    moveSeriesToScale(series: Series<SeriesType>, targetScaleId: string): void;
    fitContent(): void;
    setTargetLogicalRange(range: LogicalRange): void;
    resetTimeScale(): void;
    setBarSpacing(spacing: number): void;
    setRightOffset(offset: number): void;
    setTimeScaleAnimation(animation: ITimeScaleAnimation): void;
    stopTimeScaleAnimation(): void;
    defaultVisiblePriceScaleId(): string;
    backgroundBottomColor(): string;
    backgroundTopColor(): string;
    backgroundColorAtYPercentFromTop(percent: number): string;
    private _paneInvalidationMask;
    private _invalidationMaskForSource;
    private _invalidate;
    private _createSeries;
    private _getBackgroundColor;
}
export {};
