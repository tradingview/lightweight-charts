import { DateFormatter } from '../formatters/date-formatter';
import { DateTimeFormatter } from '../formatters/date-time-formatter';

import { ensureNotNull } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { ISubscription } from '../helpers/isubscription';
import { clamp } from '../helpers/mathex';
import { DeepPartial, isInteger, merge } from '../helpers/strict-type-checks';

import { ChartModel } from './chart-model';
import { Coordinate } from './coordinate';
import { FormattedLabelsCache } from './formatted-labels-cache';
import { LocalizationOptions } from './localization-options';
import { areRangesEqual, RangeImpl } from './range-impl';
import { TickMarks } from './tick-marks';
import { Logical, LogicalRange, SeriesItemsIndexesRange, TickMark, TimedValue, TimePoint, TimePointIndex, TimePointsRange } from './time-data';
import { TimePoints } from './time-points';
import { TimeScaleVisibleRange } from './time-scale-visible-range';

const enum Constants {
	DefaultAnimationDuration = 400,
	MinBarSpacing = 0.5,
	// make sure that this (1 / MinVisibleBarsCount) >= coeff in max bar spacing
	MinVisibleBarsCount = 2,
}

const enum MarkSpanBorder {
	Minute = 20,
	Hour = 30,
	Day = 40,
	Week = 50,
	Month = 60,
	Year = 70,
}

interface TransitionState {
	barSpacing: number;
	rightOffset: number;
}

export interface TimeMark {
	coord: number;
	label: string;
	span: number;
	major: boolean;
}

export const enum TickMarkType {
	Year,
	Month,
	DayOfMonth,
	Time,
	TimeWithSeconds,
}

export type TickMarkFormatter = (timePoint: TimePoint, tickMarkType: TickMarkType, locale: string) => string;

export interface TimeScaleOptions {
	rightOffset: number;
	barSpacing: number;
	fixLeftEdge: boolean;
	lockVisibleTimeRangeOnResize: boolean;
	rightBarStaysOnScroll: boolean;
	borderVisible: boolean;
	borderColor: string;
	visible: boolean;
	timeVisible: boolean;
	secondsVisible: boolean;
	tickMarkFormatter: TickMarkFormatter;
}

export class TimeScale {
	private readonly _options: TimeScaleOptions;
	private readonly _model: ChartModel;
	private readonly _localizationOptions: LocalizationOptions;

	private _dateTimeFormatter!: DateFormatter | DateTimeFormatter;

	private _width: number = 0;
	private _baseIndexOrNull: TimePointIndex | null = null;
	private _rightOffset: number;
	private _points: TimePoints = new TimePoints();
	private _barSpacing: number;
	private _scrollStartPoint: Coordinate | null = null;
	private _scaleStartPoint: Coordinate | null = null;
	private readonly _tickMarks: TickMarks = new TickMarks();
	private _formattedBySpan: Map<number, FormattedLabelsCache> = new Map();

	private _visibleRange: TimeScaleVisibleRange = TimeScaleVisibleRange.invalid();
	private _visibleRangeInvalidated: boolean = true;

	private readonly _visibleBarsChanged: Delegate = new Delegate();
	private readonly _logicalRangeChanged: Delegate = new Delegate();

