import { size } from 'fancy-canvas';
import { ensureDefined, ensureNotNull } from '../helpers/assertions';
import { isChromiumBased, isWindows } from '../helpers/browsers';
import { Delegate } from '../helpers/delegate';
import { warn } from '../helpers/logger';
import { ChartModel } from '../model/chart-model';
import { InvalidateMask, } from '../model/invalidate-mask';
import { Series } from '../model/series';
import { suggestChartSize, suggestPriceScaleWidth, suggestTimeScaleHeight } from './internal-layout-sizes-hints';
import { PaneWidget } from './pane-widget';
import { TimeAxisWidget } from './time-axis-widget';
const windowsChrome = isChromiumBased() && isWindows();
export class ChartWidget {
    constructor(container, options, horzScaleBehavior) {
        this._private__paneWidgets = [];
        this._private__drawRafId = 0;
        this._private__height = 0;
        this._private__width = 0;
        this._private__leftPriceAxisWidth = 0;
        this._private__rightPriceAxisWidth = 0;
        this._private__invalidateMask = null;
        this._private__drawPlanned = false;
        this._private__clicked = new Delegate();
        this._private__dblClicked = new Delegate();
        this._private__crosshairMoved = new Delegate();
        this._private__observer = null;
        this._private__cursorStyleOverride = null;
        this._private__container = container;
        this._private__options = options;
        this._private__horzScaleBehavior = horzScaleBehavior;
        this._private__element = document.createElement('div');
        this._private__element.classList.add('tv-lightweight-charts');
        this._private__element.style.overflow = 'hidden';
        this._private__element.style.direction = 'ltr';
        this._private__element.style.width = '100%';
        this._private__element.style.height = '100%';
        disableSelection(this._private__element);
        this._private__tableElement = document.createElement('table');
        this._private__tableElement.setAttribute('cellspacing', '0');
        this._private__element.appendChild(this._private__tableElement);
        this._private__onWheelBound = this._private__onMousewheel.bind(this);
        if (shouldSubscribeMouseWheel(this._private__options)) {
            this._private__setMouseWheelEventListener(true);
        }
        this._private__model = new ChartModel(this._private__invalidateHandler.bind(this), this._private__options, horzScaleBehavior);
        this._internal_model()._internal_crosshairMoved()._internal_subscribe(this._private__onPaneWidgetCrosshairMoved.bind(this), this);
        this._private__timeAxisWidget = new TimeAxisWidget(this, this._private__horzScaleBehavior);
        this._private__tableElement.appendChild(this._private__timeAxisWidget._internal_getElement());
        const usedObserver = options.autoSize && this._private__installObserver();
        // observer could not fire event immediately for some cases
        // so we have to set initial size manually
        let width = this._private__options.width;
        let height = this._private__options.height;
        // ignore width/height options if observer has actually been used
        // however respect options if installing resize observer failed
        if (usedObserver || width === 0 || height === 0) {
            const containerRect = container.getBoundingClientRect();
            width = width || containerRect.width;
            height = height || containerRect.height;
        }
        // BEWARE: resize must be called BEFORE _syncGuiWithModel (in constructor only)
        // or after but with adjustSize to properly update time scale
        this._internal_resize(width, height);
        this._private__syncGuiWithModel();
        container.appendChild(this._private__element);
        this._private__updateTimeAxisVisibility();
        this._private__model._internal_timeScale()._internal_optionsApplied()._internal_subscribe(this._private__model._internal_fullUpdate.bind(this._private__model), this);
        this._private__model._internal_priceScalesOptionsChanged()._internal_subscribe(this._private__model._internal_fullUpdate.bind(this._private__model), this);
    }
    _internal_model() {
        return this._private__model;
    }
    _internal_options() {
        return this._private__options;
    }
    _internal_paneWidgets() {
        return this._private__paneWidgets;
    }
    _internal_timeAxisWidget() {
        return this._private__timeAxisWidget;
    }
    _internal_destroy() {
        this._private__setMouseWheelEventListener(false);
        if (this._private__drawRafId !== 0) {
            window.cancelAnimationFrame(this._private__drawRafId);
        }
        this._private__model._internal_crosshairMoved()._internal_unsubscribeAll(this);
        this._private__model._internal_timeScale()._internal_optionsApplied()._internal_unsubscribeAll(this);
        this._private__model._internal_priceScalesOptionsChanged()._internal_unsubscribeAll(this);
        this._private__model._internal_destroy();
        for (const paneWidget of this._private__paneWidgets) {
            this._private__tableElement.removeChild(paneWidget._internal_getElement());
            paneWidget._internal_clicked()._internal_unsubscribeAll(this);
            paneWidget._internal_dblClicked()._internal_unsubscribeAll(this);
            paneWidget._internal_destroy();
        }
        this._private__paneWidgets = [];
        // for (const paneSeparator of this._paneSeparators) {
        // 	this._destroySeparator(paneSeparator);
        // }
        // this._paneSeparators = [];
        ensureNotNull(this._private__timeAxisWidget)._internal_destroy();
        if (this._private__element.parentElement !== null) {
            this._private__element.parentElement.removeChild(this._private__element);
        }
        this._private__crosshairMoved._internal_destroy();
        this._private__clicked._internal_destroy();
        this._private__dblClicked._internal_destroy();
        this._private__uninstallObserver();
    }
    _internal_resize(width, height, forceRepaint = false) {
        if (this._private__height === height && this._private__width === width) {
            return;
        }
        const sizeHint = suggestChartSize(size({ width, height }));
        this._private__height = sizeHint.height;
        this._private__width = sizeHint.width;
        const heightStr = this._private__height + 'px';
        const widthStr = this._private__width + 'px';
        ensureNotNull(this._private__element).style.height = heightStr;
        ensureNotNull(this._private__element).style.width = widthStr;
        this._private__tableElement.style.height = heightStr;
        this._private__tableElement.style.width = widthStr;
        if (forceRepaint) {
            this._private__drawImpl(InvalidateMask._internal_full(), performance.now());
        }
        else {
            this._private__model._internal_fullUpdate();
        }
    }
    _internal_paint(invalidateMask) {
        if (invalidateMask === undefined) {
            invalidateMask = InvalidateMask._internal_full();
        }
        for (let i = 0; i < this._private__paneWidgets.length; i++) {
            this._private__paneWidgets[i]._internal_paint(invalidateMask._internal_invalidateForPane(i)._internal_level);
        }
        if (this._private__options.timeScale.visible) {
            this._private__timeAxisWidget._internal_paint(invalidateMask._internal_fullInvalidation());
        }
    }
    _internal_applyOptions(options) {
        const currentlyHasMouseWheelListener = shouldSubscribeMouseWheel(this._private__options);
        // we don't need to merge options here because it's done in chart model
        // and since both model and widget share the same object it will be done automatically for widget as well
        // not ideal solution for sure, but it work's for now ¯\_(ツ)_/¯
        this._private__model._internal_applyOptions(options);
        const shouldHaveMouseWheelListener = shouldSubscribeMouseWheel(this._private__options);
        if (shouldHaveMouseWheelListener !== currentlyHasMouseWheelListener) {
            this._private__setMouseWheelEventListener(shouldHaveMouseWheelListener);
        }
        this._private__updateTimeAxisVisibility();
        this._private__applyAutoSizeOptions(options);
    }
    _internal_clicked() {
        return this._private__clicked;
    }
    _internal_dblClicked() {
        return this._private__dblClicked;
    }
    _internal_crosshairMoved() {
        return this._private__crosshairMoved;
    }
    _internal_takeScreenshot() {
        if (this._private__invalidateMask !== null) {
            this._private__drawImpl(this._private__invalidateMask, performance.now());
            this._private__invalidateMask = null;
        }
        const screeshotBitmapSize = this._private__traverseLayout(null);
        const screenshotCanvas = document.createElement('canvas');
        screenshotCanvas.width = screeshotBitmapSize.width;
        screenshotCanvas.height = screeshotBitmapSize.height;
        const ctx = ensureNotNull(screenshotCanvas.getContext('2d'));
        this._private__traverseLayout(ctx);
        return screenshotCanvas;
    }
    _internal_getPriceAxisWidth(position) {
        if (position === 'left' && !this._private__isLeftAxisVisible()) {
            return 0;
        }
        if (position === 'right' && !this._private__isRightAxisVisible()) {
            return 0;
        }
        if (this._private__paneWidgets.length === 0) {
            return 0;
        }
        // we don't need to worry about exactly pane widget here
        // because all pane widgets have the same width of price axis widget
        // see _adjustSizeImpl
        const priceAxisWidget = position === 'left'
            ? this._private__paneWidgets[0]._internal_leftPriceAxisWidget()
            : this._private__paneWidgets[0]._internal_rightPriceAxisWidget();
        return ensureNotNull(priceAxisWidget)._internal_getWidth();
    }
    _internal_autoSizeActive() {
        return this._private__options.autoSize && this._private__observer !== null;
    }
    _internal_element() {
        return this._private__element;
    }
    _internal_setCursorStyle(style) {
        this._private__cursorStyleOverride = style;
        if (this._private__cursorStyleOverride) {
            this._internal_element().style.setProperty('cursor', style);
        }
        else {
            this._internal_element().style.removeProperty('cursor');
        }
    }
    _internal_getCursorOverrideStyle() {
        return this._private__cursorStyleOverride;
    }
    _internal_paneSize() {
        // we currently only support a single pane.
        return ensureDefined(this._private__paneWidgets[0])._internal_getSize();
    }
    // eslint-disable-next-line complexity
    _private__applyAutoSizeOptions(options) {
        if (options.autoSize === undefined && this._private__observer && (options.width !== undefined || options.height !== undefined)) {
            warn(`You should turn autoSize off explicitly before specifying sizes; try adding options.autoSize: false to new options`);
            return;
        }
        if (options.autoSize && !this._private__observer) {
            // installing observer will override resize if successful
            this._private__installObserver();
        }
        if (options.autoSize === false && this._private__observer !== null) {
            this._private__uninstallObserver();
        }
        if (!options.autoSize && (options.width !== undefined || options.height !== undefined)) {
            this._internal_resize(options.width || this._private__width, options.height || this._private__height);
        }
    }
    /**
     * Traverses the widget's layout (pane and axis child widgets),
     * draws the screenshot (if rendering context is passed) and returns the screenshot bitmap size
     *
     * @param ctx - if passed, used to draw the screenshot of widget
     * @returns screenshot bitmap size
     */
    _private__traverseLayout(ctx) {
        let totalWidth = 0;
        let totalHeight = 0;
        const firstPane = this._private__paneWidgets[0];
        const drawPriceAxises = (position, targetX) => {
            let targetY = 0;
            for (let paneIndex = 0; paneIndex < this._private__paneWidgets.length; paneIndex++) {
                const paneWidget = this._private__paneWidgets[paneIndex];
                const priceAxisWidget = ensureNotNull(position === 'left' ? paneWidget._internal_leftPriceAxisWidget() : paneWidget._internal_rightPriceAxisWidget());
                const bitmapSize = priceAxisWidget._internal_getBitmapSize();
                if (ctx !== null) {
                    priceAxisWidget._internal_drawBitmap(ctx, targetX, targetY);
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
        if (this._private__isLeftAxisVisible()) {
            drawPriceAxises('left', 0);
            const leftAxisBitmapWidth = ensureNotNull(firstPane._internal_leftPriceAxisWidget())._internal_getBitmapSize().width;
            totalWidth += leftAxisBitmapWidth;
        }
        for (let paneIndex = 0; paneIndex < this._private__paneWidgets.length; paneIndex++) {
            const paneWidget = this._private__paneWidgets[paneIndex];
            const bitmapSize = paneWidget._internal_getBitmapSize();
            if (ctx !== null) {
                paneWidget._internal_drawBitmap(ctx, totalWidth, totalHeight);
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
        const firstPaneBitmapWidth = firstPane._internal_getBitmapSize().width;
        totalWidth += firstPaneBitmapWidth;
        // draw right price scale if exists
        if (this._private__isRightAxisVisible()) {
            drawPriceAxises('right', totalWidth);
            const rightAxisBitmapWidth = ensureNotNull(firstPane._internal_rightPriceAxisWidget())._internal_getBitmapSize().width;
            totalWidth += rightAxisBitmapWidth;
        }
        const drawStub = (position, targetX, targetY) => {
            const stub = ensureNotNull(position === 'left' ? this._private__timeAxisWidget._internal_leftStub() : this._private__timeAxisWidget._internal_rightStub());
            stub._internal_drawBitmap(ensureNotNull(ctx), targetX, targetY);
        };
        // draw time scale and stubs
        if (this._private__options.timeScale.visible) {
            const timeAxisBitmapSize = this._private__timeAxisWidget._internal_getBitmapSize();
            if (ctx !== null) {
                let targetX = 0;
                if (this._private__isLeftAxisVisible()) {
                    drawStub('left', targetX, totalHeight);
                    targetX = ensureNotNull(firstPane._internal_leftPriceAxisWidget())._internal_getBitmapSize().width;
                }
                this._private__timeAxisWidget._internal_drawBitmap(ctx, targetX, totalHeight);
                targetX += timeAxisBitmapSize.width;
                if (this._private__isRightAxisVisible()) {
                    drawStub('right', targetX, totalHeight);
                }
            }
            totalHeight += timeAxisBitmapSize.height;
        }
        return size({
            width: totalWidth,
            height: totalHeight,
        });
    }
    // eslint-disable-next-line complexity
    _private__adjustSizeImpl() {
        let totalStretch = 0;
        let leftPriceAxisWidth = 0;
        let rightPriceAxisWidth = 0;
        for (const paneWidget of this._private__paneWidgets) {
            if (this._private__isLeftAxisVisible()) {
                leftPriceAxisWidth = Math.max(leftPriceAxisWidth, ensureNotNull(paneWidget._internal_leftPriceAxisWidget())._internal_optimalWidth(), this._private__options.leftPriceScale.minimumWidth);
            }
            if (this._private__isRightAxisVisible()) {
                rightPriceAxisWidth = Math.max(rightPriceAxisWidth, ensureNotNull(paneWidget._internal_rightPriceAxisWidget())._internal_optimalWidth(), this._private__options.rightPriceScale.minimumWidth);
            }
            totalStretch += paneWidget._internal_stretchFactor();
        }
        leftPriceAxisWidth = suggestPriceScaleWidth(leftPriceAxisWidth);
        rightPriceAxisWidth = suggestPriceScaleWidth(rightPriceAxisWidth);
        const width = this._private__width;
        const height = this._private__height;
        const paneWidth = Math.max(width - leftPriceAxisWidth - rightPriceAxisWidth, 0);
        // const separatorCount = this._paneSeparators.length;
        // const separatorHeight = SEPARATOR_HEIGHT;
        const separatorsHeight = 0; // separatorHeight * separatorCount;
        const timeAxisVisible = this._private__options.timeScale.visible;
        let timeAxisHeight = timeAxisVisible ? Math.max(this._private__timeAxisWidget._internal_optimalHeight(), this._private__options.timeScale.minimumHeight) : 0;
        timeAxisHeight = suggestTimeScaleHeight(timeAxisHeight);
        const otherWidgetHeight = separatorsHeight + timeAxisHeight;
        const totalPaneHeight = height < otherWidgetHeight ? 0 : height - otherWidgetHeight;
        const stretchPixels = totalPaneHeight / totalStretch;
        let accumulatedHeight = 0;
        for (let paneIndex = 0; paneIndex < this._private__paneWidgets.length; ++paneIndex) {
            const paneWidget = this._private__paneWidgets[paneIndex];
            paneWidget._internal_setState(this._private__model._internal_panes()[paneIndex]);
            let paneHeight = 0;
            let calculatePaneHeight = 0;
            if (paneIndex === this._private__paneWidgets.length - 1) {
                calculatePaneHeight = totalPaneHeight - accumulatedHeight;
            }
            else {
                calculatePaneHeight = Math.round(paneWidget._internal_stretchFactor() * stretchPixels);
            }
            paneHeight = Math.max(calculatePaneHeight, 2);
            accumulatedHeight += paneHeight;
            paneWidget._internal_setSize(size({ width: paneWidth, height: paneHeight }));
            if (this._private__isLeftAxisVisible()) {
                paneWidget._internal_setPriceAxisSize(leftPriceAxisWidth, 'left');
            }
            if (this._private__isRightAxisVisible()) {
                paneWidget._internal_setPriceAxisSize(rightPriceAxisWidth, 'right');
            }
            if (paneWidget._internal_state()) {
                this._private__model._internal_setPaneHeight(paneWidget._internal_state(), paneHeight);
            }
        }
        this._private__timeAxisWidget._internal_setSizes(size({ width: timeAxisVisible ? paneWidth : 0, height: timeAxisHeight }), timeAxisVisible ? leftPriceAxisWidth : 0, timeAxisVisible ? rightPriceAxisWidth : 0);
        this._private__model._internal_setWidth(paneWidth);
        if (this._private__leftPriceAxisWidth !== leftPriceAxisWidth) {
            this._private__leftPriceAxisWidth = leftPriceAxisWidth;
        }
        if (this._private__rightPriceAxisWidth !== rightPriceAxisWidth) {
            this._private__rightPriceAxisWidth = rightPriceAxisWidth;
        }
    }
    _private__setMouseWheelEventListener(add) {
        if (add) {
            this._private__element.addEventListener('wheel', this._private__onWheelBound, { passive: false });
            return;
        }
        this._private__element.removeEventListener('wheel', this._private__onWheelBound);
    }
    _private__determineWheelSpeedAdjustment(event) {
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
    _private__onMousewheel(event) {
        if ((event.deltaX === 0 || !this._private__options.handleScroll.mouseWheel) &&
            (event.deltaY === 0 || !this._private__options.handleScale.mouseWheel)) {
            return;
        }
        const scrollSpeedAdjustment = this._private__determineWheelSpeedAdjustment(event);
        const deltaX = scrollSpeedAdjustment * event.deltaX / 100;
        const deltaY = -(scrollSpeedAdjustment * event.deltaY / 100);
        if (event.cancelable) {
            event.preventDefault();
        }
        if (deltaY !== 0 && this._private__options.handleScale.mouseWheel) {
            const zoomScale = Math.sign(deltaY) * Math.min(1, Math.abs(deltaY));
            const scrollPosition = event.clientX - this._private__element.getBoundingClientRect().left;
            this._internal_model()._internal_zoomTime(scrollPosition, zoomScale);
        }
        if (deltaX !== 0 && this._private__options.handleScroll.mouseWheel) {
            this._internal_model()._internal_scrollChart(deltaX * -80); // 80 is a made up coefficient, and minus is for the "natural" scroll
        }
    }
    _private__drawImpl(invalidateMask, time) {
        var _a;
        const invalidationType = invalidateMask._internal_fullInvalidation();
        // actions for full invalidation ONLY (not shared with light)
        if (invalidationType === 3 /* InvalidationLevel.Full */) {
            this._private__updateGui();
        }
        // light or full invalidate actions
        if (invalidationType === 3 /* InvalidationLevel.Full */ ||
            invalidationType === 2 /* InvalidationLevel.Light */) {
            this._private__applyMomentaryAutoScale(invalidateMask);
            this._private__applyTimeScaleInvalidations(invalidateMask, time);
            this._private__timeAxisWidget._internal_update();
            this._private__paneWidgets.forEach((pane) => {
                pane._internal_updatePriceAxisWidgets();
            });
            // In the case a full invalidation has been postponed during the draw, reapply
            // the timescale invalidations. A full invalidation would mean there is a change
            // in the timescale width (caused by price scale changes) that needs to be drawn
            // right away to avoid flickering.
            if (((_a = this._private__invalidateMask) === null || _a === void 0 ? void 0 : _a._internal_fullInvalidation()) === 3 /* InvalidationLevel.Full */) {
                this._private__invalidateMask._internal_merge(invalidateMask);
                this._private__updateGui();
                this._private__applyMomentaryAutoScale(this._private__invalidateMask);
                this._private__applyTimeScaleInvalidations(this._private__invalidateMask, time);
                invalidateMask = this._private__invalidateMask;
                this._private__invalidateMask = null;
            }
        }
        this._internal_paint(invalidateMask);
    }
    _private__applyTimeScaleInvalidations(invalidateMask, time) {
        for (const tsInvalidation of invalidateMask._internal_timeScaleInvalidations()) {
            this._private__applyTimeScaleInvalidation(tsInvalidation, time);
        }
    }
    _private__applyMomentaryAutoScale(invalidateMask) {
        const panes = this._private__model._internal_panes();
        for (let i = 0; i < panes.length; i++) {
            if (invalidateMask._internal_invalidateForPane(i)._internal_autoScale) {
                panes[i]._internal_momentaryAutoScale();
            }
        }
    }
    _private__applyTimeScaleInvalidation(invalidation, time) {
        const timeScale = this._private__model._internal_timeScale();
        switch (invalidation._internal_type) {
            case 0 /* TimeScaleInvalidationType.FitContent */:
                timeScale._internal_fitContent();
                break;
            case 1 /* TimeScaleInvalidationType.ApplyRange */:
                timeScale._internal_setLogicalRange(invalidation._internal_value);
                break;
            case 2 /* TimeScaleInvalidationType.ApplyBarSpacing */:
                timeScale._internal_setBarSpacing(invalidation._internal_value);
                break;
            case 3 /* TimeScaleInvalidationType.ApplyRightOffset */:
                timeScale._internal_setRightOffset(invalidation._internal_value);
                break;
            case 4 /* TimeScaleInvalidationType.Reset */:
                timeScale._internal_restoreDefault();
                break;
            case 5 /* TimeScaleInvalidationType.Animation */:
                if (!invalidation._internal_value._internal_finished(time)) {
                    timeScale._internal_setRightOffset(invalidation._internal_value._internal_getPosition(time));
                }
                break;
        }
    }
    _private__invalidateHandler(invalidateMask) {
        if (this._private__invalidateMask !== null) {
            this._private__invalidateMask._internal_merge(invalidateMask);
        }
        else {
            this._private__invalidateMask = invalidateMask;
        }
        if (!this._private__drawPlanned) {
            this._private__drawPlanned = true;
            this._private__drawRafId = window.requestAnimationFrame((time) => {
                this._private__drawPlanned = false;
                this._private__drawRafId = 0;
                if (this._private__invalidateMask !== null) {
                    const mask = this._private__invalidateMask;
                    this._private__invalidateMask = null;
                    this._private__drawImpl(mask, time);
                    for (const tsInvalidation of mask._internal_timeScaleInvalidations()) {
                        if (tsInvalidation._internal_type === 5 /* TimeScaleInvalidationType.Animation */ && !tsInvalidation._internal_value._internal_finished(time)) {
                            this._internal_model()._internal_setTimeScaleAnimation(tsInvalidation._internal_value);
                            break;
                        }
                    }
                }
            });
        }
    }
    _private__updateGui() {
        this._private__syncGuiWithModel();
    }
    // private _destroySeparator(separator: PaneSeparator): void {
    // 	this._tableElement.removeChild(separator.getElement());
    // 	separator.destroy();
    // }
    _private__syncGuiWithModel() {
        const panes = this._private__model._internal_panes();
        const targetPaneWidgetsCount = panes.length;
        const actualPaneWidgetsCount = this._private__paneWidgets.length;
        // Remove (if needed) pane widgets and separators
        for (let i = targetPaneWidgetsCount; i < actualPaneWidgetsCount; i++) {
            const paneWidget = ensureDefined(this._private__paneWidgets.pop());
            this._private__tableElement.removeChild(paneWidget._internal_getElement());
            paneWidget._internal_clicked()._internal_unsubscribeAll(this);
            paneWidget._internal_dblClicked()._internal_unsubscribeAll(this);
            paneWidget._internal_destroy();
            // const paneSeparator = this._paneSeparators.pop();
            // if (paneSeparator !== undefined) {
            // 	this._destroySeparator(paneSeparator);
            // }
        }
        // Create (if needed) new pane widgets and separators
        for (let i = actualPaneWidgetsCount; i < targetPaneWidgetsCount; i++) {
            const paneWidget = new PaneWidget(this, panes[i]);
            paneWidget._internal_clicked()._internal_subscribe(this._private__onPaneWidgetClicked.bind(this), this);
            paneWidget._internal_dblClicked()._internal_subscribe(this._private__onPaneWidgetDblClicked.bind(this), this);
            this._private__paneWidgets.push(paneWidget);
            // create and insert separator
            // if (i > 1) {
            // 	const paneSeparator = new PaneSeparator(this, i - 1, i, true);
            // 	this._paneSeparators.push(paneSeparator);
            // 	this._tableElement.insertBefore(paneSeparator.getElement(), this._timeAxisWidget.getElement());
            // }
            // insert paneWidget
            this._private__tableElement.insertBefore(paneWidget._internal_getElement(), this._private__timeAxisWidget._internal_getElement());
        }
        for (let i = 0; i < targetPaneWidgetsCount; i++) {
            const state = panes[i];
            const paneWidget = this._private__paneWidgets[i];
            if (paneWidget._internal_state() !== state) {
                paneWidget._internal_setState(state);
            }
            else {
                paneWidget._internal_updatePriceAxisWidgetsStates();
            }
        }
        this._private__updateTimeAxisVisibility();
        this._private__adjustSizeImpl();
    }
    _private__getMouseEventParamsImpl(index, point, event) {
        var _a;
        const seriesData = new Map();
        if (index !== null) {
            const serieses = this._private__model._internal_serieses();
            serieses.forEach((s) => {
                // TODO: replace with search left
                const data = s._internal_bars()._internal_search(index);
                if (data !== null) {
                    seriesData.set(s, data);
                }
            });
        }
        let clientTime;
        if (index !== null) {
            const timePoint = (_a = this._private__model._internal_timeScale()._internal_indexToTimeScalePoint(index)) === null || _a === void 0 ? void 0 : _a.originalTime;
            if (timePoint !== undefined) {
                clientTime = timePoint;
            }
        }
        const hoveredSource = this._internal_model()._internal_hoveredSource();
        const hoveredSeries = hoveredSource !== null && hoveredSource._internal_source instanceof Series
            ? hoveredSource._internal_source
            : undefined;
        const hoveredObject = hoveredSource !== null && hoveredSource._internal_object !== undefined
            ? hoveredSource._internal_object._internal_externalId
            : undefined;
        return {
            _internal_originalTime: clientTime,
            _internal_index: index !== null && index !== void 0 ? index : undefined,
            _internal_point: point !== null && point !== void 0 ? point : undefined,
            _internal_hoveredSeries: hoveredSeries,
            _internal_seriesData: seriesData,
            _internal_hoveredObject: hoveredObject,
            _internal_touchMouseEventData: event !== null && event !== void 0 ? event : undefined,
        };
    }
    _private__onPaneWidgetClicked(time, point, event) {
        this._private__clicked._internal_fire(() => this._private__getMouseEventParamsImpl(time, point, event));
    }
    _private__onPaneWidgetDblClicked(time, point, event) {
        this._private__dblClicked._internal_fire(() => this._private__getMouseEventParamsImpl(time, point, event));
    }
    _private__onPaneWidgetCrosshairMoved(time, point, event) {
        this._private__crosshairMoved._internal_fire(() => this._private__getMouseEventParamsImpl(time, point, event));
    }
    _private__updateTimeAxisVisibility() {
        const display = this._private__options.timeScale.visible ? '' : 'none';
        this._private__timeAxisWidget._internal_getElement().style.display = display;
    }
    _private__isLeftAxisVisible() {
        return this._private__paneWidgets[0]._internal_state()._internal_leftPriceScale()._internal_options().visible;
    }
    _private__isRightAxisVisible() {
        return this._private__paneWidgets[0]._internal_state()._internal_rightPriceScale()._internal_options().visible;
    }
    _private__installObserver() {
        // eslint-disable-next-line no-restricted-syntax
        if (!('ResizeObserver' in window)) {
            warn('Options contains "autoSize" flag, but the browser does not support ResizeObserver feature. Please provide polyfill.');
            return false;
        }
        else {
            this._private__observer = new ResizeObserver((entries) => {
                const containerEntry = entries.find((entry) => entry.target === this._private__container);
                if (!containerEntry) {
                    return;
                }
                this._internal_resize(containerEntry.contentRect.width, containerEntry.contentRect.height);
            });
            this._private__observer.observe(this._private__container, { box: 'border-box' });
            return true;
        }
    }
    _private__uninstallObserver() {
        if (this._private__observer !== null) {
            this._private__observer.disconnect();
        }
        this._private__observer = null;
    }
}
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
