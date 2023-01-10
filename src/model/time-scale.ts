import { DateFormatter } from '../formatters/date-formatter';
import { DateTimeFormatter } from '../formatters/date-time-formatter';

import { lowerbound } from '../helpers/algorithms';
import { ensureNotNull } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { ISubscription } from '../helpers/isubscription';
import { clamp } from '../helpers/mathex';
import { DeepPartial, isInteger, merge } from '../helpers/strict-type-checks';

import { ChartModel } from './chart-model';
import { Coordinate } from './coordinate';
import { defaultTickMarkFormatter } from './default-tick-mark-formatter';
import { FormattedLabelsCache } from './formatted-labels-cache';
import { LocalizationOptions } from './localization-options';
import { areRangesEqual, RangeImpl } from './range-impl';
import { TickMark, TickMarks } from './tick-marks';
import {
	Logical,
	LogicalRange,
	SeriesItemsIndexesRange,
	TickMarkWeight,
	Time,
	TimedValue,
	TimePoint,
	TimePointIndex,
	TimePointsRange,
	TimeScalePoint,
	UTCTimestamp,
} from './time-data';
import { TimeScaleVisibleRange } from './time-scale-visible-range';

const enum Constants {
	DefaultAnimationDuration = 400,
	// make sure that this (1 / MinVisibleBarsCount) >= coeff in max bar spacing
	MinVisibleBarsCount = 2,
}

interface TransitionState {
	barSpacing: number;
	rightOffset: number;
}

export interface TimeMark {
	needAlignCoordinate: boolean;
	coord: number;
	label: string;
	weight: TickMarkWeight;
}

/**
 * Represents the type of a tick mark on the time axis.
 */
export const enum TickMarkType {
	/**
	 * The start of the year (e.g. it's the first tick mark in a year).
	 */
	Year,
	/**
	 * The start of the month (e.g. it's the first tick mark in a month).
	 */
	Month,
	/**
	 * A day of the month.
	 */
	DayOfMonth,
	/**
	 * A time without seconds.
	 */
	// eslint-disable-next-line @typescript-eslint/no-shadow
	Time,
	/**
	 * A time with seconds.
	 */
	TimeWithSeconds,
}

/**
 * The `TickMarkFormatter` is used to customize tick mark labels on the time scale.
 *
 * This function should return `time` as a string formatted according to `tickMarkType` type (year, month, etc) and `locale`.
 *
 * Note that the returned string should be the shortest possible value and should have no more than 8 characters.
 * Otherwise, the tick marks will overlap each other.
 *
 * If the formatter function returns `null` then the default tick mark formatter will be used as a fallback.
 *
 * @example
 * ```js
 * const customFormatter = (time, tickMarkType, locale) => {
 *     // your code here
 * };
 * ```
 */
export type TickMarkFormatter = (time: Time, tickMarkType: TickMarkType, locale: string) => string | null;

/**
 * Options for the time scale; the horizontal scale at the bottom of the chart that displays the time of data.
 */
export interface TimeScaleOptions {
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
	 * Tick marks formatter can be used to customize tick marks labels on the time axis.
	 *
	 * @defaultValue `undefined`
	 */
	tickMarkFormatter?: TickMarkFormatter;

	/**
	 * Draw small vertical line on time axis labels.
	 *
	 * @defaultValue `false`
	 */
	ticksVisible: boolean;
}

export class TimeScale {
	private readonly _options: TimeScaleOptions;
	private readonly _model: ChartModel;
	private readonly _localizationOptions: LocalizationOptions;

	private _dateTimeFormatter!: DateFormatter | DateTimeFormatter;

	private _width: number = 0;
	private _baseIndexOrNull: TimePointIndex | null = null;
	private _rightOffset: number;
	private _points: readonly TimeScalePoint[] = [];
	private _barSpacing: number;
	private _scrollStartPoint: Coordinate | null = null;
	private _scaleStartPoint: Coordinate | null = null;
	private readonly _tickMarks: TickMarks = new TickMarks();
	private _formattedByWeight: Map<number, FormattedLabelsCache> = new Map();

	private _visibleRange: TimeScaleVisibleRange = TimeScaleVisibleRange.invalid();
	private _visibleRangeInvalidated: boolean = true;

	private readonly _visibleBarsChanged: Delegate = new Delegate();
	private readonly _logicalRangeChanged: Delegate = new Delegate();