	private readonly _optionsApplied: Delegate = new Delegate();
	private _leftEdgeIndex: TimePointIndex | null = null;
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
			this._fixLeftEdge();
		} else {
			this._leftEdgeIndex = null;
		}

		// note that bar spacing should be applied before right offset
		// because right offset depends on bar spacing
		if (options.barSpacing !== undefined) {
			this.setBarSpacing(options.barSpacing);
		}

		if (options.rightOffset !== undefined) {
			this.setRightOffset(options.rightOffset);
		}

		this._invalidateTickMarks();
		this._updateDateTimeFormatter();

		this._optionsApplied.fire();
	}

	public isEmpty(): boolean {
		return this._width === 0 || this._points.size() === 0;
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

		const points = this._model.timeScale().points();
		const firstIndex = ensureNotNull(points.firstIndex());
		const lastIndex = ensureNotNull(points.lastIndex());

		return {
			from: ensureNotNull(points.valueAt(Math.max(firstIndex, from) as TimePointIndex) as TimePoint),
			to: ensureNotNull(points.valueAt(Math.min(lastIndex, to) as TimePointIndex) as TimePoint),
		};
	}

	public logicalRangeForTimeRange(range: TimePointsRange): LogicalRange {
		const points = this._model.timeScale().points();

		return {
			from: ensureNotNull(points.indexOf(range.from.timestamp, true)) as number as Logical,
			to: ensureNotNull(points.indexOf(range.to.timestamp, true)) as number as Logical,
		};
	}

	public tickMarks(): TickMarks {
		return this._tickMarks;
	}
	public points(): TimePoints {
		return this._points;
	}
	public width(): number {
		return this._width;
	}

	public setWidth(width: number): void {
		if (!isFinite(width) || width <= 0) {
			return;
		}

		if (this._width === width) {
			return;
		}

		if (this._options.lockVisibleTimeRangeOnResize && this._width) {
			// recalculate bar spacing
			const newBarSpacing = this._barSpacing * width / this._width;
			this._setBarSpacing(newBarSpacing);
		}

		// if time scale is scrolled to the end of data and we have fixed right edge
		// keep left edge instead of right
		// we need it to avoid "shaking" if the last bar visibility affects time scale width
		if (this._leftEdgeIndex !== null) {
			const firstVisibleBar = ensureNotNull(this.visibleStrictRange()).left();
			// firstVisibleBar could be less than this._leftEdgeIndex
			// since index is a center of bar
			if (firstVisibleBar <= this._leftEdgeIndex) {
				const delta = this._width - width;
				// reduce  _rightOffset means move right
				// we could move more than required - this will be fixed by _correctOffset()
				this._rightOffset -= Math.round(delta / this._barSpacing) + 1;
			}
		}

		this._width = width;
		this._visibleRangeInvalidated = true;

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
		const coordinate = this._width - (deltaFromRight + 0.5) * this._barSpacing;
		return coordinate as Coordinate;
	}

	public indexesToCoordinates<T extends TimedValue>(points: T[], visibleRange?: SeriesItemsIndexesRange): void {
		const baseIndex = this.baseIndex();
		const indexFrom = (visibleRange === undefined) ? 0 : visibleRange.from;
		const indexTo = (visibleRange === undefined) ? points.length : visibleRange.to;

		for (let i = indexFrom; i < indexTo; i++) {
			const index = points[i].time;
			const deltaFromRight = baseIndex + this._rightOffset - index;
			const coordinate = this._width - (deltaFromRight + 0.5) * this._barSpacing;
			points[i].x = coordinate as Coordinate;
		}
	}

	public indexToUserTime(index: TimePointIndex): TimePoint | null {
		return this._tickMarks.indexToTime(index);
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

		let targetIndex = 0;
		for (const tm of items) {
			if (!(firstBar <= tm.index && tm.index <= lastBar)) {
				continue;
			}

			const time = this._tickMarks.indexToTime(tm.index);
			if (time === null) {
				continue;
			}

			if (targetIndex < this._labels.length) {
				const label = this._labels[targetIndex];
				label.coord = this.indexToCoordinate(tm.index);
				label.label = this._formatLabel(time, tm.span);
				label.span = tm.span;
				label.major = false;
			} else {
				this._labels.push({
					coord: this.indexToCoordinate(tm.index),
					label: this._formatLabel(time, tm.span),
					span: tm.span,
					major: false,
					// major: tm.label >= TimeConstants.DaySpan ? 1 : 0, // ??? there is no label in tick-marks.ts
				});
			}
			targetIndex++;
		}
		this._labels.length = targetIndex;

		this._timeMarksCache = this._labels;

		return this._labels;
	}

	public reset(): void {
		this._visibleRangeInvalidated = true;
		this._points = new TimePoints();
		this._scrollStartPoint = null;
		this._scaleStartPoint = null;
		this._clearCommonTransitionsStartState();
		this._tickMarks.reset();
		this._leftEdgeIndex = null;
	}

	public restoreDefault(): void {
		this._visibleRangeInvalidated = true;

		this.setBarSpacing(this._options.barSpacing);
		this.setRightOffset(this._options.rightOffset);
	}

	public fixLeftEdge(): boolean {
		return this._options.fixLeftEdge;
	}

	public setBaseIndex(baseIndex: TimePointIndex): void {
		this._visibleRangeInvalidated = true;
		this._baseIndexOrNull = baseIndex;
		this._correctOffset();

		this._fixLeftEdge();
	}

	/**
	 * Zoom in/out the scale around a `zoomPoint` on `scale` value.
	 * @param zoomPoint - X coordinate of the point to apply the zoom.
	 *   If `rightBarStaysOnScroll` option is disabled, then will be used to restore right offset.
	 * @param scale - Zoom value (in 1/10 parts of current bar spacing).
	 *   Negative value means zoom out, positive - zoom in.
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
		const animationStart = new Date().getTime();
		const animationFn = () => {
			const animationProgress = (new Date().getTime() - animationStart) / animationDuration;
			const finishAnimation = animationProgress >= 1;
			const rightOffset = finishAnimation ? offset : source + (offset - source) * animationProgress;
			this.setRightOffset(rightOffset);
			if (!finishAnimation) {
				setTimeout(animationFn, 20);
			}
		};

		animationFn();
	}

	public update(index: TimePointIndex, values: TimePoint[], marks: TickMark[]): void {
		this._visibleRangeInvalidated = true;
		if (values.length > 0) {
			// we have some time points to merge
			const oldSize = this._points.size();
			this._points.merge(index, values);
			if (this._rightOffset < 0 && (this._points.size() === oldSize + 1)) {
				this._rightOffset -= 1;
			}
		}
		this._tickMarks.merge(marks);
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
		const first = this._points.firstIndex();
		const last = this._points.lastIndex();
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

	public formatDateTime(time: TimePoint): string {
		if (this._localizationOptions.timeFormatter !== undefined) {
			return this._localizationOptions.timeFormatter(time.businessDay || time.timestamp);
		}

		return this._dateTimeFormatter.format(new Date(time.timestamp * 1000));
	}

	private _rightOffsetForCoordinate(x: Coordinate): number {
		return (this._width + 1 - x) / this._barSpacing;
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
		if (this._barSpacing < Constants.MinBarSpacing) {
			this._barSpacing = Constants.MinBarSpacing;
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
		const firstIndex = this._points.firstIndex();
		const baseIndex = this._baseIndexOrNull;
		if (firstIndex === null || baseIndex === null) {
			return null;
		}

		if (this._leftEdgeIndex !== null) {
			const barsEstimation = this._width / this._barSpacing;
			return this._leftEdgeIndex - baseIndex + barsEstimation - 1;
		}

		return firstIndex - baseIndex - 1 + Math.min(Constants.MinVisibleBarsCount, this._points.size());
	}

	private _maxRightOffset(): number {
		return (this._width / this._barSpacing) - Math.min(Constants.MinVisibleBarsCount, this._points.size());
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

	private _formatLabel(time: TimePoint, span: number): string {
		let formatter = this._formattedBySpan.get(span);
		if (formatter === undefined) {
			formatter = new FormattedLabelsCache((timePoint: TimePoint) => {
				return this._formatLabelImpl(timePoint, span);
			});

			this._formattedBySpan.set(span, formatter);
		}

		return formatter.format(time);
	}

	private _formatLabelImpl(timePoint: TimePoint, span: number): string {
		let tickMarkType: TickMarkType;

		const timeVisible = this._options.timeVisible;
		if (span < MarkSpanBorder.Minute && timeVisible) {
			tickMarkType = this._options.secondsVisible ? TickMarkType.TimeWithSeconds : TickMarkType.Time;
		} else if (span < MarkSpanBorder.Day && timeVisible) {
			tickMarkType = TickMarkType.Time;
		} else if (span < MarkSpanBorder.Week) {
			tickMarkType = TickMarkType.DayOfMonth;
		} else if (span < MarkSpanBorder.Month) {
			tickMarkType = TickMarkType.DayOfMonth;
		} else if (span < MarkSpanBorder.Year) {
			tickMarkType = TickMarkType.Month;
		} else {
			tickMarkType = TickMarkType.Year;
		}

		return this._options.tickMarkFormatter(timePoint, tickMarkType, this._localizationOptions.locale);
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
		this._formattedBySpan.clear();
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

	private _fixLeftEdge(): void {
		if (!this._options.fixLeftEdge) {
			return;
		}
		const firstIndex = this._points.firstIndex();
		if (firstIndex === null || this._leftEdgeIndex === firstIndex) {
			return;
		}

		this._leftEdgeIndex = firstIndex;
		const delta = ensureNotNull(this.visibleStrictRange()).left() - firstIndex;
		if (delta < 0) {
			const leftEdgeOffset = this._rightOffset - delta - 1;
			this.setRightOffset(leftEdgeOffset);
		}
	}
}
