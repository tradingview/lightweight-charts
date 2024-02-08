import { assert } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { clone } from '../helpers/strict-type-checks';
;
export class TimeScaleApi {
    constructor(model, timeAxisWidget, horzScaleBehavior) {
        this._private__timeRangeChanged = new Delegate();
        this._private__logicalRangeChanged = new Delegate();
        this._private__sizeChanged = new Delegate();
        this._private__model = model;
        this._private__timeScale = model._internal_timeScale();
        this._private__timeAxisWidget = timeAxisWidget;
        this._private__timeScale._internal_visibleBarsChanged()._internal_subscribe(this._private__onVisibleBarsChanged.bind(this));
        this._private__timeScale._internal_logicalRangeChanged()._internal_subscribe(this._private__onVisibleLogicalRangeChanged.bind(this));
        this._private__timeAxisWidget._internal_sizeChanged()._internal_subscribe(this._private__onSizeChanged.bind(this));
        this._private__horzScaleBehavior = horzScaleBehavior;
    }
    _internal_destroy() {
        this._private__timeScale._internal_visibleBarsChanged()._internal_unsubscribeAll(this);
        this._private__timeScale._internal_logicalRangeChanged()._internal_unsubscribeAll(this);
        this._private__timeAxisWidget._internal_sizeChanged()._internal_unsubscribeAll(this);
        this._private__timeRangeChanged._internal_destroy();
        this._private__logicalRangeChanged._internal_destroy();
        this._private__sizeChanged._internal_destroy();
    }
    scrollPosition() {
        return this._private__timeScale._internal_rightOffset();
    }
    scrollToPosition(position, animated) {
        if (!animated) {
            this._private__model._internal_setRightOffset(position);
            return;
        }
        this._private__timeScale._internal_scrollToOffsetAnimated(position, 1000 /* Constants.AnimationDurationMs */);
    }
    scrollToRealTime() {
        this._private__timeScale._internal_scrollToRealTime();
    }
    getVisibleRange() {
        const timeRange = this._private__timeScale._internal_visibleTimeRange();
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
            from: this._private__horzScaleBehavior.convertHorzItemToInternal(range.from),
            to: this._private__horzScaleBehavior.convertHorzItemToInternal(range.to),
        };
        const logicalRange = this._private__timeScale._internal_logicalRangeForTimeRange(convertedRange);
        this._private__model._internal_setTargetLogicalRange(logicalRange);
    }
    getVisibleLogicalRange() {
        const logicalRange = this._private__timeScale._internal_visibleLogicalRange();
        if (logicalRange === null) {
            return null;
        }
        return {
            from: logicalRange._internal_left(),
            to: logicalRange._internal_right(),
        };
    }
    setVisibleLogicalRange(range) {
        assert(range.from <= range.to, 'The from index cannot be after the to index.');
        this._private__model._internal_setTargetLogicalRange(range);
    }
    resetTimeScale() {
        this._private__model._internal_resetTimeScale();
    }
    fitContent() {
        this._private__model._internal_fitContent();
    }
    logicalToCoordinate(logical) {
        const timeScale = this._private__model._internal_timeScale();
        if (timeScale._internal_isEmpty()) {
            return null;
        }
        else {
            return timeScale._internal_indexToCoordinate(logical);
        }
    }
    coordinateToLogical(x) {
        if (this._private__timeScale._internal_isEmpty()) {
            return null;
        }
        else {
            return this._private__timeScale._internal_coordinateToIndex(x);
        }
    }
    timeToCoordinate(time) {
        const timePoint = this._private__horzScaleBehavior.convertHorzItemToInternal(time);
        const timePointIndex = this._private__timeScale._internal_timeToIndex(timePoint, false);
        if (timePointIndex === null) {
            return null;
        }
        return this._private__timeScale._internal_indexToCoordinate(timePointIndex);
    }
    coordinateToTime(x) {
        const timeScale = this._private__model._internal_timeScale();
        const timePointIndex = timeScale._internal_coordinateToIndex(x);
        const timePoint = timeScale._internal_indexToTimeScalePoint(timePointIndex);
        if (timePoint === null) {
            return null;
        }
        return timePoint.originalTime;
    }
    width() {
        return this._private__timeAxisWidget._internal_getSize().width;
    }
    height() {
        return this._private__timeAxisWidget._internal_getSize().height;
    }
    subscribeVisibleTimeRangeChange(handler) {
        this._private__timeRangeChanged._internal_subscribe(handler);
    }
    unsubscribeVisibleTimeRangeChange(handler) {
        this._private__timeRangeChanged._internal_unsubscribe(handler);
    }
    subscribeVisibleLogicalRangeChange(handler) {
        this._private__logicalRangeChanged._internal_subscribe(handler);
    }
    unsubscribeVisibleLogicalRangeChange(handler) {
        this._private__logicalRangeChanged._internal_unsubscribe(handler);
    }
    subscribeSizeChange(handler) {
        this._private__sizeChanged._internal_subscribe(handler);
    }
    unsubscribeSizeChange(handler) {
        this._private__sizeChanged._internal_unsubscribe(handler);
    }
    applyOptions(options) {
        this._private__timeScale._internal_applyOptions(options);
    }
    options() {
        return Object.assign(Object.assign({}, clone(this._private__timeScale._internal_options())), { barSpacing: this._private__timeScale._internal_barSpacing() });
    }
    _private__onVisibleBarsChanged() {
        if (this._private__timeRangeChanged._internal_hasListeners()) {
            this._private__timeRangeChanged._internal_fire(this.getVisibleRange());
        }
    }
    _private__onVisibleLogicalRangeChanged() {
        if (this._private__logicalRangeChanged._internal_hasListeners()) {
            this._private__logicalRangeChanged._internal_fire(this.getVisibleLogicalRange());
        }
    }
    _private__onSizeChanged(size) {
        this._private__sizeChanged._internal_fire(size.width, size.height);
    }
}
