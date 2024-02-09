"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChartWidget = void 0;
const fancy_canvas_1 = require("fancy-canvas");
const assertions_1 = require("../helpers/assertions");
const browsers_1 = require("../helpers/browsers");
const delegate_1 = require("../helpers/delegate");
const logger_1 = require("../helpers/logger");
const chart_model_1 = require("../model/chart-model");
const invalidate_mask_1 = require("../model/invalidate-mask");
const series_1 = require("../model/series");
const internal_layout_sizes_hints_1 = require("./internal-layout-sizes-hints");
const pane_widget_1 = require("./pane-widget");
const time_axis_widget_1 = require("./time-axis-widget");
const windowsChrome = (0, browsers_1.isChromiumBased)() && (0, browsers_1.isWindows)();
class ChartWidget {
    constructor(container, options, horzScaleBehavior) {
        this._paneWidgets = [];
        this._drawRafId = 0;
        this._height = 0;
        this._width = 0;
        this._leftPriceAxisWidth = 0;
        this._rightPriceAxisWidth = 0;
        this._invalidateMask = null;
        this._drawPlanned = false;
        this._clicked = new delegate_1.Delegate();
        this._dblClicked = new delegate_1.Delegate();
        this._crosshairMoved = new delegate_1.Delegate();
        this._observer = null;
        this._cursorStyleOverride = null;
        this._container = container;
        this._options = options;
        this._horzScaleBehavior = horzScaleBehavior;
        this._element = document.createElement('div');
        this._element.classList.add('tv-lightweight-charts');
        this._element.style.overflow = 'hidden';
        this._element.style.direction = 'ltr';
        this._element.style.width = '100%';
        this._element.style.height = '100%';
        disableSelection(this._element);
        this._tableElement = document.createElement('table');
        this._tableElement.setAttribute('cellspacing', '0');
        this._element.appendChild(this._tableElement);
        this._onWheelBound = this._onMousewheel.bind(this);
        if (shouldSubscribeMouseWheel(this._options)) {
            this._setMouseWheelEventListener(true);
        }
        this._model = new chart_model_1.ChartModel(this._invalidateHandler.bind(this), this._options, horzScaleBehavior);
        this.model().crosshairMoved().subscribe(this._onPaneWidgetCrosshairMoved.bind(this), this);
        this._timeAxisWidget = new time_axis_widget_1.TimeAxisWidget(this, this._horzScaleBehavior);
        this._tableElement.appendChild(this._timeAxisWidget.getElement());
        const usedObserver = options.autoSize && this._installObserver();
        // observer could not fire event immediately for some cases
        // so we have to set initial size manually
        let width = this._options.width;
        let height = this._options.height;
        // ignore width/height options if observer has actually been used
        // however respect options if installing resize observer failed
        if (usedObserver || width === 0 || height === 0) {
            const containerRect = container.getBoundingClientRect();
            width = width || containerRect.width;
            height = height || containerRect.height;
        }
        // BEWARE: resize must be called BEFORE _syncGuiWithModel (in constructor only)
        // or after but with adjustSize to properly update time scale
        this.resize(width, height);
        this._syncGuiWithModel();
        container.appendChild(this._element);
        this._updateTimeAxisVisibility();
        this._model.timeScale().optionsApplied().subscribe(this._model.fullUpdate.bind(this._model), this);
        this._model.priceScalesOptionsChanged().subscribe(this._model.fullUpdate.bind(this._model), this);
    }
    model() {
        return this._model;
    }
    options() {
        return this._options;
    }
    paneWidgets() {
        return this._paneWidgets;
    }
    timeAxisWidget() {
        return this._timeAxisWidget;
    }
    destroy() {
        this._setMouseWheelEventListener(false);
        if (this._drawRafId !== 0) {
            window.cancelAnimationFrame(this._drawRafId);
        }
        this._model.crosshairMoved().unsubscribeAll(this);
        this._model.timeScale().optionsApplied().unsubscribeAll(this);
        this._model.priceScalesOptionsChanged().unsubscribeAll(this);
        this._model.destroy();
        for (const paneWidget of this._paneWidgets) {
            this._tableElement.removeChild(paneWidget.getElement());
            paneWidget.clicked().unsubscribeAll(this);
            paneWidget.dblClicked().unsubscribeAll(this);
            paneWidget.destroy();
        }
        this._paneWidgets = [];
        // for (const paneSeparator of this._paneSeparators) {
        // 	this._destroySeparator(paneSeparator);
        // }
        // this._paneSeparators = [];
        (0, assertions_1.ensureNotNull)(this._timeAxisWidget).destroy();
        if (this._element.parentElement !== null) {
            this._element.parentElement.removeChild(this._element);
        }
        this._crosshairMoved.destroy();
        this._clicked.destroy();
        this._dblClicked.destroy();
        this._uninstallObserver();
    }
    resize(width, height, forceRepaint = false) {
        if (this._height === height && this._width === width) {
            return;
        }
        const sizeHint = (0, internal_layout_sizes_hints_1.suggestChartSize)((0, fancy_canvas_1.size)({ width, height }));
        this._height = sizeHint.height;
        this._width = sizeHint.width;
        const heightStr = this._height + 'px';
        const widthStr = this._width + 'px';
        (0, assertions_1.ensureNotNull)(this._element).style.height = heightStr;
        (0, assertions_1.ensureNotNull)(this._element).style.width = widthStr;
        this._tableElement.style.height = heightStr;
        this._tableElement.style.width = widthStr;
        if (forceRepaint) {
            this._drawImpl(invalidate_mask_1.InvalidateMask.full(), performance.now());
        }
        else {
            this._model.fullUpdate();
        }
    }
    paint(invalidateMask) {
        if (invalidateMask === undefined) {
            invalidateMask = invalidate_mask_1.InvalidateMask.full();
        }
        for (let i = 0; i < this._paneWidgets.length; i++) {
            this._paneWidgets[i].paint(invalidateMask.invalidateForPane(i).level);
        }
        if (this._options.timeScale.visible) {
            this._timeAxisWidget.paint(invalidateMask.fullInvalidation());
        }
    }
    applyOptions(options) {
        const currentlyHasMouseWheelListener = shouldSubscribeMouseWheel(this._options);
        // we don't need to merge options here because it's done in chart model
        // and since both model and widget share the same object it will be done automatically for widget as well
        // not ideal solution for sure, but it work's for now ¯\_(ツ)_/¯
        this._model.applyOptions(options);
        const shouldHaveMouseWheelListener = shouldSubscribeMouseWheel(this._options);
        if (shouldHaveMouseWheelListener !== currentlyHasMouseWheelListener) {
            this._setMouseWheelEventListener(shouldHaveMouseWheelListener);
        }
        this._updateTimeAxisVisibility();
        this._applyAutoSizeOptions(options);
    }
    clicked() {
        return this._clicked;
    }
    dblClicked() {
        return this._dblClicked;
    }
    crosshairMoved() {
        return this._crosshairMoved;
    }
    takeScreenshot() {
        if (this._invalidateMask !== null) {
            this._drawImpl(this._invalidateMask, performance.now());
            this._invalidateMask = null;
        }
        const screeshotBitmapSize = this._traverseLayout(null);
        const screenshotCanvas = document.createElement('canvas');
        screenshotCanvas.width = screeshotBitmapSize.width;
        screenshotCanvas.height = screeshotBitmapSize.height;
        const ctx = (0, assertions_1.ensureNotNull)(screenshotCanvas.getContext('2d'));
        this._traverseLayout(ctx);
        return screenshotCanvas;
    }
    getPriceAxisWidth(position) {
        if (position === 'left' && !this._isLeftAxisVisible()) {
            return 0;
        }
        if (position === 'right' && !this._isRightAxisVisible()) {
            return 0;
        }
        if (this._paneWidgets.length === 0) {
            return 0;
        }
        // we don't need to worry about exactly pane widget here
        // because all pane widgets have the same width of price axis widget
        // see _adjustSizeImpl
        const priceAxisWidget = position === 'left'
            ? this._paneWidgets[0].leftPriceAxisWidget()
            : this._paneWidgets[0].rightPriceAxisWidget();
        return (0, assertions_1.ensureNotNull)(priceAxisWidget).getWidth();
    }
    autoSizeActive() {
        return this._options.autoSize && this._observer !== null;
    }
    element() {
        return this._element;
    }
    setCursorStyle(style) {
        this._cursorStyleOverride = style;
        if (this._cursorStyleOverride) {
            this.element().style.setProperty('cursor', style);
        }
        else {
            this.element().style.removeProperty('cursor');
        }
    }
    getCursorOverrideStyle() {
        return this._cursorStyleOverride;
    }
    paneSize() {
        // we currently only support a single pane.
        return (0, assertions_1.ensureDefined)(this._paneWidgets[0]).getSize();
    }
    // eslint-disable-next-line complexity
    _applyAutoSizeOptions(options) {
        if (options.autoSize === undefined && this._observer && (options.width !== undefined || options.height !== undefined)) {
            (0, logger_1.warn)(`You should turn autoSize off explicitly before specifying sizes; try adding options.autoSize: false to new options`);
            return;
        }
        if (options.autoSize && !this._observer) {
            // installing observer will override resize if successful
            this._installObserver();
        }
        if (options.autoSize === false && this._observer !== null) {
            this._uninstallObserver();
        }
        if (!options.autoSize && (options.width !== undefined || options.height !== undefined)) {
            this.resize(options.width || this._width, options.height || this._height);
        }
    }
    /**
     * Traverses the widget's layout (pane and axis child widgets),
     * draws the screenshot (if rendering context is passed) and returns the screenshot bitmap size
     *
     * @param ctx - if passed, used to draw the screenshot of widget
     * @returns screenshot bitmap size
     */
    _traverseLayout(ctx) {
        let totalWidth = 0;
        let totalHeight = 0;
        const firstPane = this._paneWidgets[0];
        const drawPriceAxises = (position, targetX) => {
            let targetY = 0;
            for (let paneIndex = 0; paneIndex < this._paneWidgets.length; paneIndex++) {
                const paneWidget = this._paneWidgets[paneIndex];
                const priceAxisWidget = (0, assertions_1.ensureNotNull)(position === 'left' ? paneWidget.leftPriceAxisWidget() : paneWidget.rightPriceAxisWidget());
                const bitmapSize = priceAxisWidget.getBitmapSize();
                if (ctx !== null) {
                    priceAxisWidget.drawBitmap(ctx, targetX, targetY);
                }
                targetY += bitmapSize.height;
                // if (paneIndex < this._paneWidgets.length - 1) {
                // 	const separator = this._paneSeparators[paneIndex];
                // 	const separatorBitmapSize = separator.getBitmapSize();
                // 	if (ctx !== null) {
                // 		separator.drawBitmap(ctx, targetX, targetY);
                // 	}
                // 	targetY += separatorBitmapSize.height;
                // }
            }
        };
        // draw left price scale if exists
        if (this._isLeftAxisVisible()) {
            drawPriceAxises('left', 0);
            const leftAxisBitmapWidth = (0, assertions_1.ensureNotNull)(firstPane.leftPriceAxisWidget()).getBitmapSize().width;
            totalWidth += leftAxisBitmapWidth;
        }
        for (let paneIndex = 0; paneIndex < this._paneWidgets.length; paneIndex++) {
            const paneWidget = this._paneWidgets[paneIndex];
            const bitmapSize = paneWidget.getBitmapSize();
            if (ctx !== null) {
                paneWidget.drawBitmap(ctx, totalWidth, totalHeight);
            }
            totalHeight += bitmapSize.height;
            // if (paneIndex < this._paneWidgets.length - 1) {
            // 	const separator = this._paneSeparators[paneIndex];
            // 	const separatorBitmapSize = separator.getBitmapSize();
            // 	if (ctx !== null) {
            // 		separator.drawBitmap(ctx, totalWidth, totalHeight);
            // 	}
            // 	totalHeight += separatorBitmapSize.height;
            // }
        }
        const firstPaneBitmapWidth = firstPane.getBitmapSize().width;
        totalWidth += firstPaneBitmapWidth;
        // draw right price scale if exists
        if (this._isRightAxisVisible()) {
            drawPriceAxises('right', totalWidth);
            const rightAxisBitmapWidth = (0, assertions_1.ensureNotNull)(firstPane.rightPriceAxisWidget()).getBitmapSize().width;
            totalWidth += rightAxisBitmapWidth;
        }
        const drawStub = (position, targetX, targetY) => {
            const stub = (0, assertions_1.ensureNotNull)(position === 'left' ? this._timeAxisWidget.leftStub() : this._timeAxisWidget.rightStub());
            stub.drawBitmap((0, assertions_1.ensureNotNull)(ctx), targetX, targetY);
        };
        // draw time scale and stubs
        if (this._options.timeScale.visible) {
            const timeAxisBitmapSize = this._timeAxisWidget.getBitmapSize();
            if (ctx !== null) {
                let targetX = 0;
                if (this._isLeftAxisVisible()) {
                    drawStub('left', targetX, totalHeight);
                    targetX = (0, assertions_1.ensureNotNull)(firstPane.leftPriceAxisWidget()).getBitmapSize().width;
                }
                this._timeAxisWidget.drawBitmap(ctx, targetX, totalHeight);
                targetX += timeAxisBitmapSize.width;
                if (this._isRightAxisVisible()) {
                    drawStub('right', targetX, totalHeight);
                }
            }
            totalHeight += timeAxisBitmapSize.height;
        }
        return (0, fancy_canvas_1.size)({
            width: totalWidth,
            height: totalHeight,
        });
    }
    // eslint-disable-next-line complexity
    _adjustSizeImpl() {
        let totalStretch = 0;
        let leftPriceAxisWidth = 0;
        let rightPriceAxisWidth = 0;
        for (const paneWidget of this._paneWidgets) {
            if (this._isLeftAxisVisible()) {
                leftPriceAxisWidth = Math.max(leftPriceAxisWidth, (0, assertions_1.ensureNotNull)(paneWidget.leftPriceAxisWidget()).optimalWidth(), this._options.leftPriceScale.minimumWidth);
            }
            if (this._isRightAxisVisible()) {
                rightPriceAxisWidth = Math.max(rightPriceAxisWidth, (0, assertions_1.ensureNotNull)(paneWidget.rightPriceAxisWidget()).optimalWidth(), this._options.rightPriceScale.minimumWidth);
            }
            totalStretch += paneWidget.stretchFactor();
        }
        leftPriceAxisWidth = (0, internal_layout_sizes_hints_1.suggestPriceScaleWidth)(leftPriceAxisWidth);
        rightPriceAxisWidth = (0, internal_layout_sizes_hints_1.suggestPriceScaleWidth)(rightPriceAxisWidth);
        const width = this._width;
        const height = this._height;
        const paneWidth = Math.max(width - leftPriceAxisWidth - rightPriceAxisWidth, 0);
        // const separatorCount = this._paneSeparators.length;
        // const separatorHeight = SEPARATOR_HEIGHT;
        const separatorsHeight = 0; // separatorHeight * separatorCount;
        const timeAxisVisible = this._options.timeScale.visible;
        let timeAxisHeight = timeAxisVisible ? Math.max(this._timeAxisWidget.optimalHeight(), this._options.timeScale.minimumHeight) : 0;
        timeAxisHeight = (0, internal_layout_sizes_hints_1.suggestTimeScaleHeight)(timeAxisHeight);
        const otherWidgetHeight = separatorsHeight + timeAxisHeight;
        const totalPaneHeight = height < otherWidgetHeight ? 0 : height - otherWidgetHeight;
        const stretchPixels = totalPaneHeight / totalStretch;
        let accumulatedHeight = 0;
        for (let paneIndex = 0; paneIndex < this._paneWidgets.length; ++paneIndex) {
            const paneWidget = this._paneWidgets[paneIndex];
            paneWidget.setState(this._model.panes()[paneIndex]);
            let paneHeight = 0;
            let calculatePaneHeight = 0;
            if (paneIndex === this._paneWidgets.length - 1) {
                calculatePaneHeight = totalPaneHeight - accumulatedHeight;
            }
            else {
                calculatePaneHeight = Math.round(paneWidget.stretchFactor() * stretchPixels);
            }
            paneHeight = Math.max(calculatePaneHeight, 2);
            accumulatedHeight += paneHeight;
            paneWidget.setSize((0, fancy_canvas_1.size)({ width: paneWidth, height: paneHeight }));
            if (this._isLeftAxisVisible()) {
                paneWidget.setPriceAxisSize(leftPriceAxisWidth, 'left');
            }
            if (this._isRightAxisVisible()) {
                paneWidget.setPriceAxisSize(rightPriceAxisWidth, 'right');
            }
            if (paneWidget.state()) {
                this._model.setPaneHeight(paneWidget.state(), paneHeight);
            }
        }
        this._timeAxisWidget.setSizes((0, fancy_canvas_1.size)({ width: timeAxisVisible ? paneWidth : 0, height: timeAxisHeight }), timeAxisVisible ? leftPriceAxisWidth : 0, timeAxisVisible ? rightPriceAxisWidth : 0);
        this._model.setWidth(paneWidth);
        if (this._leftPriceAxisWidth !== leftPriceAxisWidth) {
            this._leftPriceAxisWidth = leftPriceAxisWidth;
        }
        if (this._rightPriceAxisWidth !== rightPriceAxisWidth) {
            this._rightPriceAxisWidth = rightPriceAxisWidth;
        }
    }
    _setMouseWheelEventListener(add) {
        if (add) {
            this._element.addEventListener('wheel', this._onWheelBound, { passive: false });
            return;
        }
        this._element.removeEventListener('wheel', this._onWheelBound);
    }
    _determineWheelSpeedAdjustment(event) {
        switch (event.deltaMode) {
            case event.DOM_DELTA_PAGE:
                // one screen at time scroll mode
                return 120;
            case event.DOM_DELTA_LINE:
                // one line at time scroll mode
                return 32;
        }
        if (!windowsChrome) {
            return 1;
        }
        // Chromium on Windows has a bug where the scroll speed isn't correctly
        // adjusted for high density displays. We need to correct for this so that
        // scroll speed is consistent between browsers.
        // https://bugs.chromium.org/p/chromium/issues/detail?id=1001735
        // https://bugs.chromium.org/p/chromium/issues/detail?id=1207308
        return (1 / window.devicePixelRatio);
    }
    _onMousewheel(event) {
        if ((event.deltaX === 0 || !this._options.handleScroll.mouseWheel) &&
            (event.deltaY === 0 || !this._options.handleScale.mouseWheel)) {
            return;
        }
        const scrollSpeedAdjustment = this._determineWheelSpeedAdjustment(event);
        const deltaX = scrollSpeedAdjustment * event.deltaX / 100;
        const deltaY = -(scrollSpeedAdjustment * event.deltaY / 100);
        if (event.cancelable) {
            event.preventDefault();
        }
        if (deltaY !== 0 && this._options.handleScale.mouseWheel) {
            const zoomScale = Math.sign(deltaY) * Math.min(1, Math.abs(deltaY));
            const scrollPosition = event.clientX - this._element.getBoundingClientRect().left;
            this.model().zoomTime(scrollPosition, zoomScale);
        }
        if (deltaX !== 0 && this._options.handleScroll.mouseWheel) {
            this.model().scrollChart(deltaX * -80); // 80 is a made up coefficient, and minus is for the "natural" scroll
        }
    }
    _drawImpl(invalidateMask, time) {
        var _a;
        const invalidationType = invalidateMask.fullInvalidation();
        // actions for full invalidation ONLY (not shared with light)
        if (invalidationType === 3 /* InvalidationLevel.Full */) {
            this._updateGui();
        }
        // light or full invalidate actions
        if (invalidationType === 3 /* InvalidationLevel.Full */ ||
            invalidationType === 2 /* InvalidationLevel.Light */) {
            this._applyMomentaryAutoScale(invalidateMask);
            this._applyTimeScaleInvalidations(invalidateMask, time);
            this._timeAxisWidget.update();
            this._paneWidgets.forEach((pane) => {
                pane.updatePriceAxisWidgets();
            });
            // In the case a full invalidation has been postponed during the draw, reapply
            // the timescale invalidations. A full invalidation would mean there is a change
            // in the timescale width (caused by price scale changes) that needs to be drawn
            // right away to avoid flickering.
            if (((_a = this._invalidateMask) === null || _a === void 0 ? void 0 : _a.fullInvalidation()) === 3 /* InvalidationLevel.Full */) {
                this._invalidateMask.merge(invalidateMask);
                this._updateGui();
                this._applyMomentaryAutoScale(this._invalidateMask);
                this._applyTimeScaleInvalidations(this._invalidateMask, time);
                invalidateMask = this._invalidateMask;
                this._invalidateMask = null;
            }
        }
        this.paint(invalidateMask);
    }
    _applyTimeScaleInvalidations(invalidateMask, time) {
        for (const tsInvalidation of invalidateMask.timeScaleInvalidations()) {
            this._applyTimeScaleInvalidation(tsInvalidation, time);
        }
    }
    _applyMomentaryAutoScale(invalidateMask) {
        const panes = this._model.panes();
        for (let i = 0; i < panes.length; i++) {
            if (invalidateMask.invalidateForPane(i).autoScale) {
                panes[i].momentaryAutoScale();
            }
        }
    }
    _applyTimeScaleInvalidation(invalidation, time) {
        const timeScale = this._model.timeScale();
        switch (invalidation.type) {
            case 0 /* TimeScaleInvalidationType.FitContent */:
                timeScale.fitContent();
                break;
            case 1 /* TimeScaleInvalidationType.ApplyRange */:
                timeScale.setLogicalRange(invalidation.value);
                break;
            case 2 /* TimeScaleInvalidationType.ApplyBarSpacing */:
                timeScale.setBarSpacing(invalidation.value);
                break;
            case 3 /* TimeScaleInvalidationType.ApplyRightOffset */:
                timeScale.setRightOffset(invalidation.value);
                break;
            case 4 /* TimeScaleInvalidationType.Reset */:
                timeScale.restoreDefault();
                break;
            case 5 /* TimeScaleInvalidationType.Animation */:
                if (!invalidation.value.finished(time)) {
                    timeScale.setRightOffset(invalidation.value.getPosition(time));
                }
                break;
        }
    }
    _invalidateHandler(invalidateMask) {
        if (this._invalidateMask !== null) {
            this._invalidateMask.merge(invalidateMask);
        }
        else {
            this._invalidateMask = invalidateMask;
        }
        if (!this._drawPlanned) {
            this._drawPlanned = true;
            this._drawRafId = window.requestAnimationFrame((time) => {
                this._drawPlanned = false;
                this._drawRafId = 0;
                if (this._invalidateMask !== null) {
                    const mask = this._invalidateMask;
                    this._invalidateMask = null;
                    this._drawImpl(mask, time);
                    for (const tsInvalidation of mask.timeScaleInvalidations()) {
                        if (tsInvalidation.type === 5 /* TimeScaleInvalidationType.Animation */ && !tsInvalidation.value.finished(time)) {
                            this.model().setTimeScaleAnimation(tsInvalidation.value);
                            break;
                        }
                    }
                }
            });
        }
    }
    _updateGui() {
        this._syncGuiWithModel();
    }
    // private _destroySeparator(separator: PaneSeparator): void {
    // 	this._tableElement.removeChild(separator.getElement());
    // 	separator.destroy();
    // }
    _syncGuiWithModel() {
        const panes = this._model.panes();
        const targetPaneWidgetsCount = panes.length;
        const actualPaneWidgetsCount = this._paneWidgets.length;
        // Remove (if needed) pane widgets and separators
        for (let i = targetPaneWidgetsCount; i < actualPaneWidgetsCount; i++) {
            const paneWidget = (0, assertions_1.ensureDefined)(this._paneWidgets.pop());
            this._tableElement.removeChild(paneWidget.getElement());
            paneWidget.clicked().unsubscribeAll(this);
            paneWidget.dblClicked().unsubscribeAll(this);
            paneWidget.destroy();
            // const paneSeparator = this._paneSeparators.pop();
            // if (paneSeparator !== undefined) {
            // 	this._destroySeparator(paneSeparator);
            // }
        }
        // Create (if needed) new pane widgets and separators
        for (let i = actualPaneWidgetsCount; i < targetPaneWidgetsCount; i++) {
            const paneWidget = new pane_widget_1.PaneWidget(this, panes[i]);
            paneWidget.clicked().subscribe(this._onPaneWidgetClicked.bind(this), this);
            paneWidget.dblClicked().subscribe(this._onPaneWidgetDblClicked.bind(this), this);
            this._paneWidgets.push(paneWidget);
            // create and insert separator
            // if (i > 1) {
            // 	const paneSeparator = new PaneSeparator(this, i - 1, i, true);
            // 	this._paneSeparators.push(paneSeparator);
            // 	this._tableElement.insertBefore(paneSeparator.getElement(), this._timeAxisWidget.getElement());
            // }
            // insert paneWidget
            this._tableElement.insertBefore(paneWidget.getElement(), this._timeAxisWidget.getElement());
        }
        for (let i = 0; i < targetPaneWidgetsCount; i++) {
            const state = panes[i];
            const paneWidget = this._paneWidgets[i];
            if (paneWidget.state() !== state) {
                paneWidget.setState(state);
            }
            else {
                paneWidget.updatePriceAxisWidgetsStates();
            }
        }
        this._updateTimeAxisVisibility();
        this._adjustSizeImpl();
    }
    _getMouseEventParamsImpl(index, point, event) {
        var _a;
        const seriesData = new Map();
        if (index !== null) {
            const serieses = this._model.serieses();
            serieses.forEach((s) => {
                // TODO: replace with search left
                const data = s.bars().search(index);
                if (data !== null) {
                    seriesData.set(s, data);
                }
            });
        }
        let clientTime;
        if (index !== null) {
            const timePoint = (_a = this._model.timeScale().indexToTimeScalePoint(index)) === null || _a === void 0 ? void 0 : _a.originalTime;
            if (timePoint !== undefined) {
                clientTime = timePoint;
            }
        }
        const hoveredSource = this.model().hoveredSource();
        const hoveredSeries = hoveredSource !== null && hoveredSource.source instanceof series_1.Series
            ? hoveredSource.source
            : undefined;
        const hoveredObject = hoveredSource !== null && hoveredSource.object !== undefined
            ? hoveredSource.object.externalId
            : undefined;
        return {
            originalTime: clientTime,
            index: index !== null && index !== void 0 ? index : undefined,
            point: point !== null && point !== void 0 ? point : undefined,
            hoveredSeries,
            seriesData,
            hoveredObject,
            touchMouseEventData: event !== null && event !== void 0 ? event : undefined,
        };
    }
    _onPaneWidgetClicked(time, point, event) {
        this._clicked.fire(() => this._getMouseEventParamsImpl(time, point, event));
    }
    _onPaneWidgetDblClicked(time, point, event) {
        this._dblClicked.fire(() => this._getMouseEventParamsImpl(time, point, event));
    }
    _onPaneWidgetCrosshairMoved(time, point, event) {
        this._crosshairMoved.fire(() => this._getMouseEventParamsImpl(time, point, event));
    }
    _updateTimeAxisVisibility() {
        const display = this._options.timeScale.visible ? '' : 'none';
        this._timeAxisWidget.getElement().style.display = display;
    }
    _isLeftAxisVisible() {
        return this._paneWidgets[0].state().leftPriceScale().options().visible;
    }
    _isRightAxisVisible() {
        return this._paneWidgets[0].state().rightPriceScale().options().visible;
    }
    _installObserver() {
        // eslint-disable-next-line no-restricted-syntax
        if (!('ResizeObserver' in window)) {
            (0, logger_1.warn)('Options contains "autoSize" flag, but the browser does not support ResizeObserver feature. Please provide polyfill.');
            return false;
        }
        else {
            this._observer = new ResizeObserver((entries) => {
                const containerEntry = entries.find((entry) => entry.target === this._container);
                if (!containerEntry) {
                    return;
                }
                this.resize(containerEntry.contentRect.width, containerEntry.contentRect.height);
            });
            this._observer.observe(this._container, { box: 'border-box' });
            return true;
        }
    }
    _uninstallObserver() {
        if (this._observer !== null) {
            this._observer.disconnect();
        }
        this._observer = null;
    }
}
exports.ChartWidget = ChartWidget;
function disableSelection(element) {
    element.style.userSelect = 'none';
    // eslint-disable-next-line deprecation/deprecation
    element.style.webkitUserSelect = 'none';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
    element.style.msUserSelect = 'none';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
    element.style.MozUserSelect = 'none';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
    element.style.webkitTapHighlightColor = 'transparent';
}
function shouldSubscribeMouseWheel(options) {
    return Boolean(options.handleScroll.mouseWheel || options.handleScale.mouseWheel);
}
