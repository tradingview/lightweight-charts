"use strict";
/// <reference types="_build-time-constants" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChartModel = exports.TrackingModeExitMode = void 0;
const assertions_1 = require("../helpers/assertions");
const color_1 = require("../helpers/color");
const delegate_1 = require("../helpers/delegate");
const strict_type_checks_1 = require("../helpers/strict-type-checks");
const price_axis_renderer_options_provider_1 = require("../renderers/price-axis-renderer-options-provider");
const crosshair_1 = require("./crosshair");
const default_price_scale_1 = require("./default-price-scale");
const invalidate_mask_1 = require("./invalidate-mask");
const magnet_1 = require("./magnet");
const pane_1 = require("./pane");
const series_1 = require("./series");
const time_scale_1 = require("./time-scale");
const watermark_1 = require("./watermark");
var BackgroundColorSide;
(function (BackgroundColorSide) {
    BackgroundColorSide[BackgroundColorSide["Top"] = 0] = "Top";
    BackgroundColorSide[BackgroundColorSide["Bottom"] = 1] = "Bottom";
})(BackgroundColorSide || (BackgroundColorSide = {}));
/**
 * Determine how to exit the tracking mode.
 *
 * By default, mobile users will long press to deactivate the scroll and have the ability to check values and dates.
 * Another press is required to activate the scroll, be able to move left/right, zoom, etc.
 */
