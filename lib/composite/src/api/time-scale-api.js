"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeScaleApi = void 0;
const assertions_1 = require("../helpers/assertions");
const delegate_1 = require("../helpers/delegate");
const strict_type_checks_1 = require("../helpers/strict-type-checks");
var Constants;
(function (Constants) {
    Constants[Constants["AnimationDurationMs"] = 1000] = "AnimationDurationMs";
})(Constants || (Constants = {}));
class TimeScaleApi {
    constructor(model, timeAxisWidget, horzScaleBehavior) {
        this._timeRangeChanged = new delegate_1.Delegate();
        this._logicalRangeChanged = new delegate_1.Delegate();
        this._sizeChanged = new delegate_1.Delegate();
        this._model = model;
        this._timeScale = model.timeScale();
        this._timeAxisWidget = timeAxisWidget;
        this._timeScale.visibleBarsChanged().subscribe(this._onVisibleBarsChanged.bind(this));
        this._timeScale.logicalRangeChanged().subscribe(this._onVisibleLogicalRangeChanged.bind(this));
        this._timeAxisWidget.sizeChanged().subscribe(this._onSizeChanged.bind(this));
        this._horzScaleBehavior = horzScaleBehavior;
    }
    destroy() {
        this._timeScale.visibleBarsChanged().unsubscribeAll(this);
        this._timeScale.logicalRangeChanged().unsubscribeAll(this);
        this._timeAxisWidget.sizeChanged().unsubscribeAll(this);
        this._timeRangeChanged.destroy();
        this._logicalRangeChanged.destroy();
        this._sizeChanged.destroy();
    }
    scrollPosition() {
        return this._timeScale.rightOffset();
    }
    scrollToPosition(position, animated) {
        if (!animated) {
            this._model.setRightOffset(position);
            return;
        }
        this._timeScale.scrollToOffsetAnimated(position, 1000 /* Constants.AnimationDurationMs */);
    }
    scrollToRealTime() {
        this._timeScale.scrollToRealTime();
    }
    getVisibleRange() {
        const timeRange = this._timeScale.visibleTimeRange();
        if (timeRange === null) {
            return null;
        }
        return {
            from: timeRange.from.originalTime,
            to: timeRange.to.originalTime,
        };
    }
    setVisibleRange(range) {
        const convertedRange = {
            from: this._horzScaleBehavior.convertHorzItemToInternal(range.from),
            to: this._horzScaleBehavior.convertHorzItemToInternal(range.to),
        };
        const logicalRange = this._timeScale.logicalRangeForTimeRange(convertedRange);
        this._model.setTargetLogicalRange(logicalRange);
    }
    getVisibleLogicalRange() {
        const logicalRange = this._timeScale.visibleLogicalRange();
        if (logicalRange === null) {
            return null;
        }
        return {
            from: logicalRange.left(),
            to: logicalRange.right(),
        };
    }
    setVisibleLogicalRange(range) {
        (0, assertions_1.assert)(range.from <= range.to, 'The from index cannot be after the to index.');
        this._model.setTargetLogicalRange(range);
    }
    resetTimeScale() {
        this._model.resetTimeScale();
    }
    fitContent() {
        this._model.fitContent();
    }
    logicalToCoordinate(logical) {
        const timeScale = this._model.timeScale();
        if (timeScale.isEmpty()) {
            return null;
        }
        else {
            return timeScale.indexToCoordinate(logical);
        }
    }
    coordinateToLogical(x) {
        if (this._timeScale.isEmpty()) {
            return null;
        }
        else {
            return this._timeScale.coordinateToIndex(x);
        }
    }
    timeToCoordinate(time) {
        const timePoint = this._horzScaleBehavior.convertHorzItemToInternal(time);
        const timePointIndex = this._timeScale.timeToIndex(timePoint, false);
        if (timePointIndex === null) {
            return null;
        }
        return this._timeScale.indexToCoordinate(timePointIndex);
    }
    coordinateToTime(x) {
        const timeScale = this._model.timeScale();
        const timePointIndex = timeScale.coordinateToIndex(x);
        const timePoint = timeScale.indexToTimeScalePoint(timePointIndex);
        if (timePoint === null) {
            return null;
        }
        return timePoint.originalTime;
    }
    width() {
        return this._timeAxisWidget.getSize().width;
    }
    height() {
        return this._timeAxisWidget.getSize().height;
    }
    subscribeVisibleTimeRangeChange(handler) {
        this._timeRangeChanged.subscribe(handler);
    }
    unsubscribeVisibleTimeRangeChange(handler) {
        this._timeRangeChanged.unsubscribe(handler);
    }
    subscribeVisibleLogicalRangeChange(handler) {
        this._logicalRangeChanged.subscribe(handler);
    }
    unsubscribeVisibleLogicalRangeChange(handler) {
        this._logicalRangeChanged.unsubscribe(handler);
    }
    subscribeSizeChange(handler) {
        this._sizeChanged.subscribe(handler);
    }
    unsubscribeSizeChange(handler) {
        this._sizeChanged.unsubscribe(handler);
    }
    applyOptions(options) {
        this._timeScale.applyOptions(options);
    }
    options() {
        return Object.assign(Object.assign({}, (0, strict_type_checks_1.clone)(this._timeScale.options())), { barSpacing: this._timeScale.barSpacing() });
    }
    _onVisibleBarsChanged() {
        if (this._timeRangeChanged.hasListeners()) {
            this._timeRangeChanged.fire(this.getVisibleRange());
        }
    }
    _onVisibleLogicalRangeChanged() {
        if (this._logicalRangeChanged.hasListeners()) {
            this._logicalRangeChanged.fire(this.getVisibleLogicalRange());
        }
    }
    _onSizeChanged(size) {
        this._sizeChanged.fire(size.width, size.height);
    }
}
exports.TimeScaleApi = TimeScaleApi;
