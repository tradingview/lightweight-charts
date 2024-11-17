import { ISubscription } from '../helpers/isubscription';
import { DeepPartial } from '../helpers/strict-type-checks';
import { ChartModel } from './chart-model';
import { Coordinate } from './coordinate';
import { IHorzScaleBehavior, InternalHorzScaleItem } from './ihorz-scale-behavior';
import { LocalizationOptions } from './localization-options';
import { RangeImpl } from './range-impl';
import { Logical, LogicalRange, Range, SeriesItemsIndexesRange, TickMarkWeightValue, TimedValue, TimePointIndex, TimePointsRange, TimeScalePoint } from './time-data';
/**
 * Represents a tick mark on the horizontal (time) scale.
 */
export interface TimeMark {
    /** Does time mark need to be aligned */
    needAlignCoordinate: boolean;
    /** Coordinate for the time mark */
    coord: number;
    /** Display label for the time mark */
    label: string;
    /** Weight of the time mark */
    weight: TickMarkWeightValue;
}
export declare function markWithGreaterWeight(a: TimeMark, b: TimeMark): TimeMark;
/**
 * Options for the time scale; the horizontal scale at the bottom of the chart that displays the time of data.
 */
export interface HorzScaleOptions {
    /**
     * The margin space in bars from the right side of the chart.
     *
     * @defaultValue `0`
     */
    rightOffset: number;
    /**
     * The space between bars in pixels.
     *
     * @defaultValue `6`
     */
    barSpacing: number;
    /**
     * The minimum space between bars in pixels.
     *
     * @defaultValue `0.5`
     */
    minBarSpacing: number;
    /**
     * Prevent scrolling to the left of the first bar.
     *
     * @defaultValue `false`
     */
    fixLeftEdge: boolean;
    /**
     * Prevent scrolling to the right of the most recent bar.
     *
     * @defaultValue `false`
     */
    fixRightEdge: boolean;
    /**
     * Prevent changing the visible time range during chart resizing.
     *
     * @defaultValue `false`
     */
    lockVisibleTimeRangeOnResize: boolean;
    /**
     * Prevent the hovered bar from moving when scrolling.
     *
     * @defaultValue `false`
     */
    rightBarStaysOnScroll: boolean;
    /**
     * Show the time scale border.
     *
     * @defaultValue `true`
     */
    borderVisible: boolean;
    /**
     * The time scale border color.
     *
     * @defaultValue `'#2B2B43'`
     */
    borderColor: string;
    /**
     * Show the time scale.
     *
     * @defaultValue `true`
     */
    visible: boolean;
    /**
     * Show the time, not just the date, in the time scale and vertical crosshair label.
     *
     * @defaultValue `false`
     */
    timeVisible: boolean;
    /**
     * Show seconds in the time scale and vertical crosshair label in `hh:mm:ss` format for intraday data.
     *
     * @defaultValue `true`
     */
    secondsVisible: boolean;
    /**
     * Shift the visible range to the right (into the future) by the number of new bars when new data is added.
     *
     * Note that this only applies when the last bar is visible.
     *
     * @defaultValue `true`
     */
    shiftVisibleRangeOnNewBar: boolean;
    /**
     * Allow the visible range to be shifted to the right when a new bar is added which
     * is replacing an existing whitespace time point on the chart.
     *
     * Note that this only applies when the last bar is visible & `shiftVisibleRangeOnNewBar` is enabled.
     *
     * @defaultValue `false`
     */
    allowShiftVisibleRangeOnWhitespaceReplacement: boolean;
    /**
     * Draw small vertical line on time axis labels.
     *
     * @defaultValue `false`
     */
    ticksVisible: boolean;
    /**
     * Maximum tick mark label length. Used to override the default 8 character maximum length.
     *
     * @defaultValue `undefined`
     */
    tickMarkMaxCharacterLength?: number;
    /**
     * Changes horizontal scale marks generation.
     * With this flag equal to `true`, marks of the same weight are either all drawn or none are drawn at all.
     */
    uniformDistribution: boolean;
    /**
     * Define a minimum height for the time scale.
     * Note: This value will be exceeded if the
     * time scale needs more space to display it's contents.
     *
     * Setting a minimum height could be useful for ensuring that
     * multiple charts positioned in a horizontal stack each have
     * an identical time scale height, or for plugins which
     * require a bit more space within the time scale pane.
     *
     * @defaultValue 0
     */
    minimumHeight: number;
    /**
     * Allow major time scale labels to be rendered in a bolder font weight.
     *
     * @defaultValue true
     */
    allowBoldLabels: boolean;
}
export interface ITimeScale {
    marks(): TimeMark[] | null;
    isEmpty(): boolean;
    width(): number;
    indexToTime(index: TimePointIndex): InternalHorzScaleItem | null;
    indexToCoordinate(index: TimePointIndex): Coordinate;
    visibleStrictRange(): RangeImpl<TimePointIndex> | null;
    hasPoints(): boolean;
    timeToIndex(time: InternalHorzScaleItem, findNearest: boolean): TimePointIndex | null;
    barSpacing(): number;
    rightOffset(): number;
    indexesToCoordinates<T extends TimedValue>(points: T[], visibleRange?: SeriesItemsIndexesRange): void;
    indexToTimeScalePoint(index: TimePointIndex): TimeScalePoint | null;
    formatDateTime(timeScalePoint: TimeScalePoint): string;
    coordinateToIndex(x: Coordinate): TimePointIndex;
    options(): Readonly<HorzScaleOptions>;
}
export declare class TimeScale<HorzScaleItem> implements ITimeScale {
    private readonly _options;
    private readonly _model;
    private readonly _localizationOptions;
    private _width;
    private _baseIndexOrNull;
    private _rightOffset;
    private _points;
    private _barSpacing;
    private _scrollStartPoint;
    private _scaleStartPoint;
    private readonly _tickMarks;
    private _formattedByWeight;
    private _visibleRange;
    private _visibleRangeInvalidated;
    private readonly _visibleBarsChanged;
    private readonly _logicalRangeChanged;
    private readonly _optionsApplied;
    private _commonTransitionStartState;
    private _timeMarksCache;
    private _labels;
    private readonly _horzScaleBehavior;
    constructor(model: ChartModel<HorzScaleItem>, options: HorzScaleOptions, localizationOptions: LocalizationOptions<HorzScaleItem>, horzScaleBehavior: IHorzScaleBehavior<HorzScaleItem>);
    options(): Readonly<HorzScaleOptions>;
    applyLocalizationOptions(localizationOptions: DeepPartial<LocalizationOptions<HorzScaleItem>>): void;
    applyOptions(options: DeepPartial<HorzScaleOptions>, localizationOptions?: DeepPartial<LocalizationOptions<HorzScaleItem>>): void;
    indexToTime(index: TimePointIndex): InternalHorzScaleItem | null;
    indexToTimeScalePoint(index: TimePointIndex): TimeScalePoint | null;
    timeToIndex(time: InternalHorzScaleItem, findNearest: boolean): TimePointIndex | null;
    isEmpty(): boolean;
    hasPoints(): boolean;
    visibleStrictRange(): RangeImpl<TimePointIndex> | null;
    visibleLogicalRange(): RangeImpl<Logical> | null;
    visibleTimeRange(): TimePointsRange | null;
    timeRangeForLogicalRange(range: LogicalRange): TimePointsRange;
    logicalRangeForTimeRange(range: Range<InternalHorzScaleItem>): LogicalRange;
    width(): number;
    setWidth(newWidth: number): void;
    indexToCoordinate(index: TimePointIndex): Coordinate;
    indexesToCoordinates<T extends TimedValue>(points: T[], visibleRange?: SeriesItemsIndexesRange): void;
    coordinateToIndex(x: Coordinate): TimePointIndex;
    setRightOffset(offset: number): void;
    barSpacing(): number;
    setBarSpacing(newBarSpacing: number): void;
    rightOffset(): number;
    marks(): TimeMark[] | null;
    restoreDefault(): void;
    setBaseIndex(baseIndex: TimePointIndex | null): void;
    /**
     * Zoom in/out the scale around a `zoomPoint` on `scale` value.
     *
     * @param zoomPoint - X coordinate of the point to apply the zoom.
     * If `rightBarStaysOnScroll` option is disabled, then will be used to restore right offset.
     * @param scale - Zoom value (in 1/10 parts of current bar spacing).
     * Negative value means zoom out, positive - zoom in.
     */
    zoom(zoomPoint: Coordinate, scale: number): void;
    startScale(x: Coordinate): void;
    scaleTo(x: Coordinate): void;
    endScale(): void;
    startScroll(x: Coordinate): void;
    scrollTo(x: Coordinate): void;
    endScroll(): void;
    scrollToRealTime(): void;
    scrollToOffsetAnimated(offset: number, animationDuration?: number): void;
    update(newPoints: readonly TimeScalePoint[], firstChangedPointIndex: number): void;
    visibleBarsChanged(): ISubscription;
    logicalRangeChanged(): ISubscription;
    optionsApplied(): ISubscription;
    baseIndex(): TimePointIndex;
    setVisibleRange(range: RangeImpl<TimePointIndex>): void;
    fitContent(): void;
    setLogicalRange(range: LogicalRange): void;
    formatDateTime(timeScalePoint: TimeScalePoint): string;
    private _isAllScalingAndScrollingDisabled;
    private _firstIndex;
    private _lastIndex;
    private _rightOffsetForCoordinate;
    private _coordinateToFloatIndex;
    private _setBarSpacing;
    private _updateVisibleRange;
    private _correctBarSpacing;
    private _minBarSpacing;
    private _correctOffset;
    private _minRightOffset;
    private _maxRightOffset;
    private _saveCommonTransitionsStartState;
    private _clearCommonTransitionsStartState;
    private _formatLabel;
    private _formatLabelImpl;
    private _setVisibleRange;
    private _resetTimeMarksCache;
    private _invalidateTickMarks;
    private _updateDateTimeFormatter;
    private _doFixLeftEdge;
    private _doFixRightEdge;
}