	private readonly _optionsApplied: Delegate = new Delegate();
	private _commonTransitionStartState: TransitionState | null = null;
	private _timeMarksCache: TimeMark[] | null = null;

	private _labels: TimeMark[] = [];

	public constructor(model: ChartModel, options: TimeScaleOptions, localizationOptions: LocalizationOptions) {
		this._options = options;
		this._localizationOptions = localizationOptions;
		this._rightOffset = options.rightOffset;
		this._barSpacing = options.barSpacing;
		this._model = model;

		this._updateDateTimeFormatter();
	}

	public options(): Readonly<TimeScaleOptions> {
		return this._options;
	}

	public applyLocalizationOptions(localizationOptions: DeepPartial<LocalizationOptions>): void {
		merge(this._localizationOptions, localizationOptions);

		this._invalidateTickMarks();
		this._updateDateTimeFormatter();
	}

	public applyOptions(options: DeepPartial<TimeScaleOptions>, localizationOptions?: DeepPartial<LocalizationOptions>): void {
		merge(this._options, options);

		if (this._options.fixLeftEdge) {
			this._doFixLeftEdge();
		}

		if (this._options.fixRightEdge) {
			this._doFixRightEdge();
		}

		// note that bar spacing should be applied before right offset
		// because right offset depends on bar spacing
		if (options.barSpacing !== undefined) {
			this._model.setBarSpacing(options.barSpacing);
		}

		if (options.rightOffset !== undefined) {
			this._model.setRightOffset(options.rightOffset);
		}

		if (options.minBarSpacing !== undefined) {
			// yes, if we apply min bar spacing then we need to correct bar spacing
			// the easiest way is to apply it once again
			this._model.setBarSpacing(options.barSpacing ?? this._barSpacing);
		}

		this._invalidateTickMarks();
		this._updateDateTimeFormatter();

		this._optionsApplied.fire();
	}

	public indexToTime(index: TimePointIndex): TimePoint | null {
		return this._points[index]?.time ?? null;
	}

	public indexToTimeScalePoint(index: TimePointIndex): TimeScalePoint | null {
		return this._points[index] ?? null;
	}

	public timeToIndex(time: TimePoint, findNearest: boolean): TimePointIndex | null {
		if (this._points.length < 1) {
			// no time points available
			return null;
		}

		if (time.timestamp > this._points[this._points.length - 1].time.timestamp) {
			// special case
			return findNearest ? this._points.length - 1 as TimePointIndex : null;
		}

		const index = lowerbound(this._points, time.timestamp, (a: TimeScalePoint, b: UTCTimestamp) => a.time.timestamp < b);

		if (time.timestamp < this._points[index].time.timestamp) {
			return findNearest ? index as TimePointIndex : null;
		}

		return index as TimePointIndex;
	}

	public isEmpty(): boolean {
		return this._width === 0 || this._points.length === 0 || this._baseIndexOrNull === null;
	}

	// strict range: integer indices of the bars in the visible range rounded in more wide direction
	public visibleStrictRange(): RangeImpl<TimePointIndex> | null {
		this._updateVisibleRange();
		return this._visibleRange.strictRange();
	}

	public visibleLogicalRange(): RangeImpl<Logical> | null {
		this._updateVisibleRange();
		return this._visibleRange.logicalRange();
	}

	public visibleTimeRange(): TimePointsRange | null {
		const visibleBars = this.visibleStrictRange();
		if (visibleBars === null) {
			return null;
		}

		const range: LogicalRange = {
			from: visibleBars.left() as number as Logical,
			to: visibleBars.right() as number as Logical,
		};

		return this.timeRangeForLogicalRange(range);
	}

	public timeRangeForLogicalRange(range: LogicalRange): TimePointsRange {
		const from = Math.round(range.from);
		const to = Math.round(range.to);

		const firstIndex = ensureNotNull(this._firstIndex());
		const lastIndex = ensureNotNull(this._lastIndex());

		return {
			from: ensureNotNull(this.indexToTime(Math.max(firstIndex, from) as TimePointIndex) as TimePoint),
			to: ensureNotNull(this.indexToTime(Math.min(lastIndex, to) as TimePointIndex) as TimePoint),
		};
	}

	public logicalRangeForTimeRange(range: TimePointsRange): LogicalRange {
		return {
			from: ensureNotNull(this.timeToIndex(range.from, true)) as number as Logical,
			to: ensureNotNull(this.timeToIndex(range.to, true)) as number as Logical,
		};
	}

