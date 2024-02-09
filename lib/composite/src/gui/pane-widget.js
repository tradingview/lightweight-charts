"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaneWidget = void 0;
const fancy_canvas_1 = require("fancy-canvas");
const assertions_1 = require("../helpers/assertions");
const canvas_helpers_1 = require("../helpers/canvas-helpers");
const delegate_1 = require("../helpers/delegate");
const kinetic_animation_1 = require("../model/kinetic-animation");
const canvas_utils_1 = require("./canvas-utils");
const draw_functions_1 = require("./draw-functions");
const mouse_event_handler_1 = require("./mouse-event-handler");
const pane_hit_test_1 = require("./pane-hit-test");
const price_axis_widget_1 = require("./price-axis-widget");
var KineticScrollConstants;
(function (KineticScrollConstants) {
    KineticScrollConstants[KineticScrollConstants["MinScrollSpeed"] = 0.2] = "MinScrollSpeed";
    KineticScrollConstants[KineticScrollConstants["MaxScrollSpeed"] = 7] = "MaxScrollSpeed";
    KineticScrollConstants[KineticScrollConstants["DumpingCoeff"] = 0.997] = "DumpingCoeff";
    KineticScrollConstants[KineticScrollConstants["ScrollMinMove"] = 15] = "ScrollMinMove";
})(KineticScrollConstants || (KineticScrollConstants = {}));
function sourceBottomPaneViews(source, pane) {
    var _a, _b;
    return (_b = (_a = source.bottomPaneViews) === null || _a === void 0 ? void 0 : _a.call(source, pane)) !== null && _b !== void 0 ? _b : [];
}
function sourcePaneViews(source, pane) {
    var _a, _b;
    return (_b = (_a = source.paneViews) === null || _a === void 0 ? void 0 : _a.call(source, pane)) !== null && _b !== void 0 ? _b : [];
}
function sourceLabelPaneViews(source, pane) {
    var _a, _b;
    return (_b = (_a = source.labelPaneViews) === null || _a === void 0 ? void 0 : _a.call(source, pane)) !== null && _b !== void 0 ? _b : [];
}
function sourceTopPaneViews(source, pane) {
    var _a, _b;
    return (_b = (_a = source.topPaneViews) === null || _a === void 0 ? void 0 : _a.call(source, pane)) !== null && _b !== void 0 ? _b : [];
}
class PaneWidget {
    constructor(chart, state) {
        this._size = (0, fancy_canvas_1.size)({ width: 0, height: 0 });
        this._leftPriceAxisWidget = null;
        this._rightPriceAxisWidget = null;
        this._startScrollingPos = null;
        this._isScrolling = false;
        this._clicked = new delegate_1.Delegate();
        this._dblClicked = new delegate_1.Delegate();
        this._prevPinchScale = 0;
        this._longTap = false;
        this._startTrackPoint = null;
        this._exitTrackingModeOnNextTry = false;
        this._initCrosshairPosition = null;
        this._scrollXAnimation = null;
        this._isSettingSize = false;
        this._canvasSuggestedBitmapSizeChangedHandler = () => {
            if (this._isSettingSize || this._state === null) {
                return;
            }
            this._model().lightUpdate();
        };
        this._topCanvasSuggestedBitmapSizeChangedHandler = () => {
            if (this._isSettingSize || this._state === null) {
                return;
            }
            this._model().lightUpdate();
        };
        this._chart = chart;
        this._state = state;
        this._state
            .onDestroyed()
            .subscribe(this._onStateDestroyed.bind(this), this, true);
        this._paneCell = document.createElement("td");
        this._paneCell.style.padding = "0";
        this._paneCell.style.position = "relative";
        const paneWrapper = document.createElement("div");
        paneWrapper.style.width = "100%";
        paneWrapper.style.height = "100%";
        paneWrapper.style.position = "static";
        paneWrapper.style.overflow = "hidden";
        this._leftAxisCell = document.createElement("td");
        this._leftAxisCell.style.padding = "0";
        this._rightAxisCell = document.createElement("td");
        this._rightAxisCell.style.padding = "0";
        this._paneCell.appendChild(paneWrapper);
        this._canvasBinding = (0, canvas_utils_1.createBoundCanvas)(paneWrapper, (0, fancy_canvas_1.size)({ width: 16, height: 16 }));
        this._canvasBinding.subscribeSuggestedBitmapSizeChanged(this._canvasSuggestedBitmapSizeChangedHandler);
        const canvas = this._canvasBinding.canvasElement;
        canvas.style.position = "absolute";
        canvas.style.zIndex = "1";
        canvas.style.left = "0";
        canvas.style.top = "0";
        this._topCanvasBinding = (0, canvas_utils_1.createBoundCanvas)(paneWrapper, (0, fancy_canvas_1.size)({ width: 16, height: 16 }));
        this._topCanvasBinding.subscribeSuggestedBitmapSizeChanged(this._topCanvasSuggestedBitmapSizeChangedHandler);
        const topCanvas = this._topCanvasBinding.canvasElement;
        topCanvas.style.position = "absolute";
        topCanvas.style.zIndex = "2";
        topCanvas.style.left = "0";
        topCanvas.style.top = "0";
        this._rowElement = document.createElement("tr");
        this._rowElement.appendChild(this._leftAxisCell);
        this._rowElement.appendChild(this._paneCell);
        this._rowElement.appendChild(this._rightAxisCell);
        this.updatePriceAxisWidgetsStates();
        this._mouseEventHandler = new mouse_event_handler_1.MouseEventHandler(this._topCanvasBinding.canvasElement, this, {
            treatVertTouchDragAsPageScroll: () => this._startTrackPoint === null &&
                !this._chart.options().handleScroll.vertTouchDrag,
            treatHorzTouchDragAsPageScroll: () => this._startTrackPoint === null &&
                !this._chart.options().handleScroll.horzTouchDrag,
        });
    }
    destroy() {
        if (this._leftPriceAxisWidget !== null) {
            this._leftPriceAxisWidget.destroy();
        }
        if (this._rightPriceAxisWidget !== null) {
            this._rightPriceAxisWidget.destroy();
        }
        this._topCanvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._topCanvasSuggestedBitmapSizeChangedHandler);
        (0, canvas_utils_1.releaseCanvas)(this._topCanvasBinding.canvasElement);
        this._topCanvasBinding.dispose();
        this._canvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._canvasSuggestedBitmapSizeChangedHandler);
        (0, canvas_utils_1.releaseCanvas)(this._canvasBinding.canvasElement);
        this._canvasBinding.dispose();
        if (this._state !== null) {
            this._state.onDestroyed().unsubscribeAll(this);
        }
        this._mouseEventHandler.destroy();
    }
    state() {
        return (0, assertions_1.ensureNotNull)(this._state);
    }
    setState(pane) {
        if (this._state !== null) {
            this._state.onDestroyed().unsubscribeAll(this);
        }
        this._state = pane;
        if (this._state !== null) {
            this._state
                .onDestroyed()
                .subscribe(PaneWidget.prototype._onStateDestroyed.bind(this), this, true);
        }
        this.updatePriceAxisWidgetsStates();
    }
    chart() {
        return this._chart;
    }
    getElement() {
        return this._rowElement;
    }
    updatePriceAxisWidgetsStates() {
        if (this._state === null) {
            return;
        }
        this._recreatePriceAxisWidgets();
        if (this._model().serieses().length === 0) {
            return;
        }
        if (this._leftPriceAxisWidget !== null) {
            const leftPriceScale = this._state.leftPriceScale();
            this._leftPriceAxisWidget.setPriceScale((0, assertions_1.ensureNotNull)(leftPriceScale));
        }
        if (this._rightPriceAxisWidget !== null) {
            const rightPriceScale = this._state.rightPriceScale();
            this._rightPriceAxisWidget.setPriceScale((0, assertions_1.ensureNotNull)(rightPriceScale));
        }
    }
    updatePriceAxisWidgets() {
        if (this._leftPriceAxisWidget !== null) {
            this._leftPriceAxisWidget.update();
        }
        if (this._rightPriceAxisWidget !== null) {
            this._rightPriceAxisWidget.update();
        }
    }
    stretchFactor() {
        return this._state !== null ? this._state.stretchFactor() : 0;
    }
    setStretchFactor(stretchFactor) {
        if (this._state) {
            this._state.setStretchFactor(stretchFactor);
        }
    }
    mouseEnterEvent(event) {
        if (!this._state) {
            return;
        }
        this._onMouseEvent();
        const x = event.localX;
        const y = event.localY;
        this._setCrosshairPosition(x, y, event);
    }
    mouseDownEvent(event) {
        this._onMouseEvent();
        this._mouseTouchDownEvent();
        this._setCrosshairPosition(event.localX, event.localY, event);
    }
    mouseMoveEvent(event) {
        var _a;
        if (!this._state) {
            return;
        }
        this._onMouseEvent();
        const x = event.localX;
        const y = event.localY;
        this._setCrosshairPosition(x, y, event);
        const hitTest = this.hitTest(x, y);
        this._chart.setCursorStyle((_a = hitTest === null || hitTest === void 0 ? void 0 : hitTest.cursorStyle) !== null && _a !== void 0 ? _a : null);
        this._model().setHoveredSource(hitTest && { source: hitTest.source, object: hitTest.object });
    }
    mouseClickEvent(event) {
        if (this._state === null) {
            return;
        }
        this._onMouseEvent();
        this._fireClickedDelegate(event);
    }
    mouseDoubleClickEvent(event) {
        if (this._state === null) {
            return;
        }
        this._fireMouseClickDelegate(this._dblClicked, event);
    }
    doubleTapEvent(event) {
        this.mouseDoubleClickEvent(event);
    }
    pressedMouseMoveEvent(event) {
        this._onMouseEvent();
        this._pressedMouseTouchMoveEvent(event);
        this._setCrosshairPosition(event.localX, event.localY, event);
    }
    mouseUpEvent(event) {
        if (this._state === null) {
            return;
        }
        this._onMouseEvent();
        this._longTap = false;
        this._endScroll(event);
    }
    tapEvent(event) {
        if (this._state === null) {
            return;
        }
        this._fireClickedDelegate(event);
    }
    longTapEvent(event) {
        this._longTap = true;
        if (this._startTrackPoint === null) {
            const point = { x: event.localX, y: event.localY };
            this._startTrackingMode(point, point, event);
        }
    }
    mouseLeaveEvent(event) {
        if (this._state === null) {
            return;
        }
        this._onMouseEvent();
        this._state.model().setHoveredSource(null);
        this._clearCrosshairPosition();
    }
    clicked() {
        return this._clicked;
    }
    dblClicked() {
        return this._dblClicked;
    }
    pinchStartEvent() {
        this._prevPinchScale = 1;
        this._model().stopTimeScaleAnimation();
    }
    pinchEvent(middlePoint, scale) {
        if (!this._chart.options().handleScale.pinch) {
            return;
        }
        const zoomScale = (scale - this._prevPinchScale) * 5;
        this._prevPinchScale = scale;
        this._model().zoomTime(middlePoint.x, zoomScale);
    }
    touchStartEvent(event) {
        this._longTap = false;
        this._exitTrackingModeOnNextTry = this._startTrackPoint !== null;
        this._mouseTouchDownEvent();
        const crosshair = this._model().crosshairSource();
        if (this._startTrackPoint !== null && crosshair.visible()) {
            this._initCrosshairPosition = {
                x: crosshair.appliedX(),
                y: crosshair.appliedY(),
            };
            this._startTrackPoint = { x: event.localX, y: event.localY };
        }
    }
    touchMoveEvent(event) {
        if (this._state === null) {
            return;
        }
        const x = event.localX;
        const y = event.localY;
        if (this._startTrackPoint !== null) {
            // tracking mode: move crosshair
            this._exitTrackingModeOnNextTry = false;
            const origPoint = (0, assertions_1.ensureNotNull)(this._initCrosshairPosition);
            const newX = (origPoint.x + (x - this._startTrackPoint.x));
            const newY = (origPoint.y + (y - this._startTrackPoint.y));
            this._setCrosshairPosition(newX, newY, event);
            return;
        }
        this._pressedMouseTouchMoveEvent(event);
    }
    touchEndEvent(event) {
        if (this.chart().options().trackingMode.exitMode ===
            0 /* TrackingModeExitMode.OnTouchEnd */) {
            this._exitTrackingModeOnNextTry = true;
        }
        this._tryExitTrackingMode();
        this._endScroll(event);
    }
    hitTest(x, y) {
        const state = this._state;
        if (state === null) {
            return null;
        }
        return (0, pane_hit_test_1.hitTestPane)(state, x, y);
    }
    setPriceAxisSize(width, position) {
        const priceAxisWidget = position === "left"
            ? this._leftPriceAxisWidget
            : this._rightPriceAxisWidget;
        (0, assertions_1.ensureNotNull)(priceAxisWidget).setSize((0, fancy_canvas_1.size)({ width, height: this._size.height }));
    }
    getSize() {
        return this._size;
    }
    setSize(newSize) {
        if ((0, fancy_canvas_1.equalSizes)(this._size, newSize)) {
            return;
        }
        this._size = newSize;
        this._isSettingSize = true;
        this._canvasBinding.resizeCanvasElement(newSize);
        this._topCanvasBinding.resizeCanvasElement(newSize);
        this._isSettingSize = false;
        this._paneCell.style.width = newSize.width + "px";
        this._paneCell.style.height = newSize.height + "px";
    }
    recalculatePriceScales() {
        const pane = (0, assertions_1.ensureNotNull)(this._state);
        pane.recalculatePriceScale(pane.leftPriceScale());
        pane.recalculatePriceScale(pane.rightPriceScale());
        for (const source of pane.dataSources()) {
            if (pane.isOverlay(source)) {
                const priceScale = source.priceScale();
                if (priceScale !== null) {
                    pane.recalculatePriceScale(priceScale);
                }
                // for overlay drawings price scale is owner's price scale
                // however owner's price scale could not contain ds
                source.updateAllViews();
            }
        }
    }
    getBitmapSize() {
        return this._canvasBinding.bitmapSize;
    }
    drawBitmap(ctx, x, y) {
        const bitmapSize = this.getBitmapSize();
        if (bitmapSize.width > 0 && bitmapSize.height > 0) {
            ctx.drawImage(this._canvasBinding.canvasElement, x, y);
        }
    }
    paint(type) {
        if (type === 0 /* InvalidationLevel.None */) {
            return;
        }
        if (this._state === null) {
            return;
        }
        if (type > 1 /* InvalidationLevel.Cursor */) {
            this.recalculatePriceScales();
        }
        if (this._leftPriceAxisWidget !== null) {
            this._leftPriceAxisWidget.paint(type);
        }
        if (this._rightPriceAxisWidget !== null) {
            this._rightPriceAxisWidget.paint(type);
        }
        if (type !== 1 /* InvalidationLevel.Cursor */) {
            this._canvasBinding.applySuggestedBitmapSize();
            const target = (0, fancy_canvas_1.tryCreateCanvasRenderingTarget2D)(this._canvasBinding);
            if (target !== null) {
                target.useBitmapCoordinateSpace((scope) => {
                    this._drawBackground(scope);
                });
                if (this._state) {
                    this._drawSources(target, sourceBottomPaneViews);
                    this._drawGrid(target);
                    this._drawWatermark(target);
                    this._drawSources(target, sourcePaneViews);
                    this._drawSources(target, sourceLabelPaneViews);
                }
            }
        }
        this._topCanvasBinding.applySuggestedBitmapSize();
        const topTarget = (0, fancy_canvas_1.tryCreateCanvasRenderingTarget2D)(this._topCanvasBinding);
        if (topTarget !== null) {
            topTarget.useBitmapCoordinateSpace(({ context: ctx, bitmapSize }) => {
                ctx.clearRect(0, 0, bitmapSize.width, bitmapSize.height);
            });
            this._drawCrosshair(topTarget);
            this._drawSources(topTarget, sourceTopPaneViews);
        }
    }
    leftPriceAxisWidget() {
        return this._leftPriceAxisWidget;
    }
    rightPriceAxisWidget() {
        return this._rightPriceAxisWidget;
    }
    drawAdditionalSources(target, paneViewsGetter) {
        this._drawSources(target, paneViewsGetter);
    }
    _onStateDestroyed() {
        if (this._state !== null) {
            this._state.onDestroyed().unsubscribeAll(this);
        }
        this._state = null;
    }
    _fireClickedDelegate(event) {
        this._fireMouseClickDelegate(this._clicked, event);
    }
    _fireMouseClickDelegate(delegate, event) {
        const x = event.localX;
        const y = event.localY;
        if (delegate.hasListeners()) {
            delegate.fire(this._model().timeScale().coordinateToIndex(x), { x, y }, event);
        }
    }
    _drawBackground({ context: ctx, bitmapSize, }) {
        const { width, height } = bitmapSize;
        const model = this._model();
        const topColor = model.backgroundTopColor();
        const bottomColor = model.backgroundBottomColor();
        if (topColor === bottomColor) {
            (0, canvas_helpers_1.clearRect)(ctx, 0, 0, width, height, bottomColor);
        }
        else {
            (0, canvas_helpers_1.clearRectWithGradient)(ctx, 0, 0, width, height, topColor, bottomColor);
        }
    }
    _drawGrid(target) {
        const state = (0, assertions_1.ensureNotNull)(this._state);
        const paneView = state.grid().paneView();
        const renderer = paneView.renderer();
        if (renderer !== null) {
            renderer.draw(target, false);
        }
    }
    _drawWatermark(target) {
        const source = this._model().watermarkSource();
        this._drawSourceImpl(target, sourcePaneViews, draw_functions_1.drawBackground, source);
        this._drawSourceImpl(target, sourcePaneViews, draw_functions_1.drawForeground, source);
    }
    _drawCrosshair(target) {
        this._drawSourceImpl(target, sourcePaneViews, draw_functions_1.drawForeground, this._model().crosshairSource());
    }
    _drawSources(target, paneViewsGetter) {
        const state = (0, assertions_1.ensureNotNull)(this._state);
        const sources = state.orderedSources();
        for (const source of sources) {
            this._drawSourceImpl(target, paneViewsGetter, draw_functions_1.drawBackground, source);
        }
        for (const source of sources) {
            this._drawSourceImpl(target, paneViewsGetter, draw_functions_1.drawForeground, source);
        }
    }
    _drawSourceImpl(target, paneViewsGetter, drawFn, source) {
        const state = (0, assertions_1.ensureNotNull)(this._state);
        const hoveredSource = state.model().hoveredSource();
        const isHovered = hoveredSource !== null && hoveredSource.source === source;
        const objecId = hoveredSource !== null && isHovered && hoveredSource.object !== undefined
            ? hoveredSource.object.hitTestData
            : undefined;
        const drawRendererFn = (renderer) => drawFn(renderer, target, isHovered, objecId);
        (0, draw_functions_1.drawSourcePaneViews)(paneViewsGetter, drawRendererFn, source, state);
    }
    _recreatePriceAxisWidgets() {
        if (this._state === null) {
            return;
        }
        const chart = this._chart;
        const leftAxisVisible = this._state.leftPriceScale().options().visible;
        const rightAxisVisible = this._state.rightPriceScale().options().visible;
        if (!leftAxisVisible && this._leftPriceAxisWidget !== null) {
            this._leftAxisCell.removeChild(this._leftPriceAxisWidget.getElement());
            this._leftPriceAxisWidget.destroy();
            this._leftPriceAxisWidget = null;
        }
        if (!rightAxisVisible && this._rightPriceAxisWidget !== null) {
            this._rightAxisCell.removeChild(this._rightPriceAxisWidget.getElement());
            this._rightPriceAxisWidget.destroy();
            this._rightPriceAxisWidget = null;
        }
        const rendererOptionsProvider = chart.model().rendererOptionsProvider();
        if (leftAxisVisible && this._leftPriceAxisWidget === null) {
            this._leftPriceAxisWidget = new price_axis_widget_1.PriceAxisWidget(this, chart.options(), rendererOptionsProvider, "left");
            this._leftAxisCell.appendChild(this._leftPriceAxisWidget.getElement());
        }
        if (rightAxisVisible && this._rightPriceAxisWidget === null) {
            this._rightPriceAxisWidget = new price_axis_widget_1.PriceAxisWidget(this, chart.options(), rendererOptionsProvider, "right");
            this._rightAxisCell.appendChild(this._rightPriceAxisWidget.getElement());
        }
    }
    _preventScroll(event) {
        return (event.isTouch && this._longTap) || this._startTrackPoint !== null;
    }
    _correctXCoord(x) {
        return Math.max(0, Math.min(x, this._size.width - 1));
    }
    _correctYCoord(y) {
        return Math.max(0, Math.min(y, this._size.height - 1));
    }
    _setCrosshairPosition(x, y, event) {
        this._model().setAndSaveCurrentPosition(this._correctXCoord(x), this._correctYCoord(y), event, (0, assertions_1.ensureNotNull)(this._state));
    }
    _clearCrosshairPosition() {
        this._model().clearCurrentPosition();
    }
    _tryExitTrackingMode() {
        if (this._exitTrackingModeOnNextTry) {
            this._startTrackPoint = null;
            this._clearCrosshairPosition();
        }
    }
    _startTrackingMode(startTrackPoint, crossHairPosition, event) {
        this._startTrackPoint = startTrackPoint;
        this._exitTrackingModeOnNextTry = false;
        this._setCrosshairPosition(crossHairPosition.x, crossHairPosition.y, event);
        const crosshair = this._model().crosshairSource();
        this._initCrosshairPosition = {
            x: crosshair.appliedX(),
            y: crosshair.appliedY(),
        };
    }
    _model() {
        return this._chart.model();
    }
    _endScroll(event) {
        if (!this._isScrolling) {
            return;
        }
        const model = this._model();
        const state = this.state();
        model.endScrollPrice(state, state.defaultPriceScale());
        this._startScrollingPos = null;
        this._isScrolling = false;
        model.endScrollTime();
        if (this._scrollXAnimation !== null) {
            const startAnimationTime = performance.now();
            const timeScale = model.timeScale();
            this._scrollXAnimation.start(timeScale.rightOffset(), startAnimationTime);
            if (!this._scrollXAnimation.finished(startAnimationTime)) {
                model.setTimeScaleAnimation(this._scrollXAnimation);
            }
        }
    }
    _onMouseEvent() {
        this._startTrackPoint = null;
    }
    _mouseTouchDownEvent() {
        if (!this._state) {
            return;
        }
        this._model().stopTimeScaleAnimation();
        if (document.activeElement !== document.body &&
            document.activeElement !== document.documentElement) {
            // If any focusable element except the page itself is focused, remove the focus
            (0, assertions_1.ensureNotNull)(document.activeElement).blur();
        }
        else {
            // Clear selection
            const selection = document.getSelection();
            if (selection !== null) {
                selection.removeAllRanges();
            }
        }
        const priceScale = this._state.defaultPriceScale();
        if (priceScale.isEmpty() || this._model().timeScale().isEmpty()) {
            return;
        }
    }
    // eslint-disable-next-line complexity
    _pressedMouseTouchMoveEvent(event) {
        if (this._state === null) {
            return;
        }
        const model = this._model();
        const timeScale = model.timeScale();
        if (timeScale.isEmpty()) {
            return;
        }
        const chartOptions = this._chart.options();
        const scrollOptions = chartOptions.handleScroll;
        const kineticScrollOptions = chartOptions.kineticScroll;
        if ((!scrollOptions.pressedMouseMove || event.isTouch) &&
            ((!scrollOptions.horzTouchDrag && !scrollOptions.vertTouchDrag) ||
                !event.isTouch)) {
            return;
        }
        const priceScale = this._state.defaultPriceScale();
        const now = performance.now();
        if (this._startScrollingPos === null && !this._preventScroll(event)) {
            this._startScrollingPos = {
                x: event.clientX,
                y: event.clientY,
                timestamp: now,
                localX: event.localX,
                localY: event.localY,
            };
        }
        if (this._startScrollingPos !== null &&
            !this._isScrolling &&
            (this._startScrollingPos.x !== event.clientX ||
                this._startScrollingPos.y !== event.clientY)) {
            if ((event.isTouch && kineticScrollOptions.touch) ||
                (!event.isTouch && kineticScrollOptions.mouse)) {
                const barSpacing = timeScale.barSpacing();
                this._scrollXAnimation = new kinetic_animation_1.KineticAnimation(0.2 /* KineticScrollConstants.MinScrollSpeed */ / barSpacing, 7 /* KineticScrollConstants.MaxScrollSpeed */ / barSpacing, 0.997 /* KineticScrollConstants.DumpingCoeff */, 15 /* KineticScrollConstants.ScrollMinMove */ / barSpacing);
                this._scrollXAnimation.addPosition(timeScale.rightOffset(), this._startScrollingPos.timestamp);
            }
            else {
                this._scrollXAnimation = null;
            }
            if (!priceScale.isEmpty()) {
                model.startScrollPrice(this._state, priceScale, event.localY);
            }
            model.startScrollTime(event.localX);
            this._isScrolling = true;
        }
        if (this._isScrolling) {
            // this allows scrolling not default price scales
            if (!priceScale.isEmpty()) {
                model.scrollPriceTo(this._state, priceScale, event.localY);
            }
            model.scrollTimeTo(event.localX);
            if (this._scrollXAnimation !== null) {
                this._scrollXAnimation.addPosition(timeScale.rightOffset(), now);
            }
        }
    }
}
exports.PaneWidget = PaneWidget;
