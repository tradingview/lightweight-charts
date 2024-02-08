import { equalSizes, size, tryCreateCanvasRenderingTarget2D, } from "fancy-canvas";
import { ensureNotNull } from "../helpers/assertions";
import { clearRect, clearRectWithGradient } from "../helpers/canvas-helpers";
import { Delegate } from "../helpers/delegate";
import { KineticAnimation } from "../model/kinetic-animation";
import { createBoundCanvas, releaseCanvas } from "./canvas-utils";
import { drawBackground, drawForeground, drawSourcePaneViews, } from "./draw-functions";
import { MouseEventHandler, } from "./mouse-event-handler";
import { hitTestPane } from "./pane-hit-test";
import { PriceAxisWidget } from "./price-axis-widget";
;
function sourceBottomPaneViews(source, pane) {
    var _a, _b;
    return (_b = (_a = source._internal_bottomPaneViews) === null || _a === void 0 ? void 0 : _a.call(source, pane)) !== null && _b !== void 0 ? _b : [];
}
function sourcePaneViews(source, pane) {
    var _a, _b;
    return (_b = (_a = source._internal_paneViews) === null || _a === void 0 ? void 0 : _a.call(source, pane)) !== null && _b !== void 0 ? _b : [];
}
function sourceLabelPaneViews(source, pane) {
    var _a, _b;
    return (_b = (_a = source._internal_labelPaneViews) === null || _a === void 0 ? void 0 : _a.call(source, pane)) !== null && _b !== void 0 ? _b : [];
}
function sourceTopPaneViews(source, pane) {
    var _a, _b;
    return (_b = (_a = source._internal_topPaneViews) === null || _a === void 0 ? void 0 : _a.call(source, pane)) !== null && _b !== void 0 ? _b : [];
}
export class PaneWidget {
    constructor(chart, state) {
        this._private__size = size({ width: 0, height: 0 });
        this._private__leftPriceAxisWidget = null;
        this._private__rightPriceAxisWidget = null;
        this._private__startScrollingPos = null;
        this._private__isScrolling = false;
        this._private__clicked = new Delegate();
        this._private__dblClicked = new Delegate();
        this._private__prevPinchScale = 0;
        this._private__longTap = false;
        this._private__startTrackPoint = null;
        this._private__exitTrackingModeOnNextTry = false;
        this._private__initCrosshairPosition = null;
        this._private__scrollXAnimation = null;
        this._private__isSettingSize = false;
        this._private__canvasSuggestedBitmapSizeChangedHandler = () => {
            if (this._private__isSettingSize || this._private__state === null) {
                return;
            }
            this._private__model()._internal_lightUpdate();
        };
        this._private__topCanvasSuggestedBitmapSizeChangedHandler = () => {
            if (this._private__isSettingSize || this._private__state === null) {
                return;
            }
            this._private__model()._internal_lightUpdate();
        };
        this._private__chart = chart;
        this._private__state = state;
        this._private__state._internal_onDestroyed()._internal_subscribe(this._private__onStateDestroyed.bind(this), this, true);
        this._private__paneCell = document.createElement("td");
        this._private__paneCell.style.padding = "0";
        this._private__paneCell.style.position = "relative";
        const paneWrapper = document.createElement("div");
        paneWrapper.style.width = "100%";
        paneWrapper.style.height = "100%";
        paneWrapper.style.position = "static";
        paneWrapper.style.overflow = "hidden";
        this._private__leftAxisCell = document.createElement("td");
        this._private__leftAxisCell.style.padding = "0";
        this._private__rightAxisCell = document.createElement("td");
        this._private__rightAxisCell.style.padding = "0";
        this._private__paneCell.appendChild(paneWrapper);
        this._private__canvasBinding = createBoundCanvas(paneWrapper, size({ width: 16, height: 16 }));
        this._private__canvasBinding.subscribeSuggestedBitmapSizeChanged(this._private__canvasSuggestedBitmapSizeChangedHandler);
        const canvas = this._private__canvasBinding.canvasElement;
        canvas.style.position = "absolute";
        canvas.style.zIndex = "1";
        canvas.style.left = "0";
        canvas.style.top = "0";
        this._private__topCanvasBinding = createBoundCanvas(paneWrapper, size({ width: 16, height: 16 }));
        this._private__topCanvasBinding.subscribeSuggestedBitmapSizeChanged(this._private__topCanvasSuggestedBitmapSizeChangedHandler);
        const topCanvas = this._private__topCanvasBinding.canvasElement;
        topCanvas.style.position = "absolute";
        topCanvas.style.zIndex = "2";
        topCanvas.style.left = "0";
        topCanvas.style.top = "0";
        this._private__rowElement = document.createElement("tr");
        this._private__rowElement.appendChild(this._private__leftAxisCell);
        this._private__rowElement.appendChild(this._private__paneCell);
        this._private__rowElement.appendChild(this._private__rightAxisCell);
        this._internal_updatePriceAxisWidgetsStates();
        this._private__mouseEventHandler = new MouseEventHandler(this._private__topCanvasBinding.canvasElement, this, {
            _internal_treatVertTouchDragAsPageScroll: () => this._private__startTrackPoint === null &&
                !this._private__chart._internal_options().handleScroll.vertTouchDrag,
            _internal_treatHorzTouchDragAsPageScroll: () => this._private__startTrackPoint === null &&
                !this._private__chart._internal_options().handleScroll.horzTouchDrag,
        });
    }
    _internal_destroy() {
        if (this._private__leftPriceAxisWidget !== null) {
            this._private__leftPriceAxisWidget._internal_destroy();
        }
        if (this._private__rightPriceAxisWidget !== null) {
            this._private__rightPriceAxisWidget._internal_destroy();
        }
        this._private__topCanvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._private__topCanvasSuggestedBitmapSizeChangedHandler);
        releaseCanvas(this._private__topCanvasBinding.canvasElement);
        this._private__topCanvasBinding.dispose();
        this._private__canvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._private__canvasSuggestedBitmapSizeChangedHandler);
        releaseCanvas(this._private__canvasBinding.canvasElement);
        this._private__canvasBinding.dispose();
        if (this._private__state !== null) {
            this._private__state._internal_onDestroyed()._internal_unsubscribeAll(this);
        }
        this._private__mouseEventHandler._internal_destroy();
    }
    _internal_state() {
        return ensureNotNull(this._private__state);
    }
    _internal_setState(pane) {
        if (this._private__state !== null) {
            this._private__state._internal_onDestroyed()._internal_unsubscribeAll(this);
        }
        this._private__state = pane;
        if (this._private__state !== null) {
            this._private__state._internal_onDestroyed()._internal_subscribe(PaneWidget.prototype._private__onStateDestroyed.bind(this), this, true);
        }
        this._internal_updatePriceAxisWidgetsStates();
    }
    _internal_chart() {
        return this._private__chart;
    }
    _internal_getElement() {
        return this._private__rowElement;
    }
    _internal_updatePriceAxisWidgetsStates() {
        if (this._private__state === null) {
            return;
        }
        this._private__recreatePriceAxisWidgets();
        if (this._private__model()._internal_serieses().length === 0) {
            return;
        }
        if (this._private__leftPriceAxisWidget !== null) {
            const leftPriceScale = this._private__state._internal_leftPriceScale();
            this._private__leftPriceAxisWidget._internal_setPriceScale(ensureNotNull(leftPriceScale));
        }
        if (this._private__rightPriceAxisWidget !== null) {
            const rightPriceScale = this._private__state._internal_rightPriceScale();
            this._private__rightPriceAxisWidget._internal_setPriceScale(ensureNotNull(rightPriceScale));
        }
    }
    _internal_updatePriceAxisWidgets() {
        if (this._private__leftPriceAxisWidget !== null) {
            this._private__leftPriceAxisWidget._internal_update();
        }
        if (this._private__rightPriceAxisWidget !== null) {
            this._private__rightPriceAxisWidget._internal_update();
        }
    }
    _internal_stretchFactor() {
        return this._private__state !== null ? this._private__state._internal_stretchFactor() : 0;
    }
    _internal_setStretchFactor(stretchFactor) {
        if (this._private__state) {
            this._private__state._internal_setStretchFactor(stretchFactor);
        }
    }
    _internal_mouseEnterEvent(event) {
        if (!this._private__state) {
            return;
        }
        this._private__onMouseEvent();
        const x = event.localX;
        const y = event.localY;
        this._private__setCrosshairPosition(x, y, event);
    }
    _internal_mouseDownEvent(event) {
        this._private__onMouseEvent();
        this._private__mouseTouchDownEvent();
        this._private__setCrosshairPosition(event.localX, event.localY, event);
    }
    _internal_mouseMoveEvent(event) {
        var _a;
        if (!this._private__state) {
            return;
        }
        this._private__onMouseEvent();
        const x = event.localX;
        const y = event.localY;
        this._private__setCrosshairPosition(x, y, event);
        const hitTest = this._internal_hitTest(x, y);
        this._private__chart._internal_setCursorStyle((_a = hitTest === null || hitTest === void 0 ? void 0 : hitTest._internal_cursorStyle) !== null && _a !== void 0 ? _a : null);
        this._private__model()._internal_setHoveredSource(hitTest && { _internal_source: hitTest._internal_source, _internal_object: hitTest._internal_object });
    }
    _internal_mouseClickEvent(event) {
        if (this._private__state === null) {
            return;
        }
        this._private__onMouseEvent();
        this._private__fireClickedDelegate(event);
    }
    _internal_mouseDoubleClickEvent(event) {
        if (this._private__state === null) {
            return;
        }
        this._private__fireMouseClickDelegate(this._private__dblClicked, event);
    }
    _internal_doubleTapEvent(event) {
        this._internal_mouseDoubleClickEvent(event);
    }
    _internal_pressedMouseMoveEvent(event) {
        this._private__onMouseEvent();
        this._private__pressedMouseTouchMoveEvent(event);
        this._private__setCrosshairPosition(event.localX, event.localY, event);
    }
    _internal_mouseUpEvent(event) {
        if (this._private__state === null) {
            return;
        }
        this._private__onMouseEvent();
        this._private__longTap = false;
        this._private__endScroll(event);
    }
    _internal_tapEvent(event) {
        if (this._private__state === null) {
            return;
        }
        this._private__fireClickedDelegate(event);
    }
    _internal_longTapEvent(event) {
        this._private__longTap = true;
        if (this._private__startTrackPoint === null) {
            const point = { x: event.localX, y: event.localY };
            this._private__startTrackingMode(point, point, event);
        }
    }
    _internal_mouseLeaveEvent(event) {
        if (this._private__state === null) {
            return;
        }
        this._private__onMouseEvent();
        this._private__state._internal_model()._internal_setHoveredSource(null);
        this._private__clearCrosshairPosition();
    }
    _internal_clicked() {
        return this._private__clicked;
    }
    _internal_dblClicked() {
        return this._private__dblClicked;
    }
    _internal_pinchStartEvent() {
        this._private__prevPinchScale = 1;
        this._private__model()._internal_stopTimeScaleAnimation();
    }
    _internal_pinchEvent(middlePoint, scale) {
        if (!this._private__chart._internal_options().handleScale.pinch) {
            return;
        }
        const zoomScale = (scale - this._private__prevPinchScale) * 5;
        this._private__prevPinchScale = scale;
        this._private__model()._internal_zoomTime(middlePoint._internal_x, zoomScale);
    }
    _internal_touchStartEvent(event) {
        this._private__longTap = false;
        this._private__exitTrackingModeOnNextTry = this._private__startTrackPoint !== null;
        this._private__mouseTouchDownEvent();
        const crosshair = this._private__model()._internal_crosshairSource();
        if (this._private__startTrackPoint !== null && crosshair._internal_visible()) {
            this._private__initCrosshairPosition = {
                x: crosshair._internal_appliedX(),
                y: crosshair._internal_appliedY(),
            };
            this._private__startTrackPoint = { x: event.localX, y: event.localY };
        }
    }
    _internal_touchMoveEvent(event) {
        if (this._private__state === null) {
            return;
        }
        const x = event.localX;
        const y = event.localY;
        if (this._private__startTrackPoint !== null) {
            // tracking mode: move crosshair
            this._private__exitTrackingModeOnNextTry = false;
            const origPoint = ensureNotNull(this._private__initCrosshairPosition);
            const newX = (origPoint.x + (x - this._private__startTrackPoint.x));
            const newY = (origPoint.y + (y - this._private__startTrackPoint.y));
            this._private__setCrosshairPosition(newX, newY, event);
            return;
        }
        this._private__pressedMouseTouchMoveEvent(event);
    }
    _internal_touchEndEvent(event) {
        if (this._internal_chart()._internal_options().trackingMode.exitMode ===
            0 /* TrackingModeExitMode.OnTouchEnd */) {
            this._private__exitTrackingModeOnNextTry = true;
        }
        this._private__tryExitTrackingMode();
        this._private__endScroll(event);
    }
    _internal_hitTest(x, y) {
        const state = this._private__state;
        if (state === null) {
            return null;
        }
        return hitTestPane(state, x, y);
    }
    _internal_setPriceAxisSize(width, position) {
        const priceAxisWidget = position === "left"
            ? this._private__leftPriceAxisWidget
            : this._private__rightPriceAxisWidget;
        ensureNotNull(priceAxisWidget)._internal_setSize(size({ width, height: this._private__size.height }));
    }
    _internal_getSize() {
        return this._private__size;
    }
    _internal_setSize(newSize) {
        if (equalSizes(this._private__size, newSize)) {
            return;
        }
        this._private__size = newSize;
        this._private__isSettingSize = true;
        this._private__canvasBinding.resizeCanvasElement(newSize);
        this._private__topCanvasBinding.resizeCanvasElement(newSize);
        this._private__isSettingSize = false;
        this._private__paneCell.style.width = newSize.width + "px";
        this._private__paneCell.style.height = newSize.height + "px";
    }
    _internal_recalculatePriceScales() {
        const pane = ensureNotNull(this._private__state);
        pane._internal_recalculatePriceScale(pane._internal_leftPriceScale());
        pane._internal_recalculatePriceScale(pane._internal_rightPriceScale());
        for (const source of pane._internal_dataSources()) {
            if (pane._internal_isOverlay(source)) {
                const priceScale = source._internal_priceScale();
                if (priceScale !== null) {
                    pane._internal_recalculatePriceScale(priceScale);
                }
                // for overlay drawings price scale is owner's price scale
                // however owner's price scale could not contain ds
                source._internal_updateAllViews();
            }
        }
    }
    _internal_getBitmapSize() {
        return this._private__canvasBinding.bitmapSize;
    }
    _internal_drawBitmap(ctx, x, y) {
        const bitmapSize = this._internal_getBitmapSize();
        if (bitmapSize.width > 0 && bitmapSize.height > 0) {
            ctx.drawImage(this._private__canvasBinding.canvasElement, x, y);
        }
    }
    _internal_paint(type) {
        if (type === 0 /* InvalidationLevel.None */) {
            return;
        }
        if (this._private__state === null) {
            return;
        }
        if (type > 1 /* InvalidationLevel.Cursor */) {
            this._internal_recalculatePriceScales();
        }
        if (this._private__leftPriceAxisWidget !== null) {
            this._private__leftPriceAxisWidget._internal_paint(type);
        }
        if (this._private__rightPriceAxisWidget !== null) {
            this._private__rightPriceAxisWidget._internal_paint(type);
        }
        if (type !== 1 /* InvalidationLevel.Cursor */) {
            this._private__canvasBinding.applySuggestedBitmapSize();
            const target = tryCreateCanvasRenderingTarget2D(this._private__canvasBinding);
            if (target !== null) {
                target.useBitmapCoordinateSpace((scope) => {
                    this._private__drawBackground(scope);
                });
                if (this._private__state) {
                    this._private__drawSources(target, sourceBottomPaneViews);
                    this._private__drawGrid(target);
                    this._private__drawWatermark(target);
                    this._private__drawSources(target, sourcePaneViews);
                    this._private__drawSources(target, sourceLabelPaneViews);
                }
            }
        }
        this._private__topCanvasBinding.applySuggestedBitmapSize();
        const topTarget = tryCreateCanvasRenderingTarget2D(this._private__topCanvasBinding);
        if (topTarget !== null) {
            topTarget.useBitmapCoordinateSpace(({ context: ctx, bitmapSize }) => {
                ctx.clearRect(0, 0, bitmapSize.width, bitmapSize.height);
            });
            this._private__drawCrosshair(topTarget);
            this._private__drawSources(topTarget, sourceTopPaneViews);
        }
    }
    _internal_leftPriceAxisWidget() {
        return this._private__leftPriceAxisWidget;
    }
    _internal_rightPriceAxisWidget() {
        return this._private__rightPriceAxisWidget;
    }
    _internal_drawAdditionalSources(target, paneViewsGetter) {
        this._private__drawSources(target, paneViewsGetter);
    }
    _private__onStateDestroyed() {
        if (this._private__state !== null) {
            this._private__state._internal_onDestroyed()._internal_unsubscribeAll(this);
        }
        this._private__state = null;
    }
    _private__fireClickedDelegate(event) {
        this._private__fireMouseClickDelegate(this._private__clicked, event);
    }
    _private__fireMouseClickDelegate(delegate, event) {
        const x = event.localX;
        const y = event.localY;
        if (delegate._internal_hasListeners()) {
            delegate._internal_fire(this._private__model()._internal_timeScale()._internal_coordinateToIndex(x), { x, y }, event);
        }
    }
    _private__drawBackground({ context: ctx, bitmapSize, }) {
        const { width, height } = bitmapSize;
        const model = this._private__model();
        const topColor = model._internal_backgroundTopColor();
        const bottomColor = model._internal_backgroundBottomColor();
        if (topColor === bottomColor) {
            clearRect(ctx, 0, 0, width, height, bottomColor);
        }
        else {
            clearRectWithGradient(ctx, 0, 0, width, height, topColor, bottomColor);
        }
    }
    _private__drawGrid(target) {
        const state = ensureNotNull(this._private__state);
        const paneView = state._internal_grid()._internal_paneView();
        const renderer = paneView._internal_renderer();
        if (renderer !== null) {
            renderer._internal_draw(target, false);
        }
    }
    _private__drawWatermark(target) {
        const source = this._private__model()._internal_watermarkSource();
        this._private__drawSourceImpl(target, sourcePaneViews, drawBackground, source);
        this._private__drawSourceImpl(target, sourcePaneViews, drawForeground, source);
    }
    _private__drawCrosshair(target) {
        this._private__drawSourceImpl(target, sourcePaneViews, drawForeground, this._private__model()._internal_crosshairSource());
    }
    _private__drawSources(target, paneViewsGetter) {
        const state = ensureNotNull(this._private__state);
        const sources = state._internal_orderedSources();
        for (const source of sources) {
            this._private__drawSourceImpl(target, paneViewsGetter, drawBackground, source);
        }
        for (const source of sources) {
            this._private__drawSourceImpl(target, paneViewsGetter, drawForeground, source);
        }
    }
    _private__drawSourceImpl(target, paneViewsGetter, drawFn, source) {
        const state = ensureNotNull(this._private__state);
        const hoveredSource = state._internal_model()._internal_hoveredSource();
        const isHovered = hoveredSource !== null && hoveredSource._internal_source === source;
        const objecId = hoveredSource !== null && isHovered && hoveredSource._internal_object !== undefined
            ? hoveredSource._internal_object._internal_hitTestData
            : undefined;
        const drawRendererFn = (renderer) => drawFn(renderer, target, isHovered, objecId);
        drawSourcePaneViews(paneViewsGetter, drawRendererFn, source, state);
    }
    _private__recreatePriceAxisWidgets() {
        if (this._private__state === null) {
            return;
        }
        const chart = this._private__chart;
        const leftAxisVisible = this._private__state._internal_leftPriceScale()._internal_options().visible;
        const rightAxisVisible = this._private__state._internal_rightPriceScale()._internal_options().visible;
        if (!leftAxisVisible && this._private__leftPriceAxisWidget !== null) {
            this._private__leftAxisCell.removeChild(this._private__leftPriceAxisWidget._internal_getElement());
            this._private__leftPriceAxisWidget._internal_destroy();
            this._private__leftPriceAxisWidget = null;
        }
        if (!rightAxisVisible && this._private__rightPriceAxisWidget !== null) {
            this._private__rightAxisCell.removeChild(this._private__rightPriceAxisWidget._internal_getElement());
            this._private__rightPriceAxisWidget._internal_destroy();
            this._private__rightPriceAxisWidget = null;
        }
        const rendererOptionsProvider = chart._internal_model()._internal_rendererOptionsProvider();
        if (leftAxisVisible && this._private__leftPriceAxisWidget === null) {
            this._private__leftPriceAxisWidget = new PriceAxisWidget(this, chart._internal_options(), rendererOptionsProvider, "left");
            this._private__leftAxisCell.appendChild(this._private__leftPriceAxisWidget._internal_getElement());
        }
        if (rightAxisVisible && this._private__rightPriceAxisWidget === null) {
            this._private__rightPriceAxisWidget = new PriceAxisWidget(this, chart._internal_options(), rendererOptionsProvider, "right");
            this._private__rightAxisCell.appendChild(this._private__rightPriceAxisWidget._internal_getElement());
        }
    }
    _private__preventScroll(event) {
        return (event._internal_isTouch && this._private__longTap) || this._private__startTrackPoint !== null;
    }
    _private__correctXCoord(x) {
        return Math.max(0, Math.min(x, this._private__size.width - 1));
    }
    _private__correctYCoord(y) {
        return Math.max(0, Math.min(y, this._private__size.height - 1));
    }
    _private__setCrosshairPosition(x, y, event) {
        this._private__model()._internal_setAndSaveCurrentPosition(this._private__correctXCoord(x), this._private__correctYCoord(y), event, ensureNotNull(this._private__state));
    }
    _private__clearCrosshairPosition() {
        this._private__model()._internal_clearCurrentPosition();
    }
    _private__tryExitTrackingMode() {
        if (this._private__exitTrackingModeOnNextTry) {
            this._private__startTrackPoint = null;
            this._private__clearCrosshairPosition();
        }
    }
    _private__startTrackingMode(startTrackPoint, crossHairPosition, event) {
        this._private__startTrackPoint = startTrackPoint;
        this._private__exitTrackingModeOnNextTry = false;
        this._private__setCrosshairPosition(crossHairPosition.x, crossHairPosition.y, event);
        const crosshair = this._private__model()._internal_crosshairSource();
        this._private__initCrosshairPosition = {
            x: crosshair._internal_appliedX(),
            y: crosshair._internal_appliedY(),
        };
    }
    _private__model() {
        return this._private__chart._internal_model();
    }
    _private__endScroll(event) {
        if (!this._private__isScrolling) {
            return;
        }
        const model = this._private__model();
        const state = this._internal_state();
        model._internal_endScrollPrice(state, state._internal_defaultPriceScale());
        this._private__startScrollingPos = null;
        this._private__isScrolling = false;
        model._internal_endScrollTime();
        if (this._private__scrollXAnimation !== null) {
            const startAnimationTime = performance.now();
            const timeScale = model._internal_timeScale();
            this._private__scrollXAnimation._internal_start(timeScale._internal_rightOffset(), startAnimationTime);
            if (!this._private__scrollXAnimation._internal_finished(startAnimationTime)) {
                model._internal_setTimeScaleAnimation(this._private__scrollXAnimation);
            }
        }
    }
    _private__onMouseEvent() {
        this._private__startTrackPoint = null;
    }
    _private__mouseTouchDownEvent() {
        if (!this._private__state) {
            return;
        }
        this._private__model()._internal_stopTimeScaleAnimation();
        if (document.activeElement !== document.body &&
            document.activeElement !== document.documentElement) {
            // If any focusable element except the page itself is focused, remove the focus
            ensureNotNull(document.activeElement).blur();
        }
        else {
            // Clear selection
            const selection = document.getSelection();
            if (selection !== null) {
                selection.removeAllRanges();
            }
        }
        const priceScale = this._private__state._internal_defaultPriceScale();
        if (priceScale._internal_isEmpty() || this._private__model()._internal_timeScale()._internal_isEmpty()) {
            return;
        }
    }
    // eslint-disable-next-line complexity
    _private__pressedMouseTouchMoveEvent(event) {
        if (this._private__state === null) {
            return;
        }
        const model = this._private__model();
        const timeScale = model._internal_timeScale();
        if (timeScale._internal_isEmpty()) {
            return;
        }
        const chartOptions = this._private__chart._internal_options();
        const scrollOptions = chartOptions.handleScroll;
        const kineticScrollOptions = chartOptions.kineticScroll;
        if ((!scrollOptions.pressedMouseMove || event._internal_isTouch) &&
            ((!scrollOptions.horzTouchDrag && !scrollOptions.vertTouchDrag) ||
                !event._internal_isTouch)) {
            return;
        }
        const priceScale = this._private__state._internal_defaultPriceScale();
        const now = performance.now();
        if (this._private__startScrollingPos === null && !this._private__preventScroll(event)) {
            this._private__startScrollingPos = {
                x: event.clientX,
                y: event.clientY,
                _internal_timestamp: now,
                _internal_localX: event.localX,
                _internal_localY: event.localY,
            };
        }
        if (this._private__startScrollingPos !== null &&
            !this._private__isScrolling &&
            (this._private__startScrollingPos.x !== event.clientX ||
                this._private__startScrollingPos.y !== event.clientY)) {
            if ((event._internal_isTouch && kineticScrollOptions.touch) ||
                (!event._internal_isTouch && kineticScrollOptions.mouse)) {
                const barSpacing = timeScale._internal_barSpacing();
                this._private__scrollXAnimation = new KineticAnimation(0.2 /* KineticScrollConstants.MinScrollSpeed */ / barSpacing, 7 /* KineticScrollConstants.MaxScrollSpeed */ / barSpacing, 0.997 /* KineticScrollConstants.DumpingCoeff */, 15 /* KineticScrollConstants.ScrollMinMove */ / barSpacing);
                this._private__scrollXAnimation._internal_addPosition(timeScale._internal_rightOffset(), this._private__startScrollingPos._internal_timestamp);
            }
            else {
                this._private__scrollXAnimation = null;
            }
            if (!priceScale._internal_isEmpty()) {
                model._internal_startScrollPrice(this._private__state, priceScale, event.localY);
            }
            model._internal_startScrollTime(event.localX);
            this._private__isScrolling = true;
        }
        if (this._private__isScrolling) {
            // this allows scrolling not default price scales
            if (!priceScale._internal_isEmpty()) {
                model._internal_scrollPriceTo(this._private__state, priceScale, event.localY);
            }
            model._internal_scrollTimeTo(event.localX);
            if (this._private__scrollXAnimation !== null) {
                this._private__scrollXAnimation._internal_addPosition(timeScale._internal_rightOffset(), now);
            }
        }
    }
}