	public width(): number {
		return this._width;
	}

	public setWidth(newWidth: number): void {
		if (!isFinite(newWidth) || newWidth <= 0) {
			return;
		}

		if (this._width === newWidth) {
			return;
		}

		// when we change the width and we need to correct visible range because of fixing left edge
		// we need to check the previous visible range rather than the new one
		// because it might be updated by changing width, bar spacing, etc
		// but we need to try to keep the same range
		const previousVisibleRange = this.visibleLogicalRange();

		const oldWidth = this._width;
		this._width = newWidth;
		this._visibleRangeInvalidated = true;

		if (this._options.lockVisibleTimeRangeOnResize && oldWidth !== 0) {
			// recalculate bar spacing
			const newBarSpacing = this._barSpacing * newWidth / oldWidth;
			this._barSpacing = newBarSpacing;
		}

		// if time scale is scrolled to the end of data and we have fixed right edge
		// keep left edge instead of right
		// we need it to avoid "shaking" if the last bar visibility affects time scale width
		if (this._options.fixLeftEdge) {
			// note that logical left range means not the middle of a bar (it's the left border)
			if (previousVisibleRange !== null && previousVisibleRange.left() <= 0) {
				const delta = oldWidth - newWidth;
				// reduce  _rightOffset means move right
				// we could move more than required - this will be fixed by _correctOffset()
				this._rightOffset -= Math.round(delta / this._barSpacing) + 1;
				this._visibleRangeInvalidated = true;
			}
		}

		// updating bar spacing should be first because right offset depends on it
		this._correctBarSpacing();
		this._correctOffset();
	}

	public indexToCoordinate(index: TimePointIndex): Coordinate {
		if (this.isEmpty() || !isInteger(index)) {
			return 0 as Coordinate;
		}

		const baseIndex = this.baseIndex();
		const deltaFromRight = baseIndex + this._rightOffset - index;
		const coordinate = this._width - (deltaFromRight + 0.5) * this._barSpacing - 1;
		return coordinate as Coordinate;
	}

	public indexesToCoordinates<T extends TimedValue>(points: T[], visibleRange?: SeriesItemsIndexesRange): void {
		const baseIndex = this.baseIndex();
		const indexFrom = (visibleRange === undefined) ? 0 : visibleRange.from;
		const indexTo = (visibleRange === undefined) ? points.length : visibleRange.to;

		for (let i = indexFrom; i < indexTo; i++) {
			const index = points[i].time;
			const deltaFromRight = baseIndex + this._rightOffset - index;
			const coordinate = this._width - (deltaFromRight + 0.5) * this._barSpacing - 1;
			points[i].x = coordinate as Coordinate;
		}
	}

	public coordinateToIndex(x: Coordinate): TimePointIndex {
		return Math.ceil(this._coordinateToFloatIndex(x)) as TimePointIndex;
	}

	public setRightOffset(offset: number): void {
		this._visibleRangeInvalidated = true;
		this._rightOffset = offset;
		this._correctOffset();
		this._model.recalculateAllPanes();
		this._model.lightUpdate();
	}

	public barSpacing(): number {
		return this._barSpacing;
	}

	public setBarSpacing(newBarSpacing: number): void {
		this._setBarSpacing(newBarSpacing);

		// do not allow scroll out of visible bars
		this._correctOffset();

		this._model.recalculateAllPanes();
		this._model.lightUpdate();
	}

	public rightOffset(): number {
		return this._rightOffset;
	}