var TrackingModeExitMode;
(function (TrackingModeExitMode) {
    /**
     * Tracking Mode will be deactivated on touch end event.
     */
    TrackingModeExitMode[TrackingModeExitMode["OnTouchEnd"] = 0] = "OnTouchEnd";
    /**
     * Tracking Mode will be deactivated on the next tap event.
     */
    TrackingModeExitMode[TrackingModeExitMode["OnNextTap"] = 1] = "OnNextTap";
})(TrackingModeExitMode = exports.TrackingModeExitMode || (exports.TrackingModeExitMode = {}));
class ChartModel {
    constructor(invalidateHandler, options, horzScaleBehavior) {
        this._panes = [];
        this._serieses = [];
        this._width = 0;
        this._hoveredSource = null;
        this._priceScalesOptionsChanged = new delegate_1.Delegate();
        this._crosshairMoved = new delegate_1.Delegate();
        this._gradientColorsCache = null;
        this._invalidateHandler = invalidateHandler;
        this._options = options;
        this._horzScaleBehavior = horzScaleBehavior;
        this._rendererOptionsProvider = new price_axis_renderer_options_provider_1.PriceAxisRendererOptionsProvider(this);
        this._timeScale = new time_scale_1.TimeScale(this, options.timeScale, this._options.localization, horzScaleBehavior);
        this._crosshair = new crosshair_1.Crosshair(this, options.crosshair);
        this._magnet = new magnet_1.Magnet(options.crosshair);
        this._watermark = new watermark_1.Watermark(this, options.watermark);
        this.createPane();
        this._panes[0].setStretchFactor(pane_1.DEFAULT_STRETCH_FACTOR * 2);
        this._backgroundTopColor = this._getBackgroundColor(0 /* BackgroundColorSide.Top */);
        this._backgroundBottomColor = this._getBackgroundColor(1 /* BackgroundColorSide.Bottom */);
    }
    fullUpdate() {
        this._invalidate(invalidate_mask_1.InvalidateMask.full());
    }
    lightUpdate() {
        this._invalidate(invalidate_mask_1.InvalidateMask.light());
    }
    cursorUpdate() {
        this._invalidate(new invalidate_mask_1.InvalidateMask(1 /* InvalidationLevel.Cursor */));
    }
    updateSource(source) {
        const inv = this._invalidationMaskForSource(source);
        this._invalidate(inv);
    }
    hoveredSource() {
        return this._hoveredSource;
    }
    setHoveredSource(source) {
        const prevSource = this._hoveredSource;
        this._hoveredSource = source;
        if (prevSource !== null) {
            this.updateSource(prevSource.source);
        }
        if (source !== null) {
            this.updateSource(source.source);
        }
    }
    options() {
        return this._options;
    }
    applyOptions(options) {
        (0, strict_type_checks_1.merge)(this._options, options);
        this._panes.forEach((p) => p.applyScaleOptions(options));
        if (options.timeScale !== undefined) {
            this._timeScale.applyOptions(options.timeScale);
        }
        if (options.localization !== undefined) {
            this._timeScale.applyLocalizationOptions(options.localization);
        }
        if (options.leftPriceScale || options.rightPriceScale) {
            this._priceScalesOptionsChanged.fire();
        }
        this._backgroundTopColor = this._getBackgroundColor(0 /* BackgroundColorSide.Top */);
        this._backgroundBottomColor = this._getBackgroundColor(1 /* BackgroundColorSide.Bottom */);
        this.fullUpdate();
    }
    applyPriceScaleOptions(priceScaleId, options) {
        if (priceScaleId === "left" /* DefaultPriceScaleId.Left */) {
            this.applyOptions({
                leftPriceScale: options,
            });
            return;
        }
        else if (priceScaleId === "right" /* DefaultPriceScaleId.Right */) {
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
    findPriceScale(priceScaleId) {
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
    timeScale() {
        return this._timeScale;
    }
    panes() {
        return this._panes;
    }
    watermarkSource() {
        return this._watermark;
    }
    crosshairSource() {
        return this._crosshair;
    }
    crosshairMoved() {
        return this._crosshairMoved;
    }
    setPaneHeight(pane, height) {
        pane.setHeight(height);
        this.recalculateAllPanes();
    }
    setWidth(width) {
        this._width = width;
        this._timeScale.setWidth(this._width);
        this._panes.forEach((pane) => pane.setWidth(width));
        this.recalculateAllPanes();
    }
    createPane(index) {
        const pane = new pane_1.Pane(this._timeScale, this);
        if (index !== undefined) {
            this._panes.splice(index, 0, pane);
        }
        else {
            // adding to the end - common case
            this._panes.push(pane);
        }
        const actualIndex = (index === undefined) ? this._panes.length - 1 : index;
        // we always do autoscaling on the creation
        // if autoscale option is true, it is ok, just recalculate by invalidation mask
        // if autoscale option is false, autoscale anyway on the first draw
        // also there is a scenario when autoscale is true in constructor and false later on applyOptions
        const mask = invalidate_mask_1.InvalidateMask.full();
        mask.invalidatePane(actualIndex, {
            level: 0 /* InvalidationLevel.None */,
            autoScale: true,
        });
        this._invalidate(mask);
        return pane;
    }
    startScalePrice(pane, priceScale, x) {
        pane.startScalePrice(priceScale, x);
    }
    scalePriceTo(pane, priceScale, x) {
        pane.scalePriceTo(priceScale, x);
        this.updateCrosshair();
        this._invalidate(this._paneInvalidationMask(pane, 2 /* InvalidationLevel.Light */));
    }
    endScalePrice(pane, priceScale) {
        pane.endScalePrice(priceScale);
        this._invalidate(this._paneInvalidationMask(pane, 2 /* InvalidationLevel.Light */));
    }
    startScrollPrice(pane, priceScale, x) {
        if (priceScale.isAutoScale()) {
            return;
        }
        pane.startScrollPrice(priceScale, x);
    }
    scrollPriceTo(pane, priceScale, x) {
        if (priceScale.isAutoScale()) {
            return;
        }
        pane.scrollPriceTo(priceScale, x);
        this.updateCrosshair();
        this._invalidate(this._paneInvalidationMask(pane, 2 /* InvalidationLevel.Light */));
    }
    endScrollPrice(pane, priceScale) {
        if (priceScale.isAutoScale()) {
            return;
        }
        pane.endScrollPrice(priceScale);
        this._invalidate(this._paneInvalidationMask(pane, 2 /* InvalidationLevel.Light */));
    }
    resetPriceScale(pane, priceScale) {
        pane.resetPriceScale(priceScale);
        this._invalidate(this._paneInvalidationMask(pane, 2 /* InvalidationLevel.Light */));
    }
    startScaleTime(position) {
        this._timeScale.startScale(position);
    }
    /**
     * Zoom in/out the chart (depends on scale value).
     *
     * @param pointX - X coordinate of the point to apply the zoom (the point which should stay on its place)
     * @param scale - Zoom value. Negative value means zoom out, positive - zoom in.
     */
    zoomTime(pointX, scale) {
        const timeScale = this.timeScale();
        if (timeScale.isEmpty() || scale === 0) {
            return;
        }
        const timeScaleWidth = timeScale.width();
        pointX = Math.max(1, Math.min(pointX, timeScaleWidth));
        timeScale.zoom(pointX, scale);
        this.recalculateAllPanes();
    }
    scrollChart(x) {
        this.startScrollTime(0);
        this.scrollTimeTo(x);
        this.endScrollTime();
    }
    scaleTimeTo(x) {
        this._timeScale.scaleTo(x);
        this.recalculateAllPanes();
    }
    endScaleTime() {
        this._timeScale.endScale();
        this.lightUpdate();
    }
    startScrollTime(x) {
        this._timeScale.startScroll(x);
    }
    scrollTimeTo(x) {
        this._timeScale.scrollTo(x);
        this.recalculateAllPanes();
    }
    endScrollTime() {
        this._timeScale.endScroll();
        this.lightUpdate();
    }
    serieses() {
        return this._serieses;
    }
    setAndSaveCurrentPosition(x, y, event, pane, skipEvent) {
        this._crosshair.saveOriginCoord(x, y);
        let price = NaN;
        let index = this._timeScale.coordinateToIndex(x);
        const visibleBars = this._timeScale.visibleStrictRange();
        if (visibleBars !== null) {
            index = Math.min(Math.max(visibleBars.left(), index), visibleBars.right());
        }
        const priceScale = pane.defaultPriceScale();
        const firstValue = priceScale.firstValue();
        if (firstValue !== null) {
            price = priceScale.coordinateToPrice(y, firstValue);
        }
        price = this._magnet.align(price, index, pane);
        this._crosshair.setPosition(index, price, pane);
        this.cursorUpdate();
        if (!skipEvent) {
            this._crosshairMoved.fire(this._crosshair.appliedIndex(), { x, y }, event);
        }
    }
    // A position provided external (not from an internal event listener)
    setAndSaveSyntheticPosition(price, horizontalPosition, pane) {
        const priceScale = pane.defaultPriceScale();
        const firstValue = priceScale.firstValue();
        const y = priceScale.priceToCoordinate(price, (0, assertions_1.ensureNotNull)(firstValue));
        const index = this._timeScale.timeToIndex(horizontalPosition, true);
        const x = this._timeScale.indexToCoordinate((0, assertions_1.ensureNotNull)(index));
        this.setAndSaveCurrentPosition(x, y, null, pane, true);
    }
    clearCurrentPosition(skipEvent) {
        const crosshair = this.crosshairSource();
        crosshair.clearPosition();
        this.cursorUpdate();
        if (!skipEvent) {
            this._crosshairMoved.fire(null, null, null);
        }
    }
    updateCrosshair() {
        // apply magnet
        const pane = this._crosshair.pane();
        if (pane !== null) {
            const x = this._crosshair.originCoordX();
            const y = this._crosshair.originCoordY();
            this.setAndSaveCurrentPosition(x, y, null, pane);
        }
        this._crosshair.updateAllViews();
    }
    updateTimeScale(newBaseIndex, newPoints, firstChangedPointIndex) {
        const oldFirstTime = this._timeScale.indexToTime(0);
        if (newPoints !== undefined && firstChangedPointIndex !== undefined) {
            this._timeScale.update(newPoints, firstChangedPointIndex);
        }
        const newFirstTime = this._timeScale.indexToTime(0);
        const currentBaseIndex = this._timeScale.baseIndex();
        const visibleBars = this._timeScale.visibleStrictRange();
        // if time scale cannot return current visible bars range (e.g. time scale has zero-width)
        // then we do not need to update right offset to shift visible bars range to have the same right offset as we have before new bar
        // (and actually we cannot)
        if (visibleBars !== null && oldFirstTime !== null && newFirstTime !== null) {
            const isLastSeriesBarVisible = visibleBars.contains(currentBaseIndex);
            const isLeftBarShiftToLeft = this._horzScaleBehavior.key(oldFirstTime) > this._horzScaleBehavior.key(newFirstTime);
            const isSeriesPointsAdded = newBaseIndex !== null && newBaseIndex > currentBaseIndex;
            const isSeriesPointsAddedToRight = isSeriesPointsAdded && !isLeftBarShiftToLeft;
            const allowShiftWhenReplacingWhitespace = this._timeScale.options().allowShiftVisibleRangeOnWhitespaceReplacement;
            const replacedExistingWhitespace = firstChangedPointIndex === undefined;
            const needShiftVisibleRangeOnNewBar = isLastSeriesBarVisible && (!replacedExistingWhitespace || allowShiftWhenReplacingWhitespace) && this._timeScale.options().shiftVisibleRangeOnNewBar;
            if (isSeriesPointsAddedToRight && !needShiftVisibleRangeOnNewBar) {
                const compensationShift = newBaseIndex - currentBaseIndex;
                this._timeScale.setRightOffset(this._timeScale.rightOffset() - compensationShift);
            }
        }
        this._timeScale.setBaseIndex(newBaseIndex);
    }
    recalculatePane(pane) {
        if (pane !== null) {
            pane.recalculate();
        }
    }
    paneForSource(source) {
        const pane = this._panes.find((p) => p.orderedSources().includes(source));
        return pane === undefined ? null : pane;
    }
    recalculateAllPanes() {
        this._watermark.updateAllViews();
        this._panes.forEach((p) => p.recalculate());
        this.updateCrosshair();
    }
    destroy() {
        this._panes.forEach((p) => p.destroy());
        this._panes.length = 0;
        // to avoid memleaks
        this._options.localization.priceFormatter = undefined;
        this._options.localization.percentageFormatter = undefined;
        this._options.localization.timeFormatter = undefined;
    }
    rendererOptionsProvider() {
        return this._rendererOptionsProvider;
    }
    priceAxisRendererOptions() {
        return this._rendererOptionsProvider.options();
    }
    priceScalesOptionsChanged() {
        return this._priceScalesOptionsChanged;
    }
    createSeries(seriesType, options, customPaneView) {
        const pane = this._panes[0];
        const series = this._createSeries(options, seriesType, pane, customPaneView);
        this._serieses.push(series);
        if (this._serieses.length === 1) {
            // call fullUpdate to recalculate chart's parts geometry
            this.fullUpdate();
        }
        else {
            this.lightUpdate();
        }
        return series;
    }
    removeSeries(series) {
        const pane = this.paneForSource(series);
        const seriesIndex = this._serieses.indexOf(series);
        (0, assertions_1.assert)(seriesIndex !== -1, 'Series not found');
        this._serieses.splice(seriesIndex, 1);
        (0, assertions_1.ensureNotNull)(pane).removeDataSource(series);
        if (series.destroy) {
            series.destroy();
        }
    }
    moveSeriesToScale(series, targetScaleId) {
        const pane = (0, assertions_1.ensureNotNull)(this.paneForSource(series));
        pane.removeDataSource(series);
        // check if targetScaleId exists
        const target = this.findPriceScale(targetScaleId);
        if (target === null) {
            // new scale on the same pane
            const zOrder = series.zorder();
            pane.addDataSource(series, targetScaleId, zOrder);
        }
        else {
            // if move to the new scale of the same pane, keep zorder
            // if move to new pane
            const zOrder = (target.pane === pane) ? series.zorder() : undefined;
            target.pane.addDataSource(series, targetScaleId, zOrder);
        }
    }
    fitContent() {
        const mask = invalidate_mask_1.InvalidateMask.light();
        mask.setFitContent();
        this._invalidate(mask);
    }
    setTargetLogicalRange(range) {
        const mask = invalidate_mask_1.InvalidateMask.light();
        mask.applyRange(range);
        this._invalidate(mask);
    }
    resetTimeScale() {
        const mask = invalidate_mask_1.InvalidateMask.light();
        mask.resetTimeScale();
        this._invalidate(mask);
    }
    setBarSpacing(spacing) {
        const mask = invalidate_mask_1.InvalidateMask.light();
        mask.setBarSpacing(spacing);
        this._invalidate(mask);
    }
    setRightOffset(offset) {
        const mask = invalidate_mask_1.InvalidateMask.light();
        mask.setRightOffset(offset);
        this._invalidate(mask);
    }
    setTimeScaleAnimation(animation) {
        const mask = invalidate_mask_1.InvalidateMask.light();
        mask.setTimeScaleAnimation(animation);
        this._invalidate(mask);
    }
    stopTimeScaleAnimation() {
        const mask = invalidate_mask_1.InvalidateMask.light();
        mask.stopTimeScaleAnimation();
        this._invalidate(mask);
    }
    defaultVisiblePriceScaleId() {
        return this._options.rightPriceScale.visible ? "right" /* DefaultPriceScaleId.Right */ : "left" /* DefaultPriceScaleId.Left */;
    }
    backgroundBottomColor() {
        return this._backgroundBottomColor;
    }
    backgroundTopColor() {
        return this._backgroundTopColor;
    }
    backgroundColorAtYPercentFromTop(percent) {
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
        }
        else {
            const cachedValue = this._gradientColorsCache.colors.get(percent);
            if (cachedValue !== undefined) {
                return cachedValue;
            }
        }
        const result = (0, color_1.gradientColorAtPercent)(topColor, bottomColor, percent / 100);
        this._gradientColorsCache.colors.set(percent, result);
        return result;
    }
    _paneInvalidationMask(pane, level) {
        const inv = new invalidate_mask_1.InvalidateMask(level);
        if (pane !== null) {
            const index = this._panes.indexOf(pane);
            inv.invalidatePane(index, {
                level,
            });
        }
        return inv;
    }
    _invalidationMaskForSource(source, invalidateType) {
        if (invalidateType === undefined) {
            invalidateType = 2 /* InvalidationLevel.Light */;
        }
        return this._paneInvalidationMask(this.paneForSource(source), invalidateType);
    }
    _invalidate(mask) {
        if (this._invalidateHandler) {
            this._invalidateHandler(mask);
        }
        this._panes.forEach((pane) => pane.grid().paneView().update());
    }
    _createSeries(options, seriesType, pane, customPaneView) {
        const series = new series_1.Series(this, options, seriesType, pane, customPaneView);
        const targetScaleId = options.priceScaleId !== undefined ? options.priceScaleId : this.defaultVisiblePriceScaleId();
        pane.addDataSource(series, targetScaleId);
        if (!(0, default_price_scale_1.isDefaultPriceScale)(targetScaleId)) {
            // let's apply that options again to apply margins
            series.applyOptions(options);
        }
        return series;
    }
    _getBackgroundColor(side) {
        const layoutOptions = this._options.layout;
        if (layoutOptions.background.type === "gradient" /* ColorType.VerticalGradient */) {
            return side === 0 /* BackgroundColorSide.Top */ ?
                layoutOptions.background.topColor :
                layoutOptions.background.bottomColor;
        }
        return layoutOptions.background.color;
    }
}
exports.ChartModel = ChartModel;
