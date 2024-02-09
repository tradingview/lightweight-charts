"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeScale = exports.markWithGreaterWeight = void 0;
const algorithms_1 = require("../helpers/algorithms");
const assertions_1 = require("../helpers/assertions");
const delegate_1 = require("../helpers/delegate");
const mathex_1 = require("../helpers/mathex");
const strict_type_checks_1 = require("../helpers/strict-type-checks");
const formatted_labels_cache_1 = require("./formatted-labels-cache");
const range_impl_1 = require("./range-impl");
const tick_marks_1 = require("./tick-marks");
const time_scale_visible_range_1 = require("./time-scale-visible-range");
const defaultTickMarkMaxCharacterLength = 8;
var Constants;
(function (Constants) {
    Constants[Constants["DefaultAnimationDuration"] = 400] = "DefaultAnimationDuration";
    // make sure that this (1 / MinVisibleBarsCount) >= coeff in max bar spacing
    Constants[Constants["MinVisibleBarsCount"] = 2] = "MinVisibleBarsCount";
})(Constants || (Constants = {}));
function markWithGreaterWeight(a, b) {
    return a.weight > b.weight ? a : b;
}
exports.markWithGreaterWeight = markWithGreaterWeight;
class TimeScale {
    constructor(model, options, localizationOptions, horzScaleBehavior) {
        this._width = 0;
        this._baseIndexOrNull = null;
        this._points = [];
        this._scrollStartPoint = null;
        this._scaleStartPoint = null;
        this._tickMarks = new tick_marks_1.TickMarks();
        this._formattedByWeight = new Map();
        this._visibleRange = time_scale_visible_range_1.TimeScaleVisibleRange.invalid();
        this._visibleRangeInvalidated = true;
        this._visibleBarsChanged = new delegate_1.Delegate();
        this._logicalRangeChanged = new delegate_1.Delegate();
        this._optionsApplied = new delegate_1.Delegate();
        this._commonTransitionStartState = null;
        this._timeMarksCache = null;
        this._labels = [];
        this._options = options;
        this._localizationOptions = localizationOptions;
        this._rightOffset = options.rightOffset;
        this._barSpacing = options.barSpacing;
        this._model = model;
        this._horzScaleBehavior = horzScaleBehavior;
        this._updateDateTimeFormatter();
        this._tickMarks.setUniformDistribution(options.uniformDistribution);
    }
    options() {
        return this._options;
    }
    applyLocalizationOptions(localizationOptions) {
        (0, strict_type_checks_1.merge)(this._localizationOptions, localizationOptions);
        this._invalidateTickMarks();
        this._updateDateTimeFormatter();
    }
    applyOptions(options, localizationOptions) {
        var _a;
        (0, strict_type_checks_1.merge)(this._options, options);
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
            this._model.setBarSpacing((_a = options.barSpacing) !== null && _a !== void 0 ? _a : this._barSpacing);
        }
        this._invalidateTickMarks();
        this._updateDateTimeFormatter();
        this._optionsApplied.fire();
    }
    indexToTime(index) {
        var _a, _b;
        return (_b = (_a = this._points[index]) === null || _a === void 0 ? void 0 : _a.time) !== null && _b !== void 0 ? _b : null;
    }
    indexToTimeScalePoint(index) {
        var _a;
        return (_a = this._points[index]) !== null && _a !== void 0 ? _a : null;
    }
    timeToIndex(time, findNearest) {
        if (this._points.length < 1) {
            // no time points available
            return null;
        }
        if (this._horzScaleBehavior.key(time) > this._horzScaleBehavior.key(this._points[this._points.length - 1].time)) {
            // special case
            return findNearest ? this._points.length - 1 : null;
        }
        const index = (0, algorithms_1.lowerBound)(this._points, this._horzScaleBehavior.key(time), (a, b) => this._horzScaleBehavior.key(a.time) < b);
        if (this._horzScaleBehavior.key(time) < this._horzScaleBehavior.key(this._points[index].time)) {
            return findNearest ? index : null;
        }
        return index;
    }
    isEmpty() {
        return this._width === 0 || this._points.length === 0 || this._baseIndexOrNull === null;
    }
    hasPoints() {
        return this._points.length > 0;
    }
    // strict range: integer indices of the bars in the visible range rounded in more wide direction
    visibleStrictRange() {
        this._updateVisibleRange();
        return this._visibleRange.strictRange();
    }
    visibleLogicalRange() {
        this._updateVisibleRange();
        return this._visibleRange.logicalRange();
    }
    visibleTimeRange() {
        const visibleBars = this.visibleStrictRange();
        if (visibleBars === null) {
            return null;
        }
        const range = {
            from: visibleBars.left(),
            to: visibleBars.right(),
        };
        return this.timeRangeForLogicalRange(range);
    }
    timeRangeForLogicalRange(range) {
        const from = Math.round(range.from);
        const to = Math.round(range.to);
        const firstIndex = (0, assertions_1.ensureNotNull)(this._firstIndex());
        const lastIndex = (0, assertions_1.ensureNotNull)(this._lastIndex());
        return {
            from: (0, assertions_1.ensureNotNull)(this.indexToTimeScalePoint(Math.max(firstIndex, from))),
            to: (0, assertions_1.ensureNotNull)(this.indexToTimeScalePoint(Math.min(lastIndex, to))),
        };
    }
    logicalRangeForTimeRange(range) {
        return {
            from: (0, assertions_1.ensureNotNull)(this.timeToIndex(range.from, true)),
            to: (0, assertions_1.ensureNotNull)(this.timeToIndex(range.to, true)),
        };
    }
    width() {
        return this._width;
    }
    setWidth(newWidth) {
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
    indexToCoordinate(index) {
        if (this.isEmpty() || !(0, strict_type_checks_1.isInteger)(index)) {
            return 0;
        }
        const baseIndex = this.baseIndex();
        const deltaFromRight = baseIndex + this._rightOffset - index;
        const coordinate = this._width - (deltaFromRight + 0.5) * this._barSpacing - 1;
        return coordinate;
    }
    indexesToCoordinates(points, visibleRange) {
        const baseIndex = this.baseIndex();
        const indexFrom = (visibleRange === undefined) ? 0 : visibleRange.from;
        const indexTo = (visibleRange === undefined) ? points.length : visibleRange.to;
        for (let i = indexFrom; i < indexTo; i++) {
            const index = points[i].time;
            const deltaFromRight = baseIndex + this._rightOffset - index;
            const coordinate = this._width - (deltaFromRight + 0.5) * this._barSpacing - 1;
            points[i].x = coordinate;
        }
    }
    coordinateToIndex(x) {
        return Math.ceil(this._coordinateToFloatIndex(x));
    }
    setRightOffset(offset) {
        this._visibleRangeInvalidated = true;
        this._rightOffset = offset;
        this._correctOffset();
        this._model.recalculateAllPanes();
        this._model.lightUpdate();
    }
    barSpacing() {
        return this._barSpacing;
    }
    setBarSpacing(newBarSpacing) {
        this._setBarSpacing(newBarSpacing);
        // do not allow scroll out of visible bars
        this._correctOffset();
        this._model.recalculateAllPanes();
        this._model.lightUpdate();
    }
    rightOffset() {
        return this._rightOffset;
    }
    // eslint-disable-next-line complexity
    marks() {
        if (this.isEmpty()) {
            return null;
        }
        if (this._timeMarksCache !== null) {
            return this._timeMarksCache;
        }
        const spacing = this._barSpacing;
        const fontSize = this._model.options().layout.fontSize;
        const pixelsPer8Characters = (fontSize + 4) * 5;
        const pixelsPerCharacter = pixelsPer8Characters / defaultTickMarkMaxCharacterLength;
        const maxLabelWidth = pixelsPerCharacter * (this._options.tickMarkMaxCharacterLength || defaultTickMarkMaxCharacterLength);
        const indexPerLabel = Math.round(maxLabelWidth / spacing);
        const visibleBars = (0, assertions_1.ensureNotNull)(this.visibleStrictRange());
        const firstBar = Math.max(visibleBars.left(), visibleBars.left() - indexPerLabel);
        const lastBar = Math.max(visibleBars.right(), visibleBars.right() - indexPerLabel);
        const items = this._tickMarks.build(spacing, maxLabelWidth);
        // according to indexPerLabel value this value means "earliest index which _might be_ used as the second label on time scale"
        const earliestIndexOfSecondLabel = this._firstIndex() + indexPerLabel;
        // according to indexPerLabel value this value means "earliest index which _might be_ used as the second last label on time scale"
        const indexOfSecondLastLabel = this._lastIndex() - indexPerLabel;
        const isAllScalingAndScrollingDisabled = this._isAllScalingAndScrollingDisabled();
        const isLeftEdgeFixed = this._options.fixLeftEdge || isAllScalingAndScrollingDisabled;
        const isRightEdgeFixed = this._options.fixRightEdge || isAllScalingAndScrollingDisabled;
        let targetIndex = 0;
        for (const tm of items) {
            if (!(firstBar <= tm.index && tm.index <= lastBar)) {
                continue;
            }
            let label;
            if (targetIndex < this._labels.length) {
                label = this._labels[targetIndex];
                label.coord = this.indexToCoordinate(tm.index);
                label.label = this._formatLabel(tm);
                label.weight = tm.weight;
            }
            else {
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
            }
            else {
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
    restoreDefault() {
        this._visibleRangeInvalidated = true;
        this.setBarSpacing(this._options.barSpacing);
        this.setRightOffset(this._options.rightOffset);
    }
    setBaseIndex(baseIndex) {
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
    zoom(zoomPoint, scale) {
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
    startScale(x) {
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
    scaleTo(x) {
        if (this._commonTransitionStartState === null) {
            return;
        }
        const startLengthFromRight = (0, mathex_1.clamp)(this._width - x, 0, this._width);
        const currentLengthFromRight = (0, mathex_1.clamp)(this._width - (0, assertions_1.ensureNotNull)(this._scaleStartPoint), 0, this._width);
        if (startLengthFromRight === 0 || currentLengthFromRight === 0) {
            return;
        }
        this.setBarSpacing(this._commonTransitionStartState.barSpacing * startLengthFromRight / currentLengthFromRight);
    }
    endScale() {
        if (this._scaleStartPoint === null) {
            return;
        }
        this._scaleStartPoint = null;
        this._clearCommonTransitionsStartState();
    }
    startScroll(x) {
        if (this._scrollStartPoint !== null || this._commonTransitionStartState !== null) {
            return;
        }
        if (this.isEmpty()) {
            return;
        }
        this._scrollStartPoint = x;
        this._saveCommonTransitionsStartState();
    }
    scrollTo(x) {
        if (this._scrollStartPoint === null) {
            return;
        }
        const shiftInLogical = (this._scrollStartPoint - x) / this.barSpacing();
        this._rightOffset = (0, assertions_1.ensureNotNull)(this._commonTransitionStartState).rightOffset + shiftInLogical;
        this._visibleRangeInvalidated = true;
        // do not allow scroll out of visible bars
        this._correctOffset();
    }
    endScroll() {
        if (this._scrollStartPoint === null) {
            return;
        }
        this._scrollStartPoint = null;
        this._clearCommonTransitionsStartState();
    }
    scrollToRealTime() {
        this.scrollToOffsetAnimated(this._options.rightOffset);
    }
    scrollToOffsetAnimated(offset, animationDuration = 400 /* Constants.DefaultAnimationDuration */) {
        if (!isFinite(offset)) {
            throw new RangeError('offset is required and must be finite number');
        }
        if (!isFinite(animationDuration) || animationDuration <= 0) {
            throw new RangeError('animationDuration (optional) must be finite positive number');
        }
        const source = this._rightOffset;
        const animationStart = performance.now();
        this._model.setTimeScaleAnimation({
            finished: (time) => (time - animationStart) / animationDuration >= 1,
            getPosition: (time) => {
                const animationProgress = (time - animationStart) / animationDuration;
                const finishAnimation = animationProgress >= 1;
                return finishAnimation ? offset : source + (offset - source) * animationProgress;
            },
        });
    }
    update(newPoints, firstChangedPointIndex) {
        this._visibleRangeInvalidated = true;
        this._points = newPoints;
        this._tickMarks.setTimeScalePoints(newPoints, firstChangedPointIndex);
        this._correctOffset();
    }
    visibleBarsChanged() {
        return this._visibleBarsChanged;
    }
    logicalRangeChanged() {
        return this._logicalRangeChanged;
    }
    optionsApplied() {
        return this._optionsApplied;
    }
    baseIndex() {
        // null is used to known that baseIndex is not set yet
        // so in methods which should known whether it is set or not
        // we should check field `_baseIndexOrNull` instead of getter `baseIndex()`
        // see minRightOffset for example
        return this._baseIndexOrNull || 0;
    }
    setVisibleRange(range) {
        const length = range.count();
        this._setBarSpacing(this._width / length);
        this._rightOffset = range.right() - this.baseIndex();
        this._correctOffset();
        this._visibleRangeInvalidated = true;
        this._model.recalculateAllPanes();
        this._model.lightUpdate();
    }
    fitContent() {
        const first = this._firstIndex();
        const last = this._lastIndex();
        if (first === null || last === null) {
            return;
        }
        this.setVisibleRange(new range_impl_1.RangeImpl(first, last + this._options.rightOffset));
    }
    setLogicalRange(range) {
        const barRange = new range_impl_1.RangeImpl(range.from, range.to);
        this.setVisibleRange(barRange);
    }
    formatDateTime(timeScalePoint) {
        if (this._localizationOptions.timeFormatter !== undefined) {
            return this._localizationOptions.timeFormatter(timeScalePoint.originalTime);
        }
        return this._horzScaleBehavior.formatHorzItem(timeScalePoint.time);
    }
    _isAllScalingAndScrollingDisabled() {
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
    _firstIndex() {
        return this._points.length === 0 ? null : 0;
    }
    _lastIndex() {
        return this._points.length === 0 ? null : (this._points.length - 1);
    }
    _rightOffsetForCoordinate(x) {
        return (this._width - 1 - x) / this._barSpacing;
    }
    _coordinateToFloatIndex(x) {
        const deltaFromRight = this._rightOffsetForCoordinate(x);
        const baseIndex = this.baseIndex();
        const index = baseIndex + this._rightOffset - deltaFromRight;
        // JavaScript uses very strange rounding
        // we need rounding to avoid problems with calculation errors
        return Math.round(index * 1000000) / 1000000;
    }
    _setBarSpacing(newBarSpacing) {
        const oldBarSpacing = this._barSpacing;
        this._barSpacing = newBarSpacing;
        this._correctBarSpacing();
        // this._barSpacing might be changed in _correctBarSpacing
        if (oldBarSpacing !== this._barSpacing) {
            this._visibleRangeInvalidated = true;
            this._resetTimeMarksCache();
        }
    }
    _updateVisibleRange() {
        if (!this._visibleRangeInvalidated) {
            return;
        }
        this._visibleRangeInvalidated = false;
        if (this.isEmpty()) {
            this._setVisibleRange(time_scale_visible_range_1.TimeScaleVisibleRange.invalid());
            return;
        }
        const baseIndex = this.baseIndex();
        const newBarsLength = this._width / this._barSpacing;
        const rightBorder = this._rightOffset + baseIndex;
        const leftBorder = rightBorder - newBarsLength + 1;
        const logicalRange = new range_impl_1.RangeImpl(leftBorder, rightBorder);
        this._setVisibleRange(new time_scale_visible_range_1.TimeScaleVisibleRange(logicalRange));
    }
    _correctBarSpacing() {
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
    _minBarSpacing() {
        // if both options are enabled then limit bar spacing so that zooming-out is not possible
        // if it would cause either the first or last points to move too far from an edge
        if (this._options.fixLeftEdge && this._options.fixRightEdge && this._points.length !== 0) {
            return this._width / this._points.length;
        }
        return this._options.minBarSpacing;
    }
    _correctOffset() {
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
    _minRightOffset() {
        const firstIndex = this._firstIndex();
        const baseIndex = this._baseIndexOrNull;
        if (firstIndex === null || baseIndex === null) {
            return null;
        }
        const barsEstimation = this._options.fixLeftEdge
            ? this._width / this._barSpacing
            : Math.min(2 /* Constants.MinVisibleBarsCount */, this._points.length);
        return firstIndex - baseIndex - 1 + barsEstimation;
    }
    _maxRightOffset() {
        return this._options.fixRightEdge
            ? 0
            : (this._width / this._barSpacing) - Math.min(2 /* Constants.MinVisibleBarsCount */, this._points.length);
    }
    _saveCommonTransitionsStartState() {
        this._commonTransitionStartState = {
            barSpacing: this.barSpacing(),
            rightOffset: this.rightOffset(),
        };
    }
    _clearCommonTransitionsStartState() {
        this._commonTransitionStartState = null;
    }
    _formatLabel(tickMark) {
        let formatter = this._formattedByWeight.get(tickMark.weight);
        if (formatter === undefined) {
            formatter = new formatted_labels_cache_1.FormattedLabelsCache((mark) => {
                return this._formatLabelImpl(mark);
            }, this._horzScaleBehavior);
            this._formattedByWeight.set(tickMark.weight, formatter);
        }
        return formatter.format(tickMark);
    }
    _formatLabelImpl(tickMark) {
        return this._horzScaleBehavior.formatTickmark(tickMark, this._localizationOptions);
    }
    _setVisibleRange(newVisibleRange) {
        const oldVisibleRange = this._visibleRange;
        this._visibleRange = newVisibleRange;
        if (!(0, range_impl_1.areRangesEqual)(oldVisibleRange.strictRange(), this._visibleRange.strictRange())) {
            this._visibleBarsChanged.fire();
        }
        if (!(0, range_impl_1.areRangesEqual)(oldVisibleRange.logicalRange(), this._visibleRange.logicalRange())) {
            this._logicalRangeChanged.fire();
        }
        // TODO: reset only coords in case when this._visibleBars has not been changed
        this._resetTimeMarksCache();
    }
    _resetTimeMarksCache() {
        this._timeMarksCache = null;
    }
    _invalidateTickMarks() {
        this._resetTimeMarksCache();
        this._formattedByWeight.clear();
    }
    _updateDateTimeFormatter() {
        this._horzScaleBehavior.updateFormatter(this._localizationOptions);
    }
    _doFixLeftEdge() {
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
    _doFixRightEdge() {
        this._correctOffset();
        this._correctBarSpacing();
    }
}
exports.TimeScale = TimeScale;