	// eslint-disable-next-line complexity
	public marks(): TimeMark[] | null {
		if (this.isEmpty()) {
			return null;
		}

		if (this._timeMarksCache !== null) {
			return this._timeMarksCache;
		}

		const spacing = this._barSpacing;
		const fontSize = this._model.options().layout.fontSize;

		const maxLabelWidth = (fontSize + 4) * 5;
		const indexPerLabel = Math.round(maxLabelWidth / spacing);

		const visibleBars = ensureNotNull(this.visibleStrictRange());

		const firstBar = Math.max(visibleBars.left(), visibleBars.left() - indexPerLabel);
		const lastBar = Math.max(visibleBars.right(), visibleBars.right() - indexPerLabel);

		const items = this._tickMarks.build(spacing, maxLabelWidth);

		// according to indexPerLabel value this value means "earliest index which _might be_ used as the second label on time scale"
		const earliestIndexOfSecondLabel = (this._firstIndex() as number) + indexPerLabel;

		// according to indexPerLabel value this value means "earliest index which _might be_ used as the second last label on time scale"
		const indexOfSecondLastLabel = (this._lastIndex() as number) - indexPerLabel;

		const isAllScalingAndScrollingDisabled = this._isAllScalingAndScrollingDisabled();
		const isLeftEdgeFixed = this._options.fixLeftEdge || isAllScalingAndScrollingDisabled;
		const isRightEdgeFixed = this._options.fixRightEdge || isAllScalingAndScrollingDisabled;

		let targetIndex = 0;
		for (const tm of items) {
			if (!(firstBar <= tm.index && tm.index <= lastBar)) {
				continue;
			}

			let label: TimeMark;
			if (targetIndex < this._labels.length) {
				label = this._labels[targetIndex];
				label.coord = this.indexToCoordinate(tm.index);
				label.label = this._formatLabel(tm);
				label.weight = tm.weight;
			} else {
				label = {
					needAlignCoordinate: false,
					coord: this.indexToCoordinate(tm.index),
					label: this._formatLabel(tm),
					weight: tm.weight,
				};

				this._labels.push(label);
			}

			if (this._barSpacing > (maxLabelWidth / 2) && !isAllScalingAndScrollingDisabled) {
				// if there is enough space then let's show all tick marks as usual
				label.needAlignCoordinate = false;
			} else {
				// if a user is able to scroll after a tick mark then show it as usual, otherwise the coordinate might be aligned
				// if the index is for the second (last) label or later (earlier) then most likely this label might be displayed without correcting the coordinate
				label.needAlignCoordinate = (isLeftEdgeFixed && tm.index <= earliestIndexOfSecondLabel) || (isRightEdgeFixed && tm.index >= indexOfSecondLastLabel);
			}

			targetIndex++;
		}
		this._labels.length = targetIndex;

		this._timeMarksCache = this._labels;

		return this._labels;
	}

	public restoreDefault(): void {
		this._visibleRangeInvalidated = true;

		this.setBarSpacing(this._options.barSpacing);
		this.setRightOffset(this._options.rightOffset);
	}

	public setBaseIndex(baseIndex: TimePointIndex | null): void {
		this._visibleRangeInvalidated = true;
		this._baseIndexOrNull = baseIndex;
		this._correctOffset();

		this._doFixLeftEdge();
	}

	/**
	 * Zoom in/out the scale around a `zoomPoint` on `scale` value.
	 *
	 * @param zoomPoint - X coordinate of the point to apply the zoom.
	 * If `rightBarStaysOnScroll` option is disabled, then will be used to restore right offset.
	 * @param scale - Zoom value (in 1/10 parts of current bar spacing).
	 * Negative value means zoom out, positive - zoom in.
	 */
	public zoom(zoomPoint: Coordinate, scale: number): void {
		const floatIndexAtZoomPoint = this._coordinateToFloatIndex(zoomPoint);

		const barSpacing = this.barSpacing();
		const newBarSpacing = barSpacing + scale * (barSpacing / 10);

		// zoom in/out bar spacing
		this.setBarSpacing(newBarSpacing);

		if (!this._options.rightBarStaysOnScroll) {
			// and then correct right offset to move index under zoomPoint back to its coordinate
			this.setRightOffset(this.rightOffset() + (floatIndexAtZoomPoint - this._coordinateToFloatIndex(zoomPoint)));
		}
	}

	public startScale(x: Coordinate): void {
		if (this._scrollStartPoint) {
			this.endScroll();
		}

		if (this._scaleStartPoint !== null || this._commonTransitionStartState !== null) {
			return;
		}

		if (this.isEmpty()) {
			return;
		}

		this._scaleStartPoint = x;
		this._saveCommonTransitionsStartState();
	}

	public scaleTo(x: Coordinate): void {
		if (this._commonTransitionStartState === null) {
			return;
		}

		const startLengthFromRight = clamp(this._width - x, 0, this._width);
		const currentLengthFromRight = clamp(this._width - ensureNotNull(this._scaleStartPoint), 0, this._width);
		if (startLengthFromRight === 0 || currentLengthFromRight === 0) {
			return;
		}

		this.setBarSpacing(
			this._commonTransitionStartState.barSpacing * startLengthFromRight / currentLengthFromRight
		);
	}

	public endScale(): void {
		if (this._scaleStartPoint === null) {
			return;
		}

		this._scaleStartPoint = null;
		this._clearCommonTransitionsStartState();
	}

	public startScroll(x: Coordinate): void {
		if (this._scrollStartPoint !== null || this._commonTransitionStartState !== null) {
			return;
		}

		if (this.isEmpty()) {
			return;
		}

		this._scrollStartPoint = x;
		this._saveCommonTransitionsStartState();
	}

	public scrollTo(x: Coordinate): void {
		if (this._scrollStartPoint === null) {
			return;
		}

		const shiftInLogical = (this._scrollStartPoint - x) / this.barSpacing();
		this._rightOffset = ensureNotNull(this._commonTransitionStartState).rightOffset + shiftInLogical;
		this._visibleRangeInvalidated = true;

		// do not allow scroll out of visible bars
		this._correctOffset();
	}

	public endScroll(): void {
		if (this._scrollStartPoint === null) {
			return;
		}

		this._scrollStartPoint = null;
		this._clearCommonTransitionsStartState();
	}

	public scrollToRealTime(): void {
		this.scrollToOffsetAnimated(this._options.rightOffset);
	}

	public scrollToOffsetAnimated(offset: number, animationDuration: number = Constants.DefaultAnimationDuration): void {
		if (!isFinite(offset)) {
			throw new RangeError('offset is required and must be finite number');
		}

		if (!isFinite(animationDuration) || animationDuration <= 0) {
			throw new RangeError('animationDuration (optional) must be finite positive number');
		}

		const source = this._rightOffset;
		const animationStart = performance.now();

		this._model.setTimeScaleAnimation({
			finished: (time: number) => (time - animationStart) / animationDuration >= 1,
			getPosition: (time: number) => {
				const animationProgress = (time - animationStart) / animationDuration;
				const finishAnimation = animationProgress >= 1;
				return finishAnimation ? offset : source + (offset - source) * animationProgress;
			},
		});
	}

	public update(newPoints: readonly TimeScalePoint[], firstChangedPointIndex: number): void {
		this._visibleRangeInvalidated = true;

		this._points = newPoints;
		this._tickMarks.setTimeScalePoints(newPoints, firstChangedPointIndex);
		this._correctOffset();
	}

	public visibleBarsChanged(): ISubscription {
		return this._visibleBarsChanged;
	}

	public logicalRangeChanged(): ISubscription {
		return this._logicalRangeChanged;
	}

	public optionsApplied(): ISubscription {
		return this._optionsApplied;
	}

	public baseIndex(): TimePointIndex {
		// null is used to known that baseIndex is not set yet
		// so in methods which should known whether it is set or not
		// we should check field `_baseIndexOrNull` instead of getter `baseIndex()`
		// see minRightOffset for example
		return this._baseIndexOrNull || 0 as TimePointIndex;
	}

	public setVisibleRange(range: RangeImpl<TimePointIndex>): void {
		const length = range.count();
		this._setBarSpacing(this._width / length);
		this._rightOffset = range.right() - this.baseIndex();
		this._correctOffset();
		this._visibleRangeInvalidated = true;
		this._model.recalculateAllPanes();
		this._model.lightUpdate();
	}

	public fitContent(): void {
		const first = this._firstIndex();
		const last = this._lastIndex();
		if (first === null || last === null) {
			return;
		}

		this.setVisibleRange(new RangeImpl(first, last + this._options.rightOffset as TimePointIndex));
	}

	public setLogicalRange(range: LogicalRange): void {
		const barRange = new RangeImpl(
			range.from as number as TimePointIndex,
			range.to as number as TimePointIndex
		);
		this.setVisibleRange(barRange);
	}

	public formatDateTime(timeScalePoint: TimeScalePoint): string {
		if (this._localizationOptions.timeFormatter !== undefined) {
			return this._localizationOptions.timeFormatter(timeScalePoint.originalTime as unknown as Time);
		}

		return this._dateTimeFormatter.format(new Date(timeScalePoint.time.timestamp * 1000));
	}

	private _isAllScalingAndScrollingDisabled(): boolean {
		const { handleScroll, handleScale } = this._model.options();
		return !handleScroll.horzTouchDrag
			&& !handleScroll.mouseWheel
			&& !handleScroll.pressedMouseMove
			&& !handleScroll.vertTouchDrag
			&& !handleScale.axisDoubleClickReset.time
			&& !handleScale.axisPressedMouseMove.time
			&& !handleScale.mouseWheel
			&& !handleScale.pinch;
	}

	private _firstIndex(): TimePointIndex | null {
		return this._points.length === 0 ? null : 0 as TimePointIndex;
	}

	private _lastIndex(): TimePointIndex | null {
		return this._points.length === 0 ? null : (this._points.length - 1) as TimePointIndex;
	}

	private _rightOffsetForCoordinate(x: Coordinate): number {
		return (this._width - 1 - x) / this._barSpacing;
	}

	private _coordinateToFloatIndex(x: Coordinate): number {
		const deltaFromRight = this._rightOffsetForCoordinate(x);
		const baseIndex = this.baseIndex();
		const index = baseIndex + this._rightOffset - deltaFromRight;

		// JavaScript uses very strange rounding
		// we need rounding to avoid problems with calculation errors
		return Math.round(index * 1000000) / 1000000;
	}

	private _setBarSpacing(newBarSpacing: number): void {
		const oldBarSpacing = this._barSpacing;
		this._barSpacing = newBarSpacing;
		this._correctBarSpacing();

		// this._barSpacing might be changed in _correctBarSpacing
		if (oldBarSpacing !== this._barSpacing) {
			this._visibleRangeInvalidated = true;
			this._resetTimeMarksCache();
		}
	}

	private _updateVisibleRange(): void {
		if (!this._visibleRangeInvalidated) {
			return;
		}

		this._visibleRangeInvalidated = false;

		if (this.isEmpty()) {
			this._setVisibleRange(TimeScaleVisibleRange.invalid());
			return;
		}

		const baseIndex = this.baseIndex();
		const newBarsLength = this._width / this._barSpacing;
		const rightBorder = this._rightOffset + baseIndex;
		const leftBorder = rightBorder - newBarsLength + 1;

		const logicalRange = new RangeImpl(leftBorder as Logical, rightBorder as Logical);
		this._setVisibleRange(new TimeScaleVisibleRange(logicalRange));
	}

	private _correctBarSpacing(): void {
		const minBarSpacing = this._minBarSpacing();

		if (this._barSpacing < minBarSpacing) {
			this._barSpacing = minBarSpacing;
			this._visibleRangeInvalidated = true;
		}

		if (this._width !== 0) {
			// make sure that this (1 / Constants.MinVisibleBarsCount) >= coeff in max bar spacing (it's 0.5 here)
			const maxBarSpacing = this._width * 0.5;
			if (this._barSpacing > maxBarSpacing) {
				this._barSpacing = maxBarSpacing;
				this._visibleRangeInvalidated = true;
			}
		}
	}

	private _minBarSpacing(): number {
		// if both options are enabled then limit bar spacing so that zooming-out is not possible
		// if it would cause either the first or last points to move too far from an edge
		if (this._options.fixLeftEdge && this._options.fixRightEdge && this._points.length !== 0) {
			return this._width / this._points.length;
		}

		return this._options.minBarSpacing;
	}

	private _correctOffset(): void {
		// block scrolling of to future
		const maxRightOffset = this._maxRightOffset();
		if (this._rightOffset > maxRightOffset) {
			this._rightOffset = maxRightOffset;
			this._visibleRangeInvalidated = true;
		}

		// block scrolling of to past
		const minRightOffset = this._minRightOffset();

		if (minRightOffset !== null && this._rightOffset < minRightOffset) {
			this._rightOffset = minRightOffset;
			this._visibleRangeInvalidated = true;
		}
	}

	private _minRightOffset(): number | null {
		const firstIndex = this._firstIndex();
		const baseIndex = this._baseIndexOrNull;
		if (firstIndex === null || baseIndex === null) {
			return null;
		}

		const barsEstimation = this._options.fixLeftEdge
			? this._width / this._barSpacing
			: Math.min(Constants.MinVisibleBarsCount, this._points.length);

		return firstIndex - baseIndex - 1 + barsEstimation;
	}

	private _maxRightOffset(): number {
		return this._options.fixRightEdge
			? 0
			: (this._width / this._barSpacing) - Math.min(Constants.MinVisibleBarsCount, this._points.length);
	}

	private _saveCommonTransitionsStartState(): void {
		this._commonTransitionStartState = {
			barSpacing: this.barSpacing(),
			rightOffset: this.rightOffset(),
		};
	}

	private _clearCommonTransitionsStartState(): void {
		this._commonTransitionStartState = null;
	}

	private _formatLabel(tickMark: TickMark): string {
		let formatter = this._formattedByWeight.get(tickMark.weight);
		if (formatter === undefined) {
			formatter = new FormattedLabelsCache((mark: TickMark) => {
				return this._formatLabelImpl(mark);
			});

			this._formattedByWeight.set(tickMark.weight, formatter);
		}

		return formatter.format(tickMark);
	}

	private _formatLabelImpl(tickMark: TickMark): string {
		const tickMarkType = weightToTickMarkType(tickMark.weight, this._options.timeVisible, this._options.secondsVisible);

		if (this._options.tickMarkFormatter !== undefined) {
			const tickMarkString = this._options.tickMarkFormatter(
				tickMark.originalTime as unknown as Time,
				tickMarkType,
				this._localizationOptions.locale
			);
			if (tickMarkString !== null) {
				return tickMarkString;
			}
		}

		return defaultTickMarkFormatter(tickMark.time, tickMarkType, this._localizationOptions.locale);
	}

	private _setVisibleRange(newVisibleRange: TimeScaleVisibleRange): void {
		const oldVisibleRange = this._visibleRange;
		this._visibleRange = newVisibleRange;

		if (!areRangesEqual(oldVisibleRange.strictRange(), this._visibleRange.strictRange())) {
			this._visibleBarsChanged.fire();
		}

		if (!areRangesEqual(oldVisibleRange.logicalRange(), this._visibleRange.logicalRange())) {
			this._logicalRangeChanged.fire();
		}

		// TODO: reset only coords in case when this._visibleBars has not been changed
		this._resetTimeMarksCache();
	}

	private _resetTimeMarksCache(): void {
		this._timeMarksCache = null;
	}

	private _invalidateTickMarks(): void {
		this._resetTimeMarksCache();
		this._formattedByWeight.clear();
	}

	private _updateDateTimeFormatter(): void {
		const dateFormat = this._localizationOptions.dateFormat;

		if (this._options.timeVisible) {
			this._dateTimeFormatter = new DateTimeFormatter({
				dateFormat: dateFormat,
				timeFormat: this._options.secondsVisible ? '%h:%m:%s' : '%h:%m',
				dateTimeSeparator: '   ',
				locale: this._localizationOptions.locale,
			});
		} else {
			this._dateTimeFormatter = new DateFormatter(dateFormat, this._localizationOptions.locale);
		}
	}

	private _doFixLeftEdge(): void {
		if (!this._options.fixLeftEdge) {
			return;
		}

		const firstIndex = this._firstIndex();
		if (firstIndex === null) {
			return;
		}

		const visibleRange = this.visibleStrictRange();
		if (visibleRange === null) {
			return;
		}

		const delta = visibleRange.left() - firstIndex;
		if (delta < 0) {
			const leftEdgeOffset = this._rightOffset - delta - 1;
			this.setRightOffset(leftEdgeOffset);
		}

		this._correctBarSpacing();
	}

	private _doFixRightEdge(): void {
		this._correctOffset();

		this._correctBarSpacing();
	}
}

// eslint-disable-next-line complexity
function weightToTickMarkType(weight: TickMarkWeight, timeVisible: boolean, secondsVisible: boolean): TickMarkType {
	switch (weight) {
		case TickMarkWeight.LessThanSecond:
		case TickMarkWeight.Second:
			return timeVisible
				? (secondsVisible ? TickMarkType.TimeWithSeconds : TickMarkType.Time)
				: TickMarkType.DayOfMonth;

		case TickMarkWeight.Minute1:
		case TickMarkWeight.Minute5:
		case TickMarkWeight.Minute30:
		case TickMarkWeight.Hour1:
		case TickMarkWeight.Hour3:
		case TickMarkWeight.Hour6:
		case TickMarkWeight.Hour12:
			return timeVisible ? TickMarkType.Time : TickMarkType.DayOfMonth;

		case TickMarkWeight.Day:
			return TickMarkType.DayOfMonth;

		case TickMarkWeight.Month:
			return TickMarkType.Month;

		case TickMarkWeight.Year:
			return TickMarkType.Year;
	}
}
