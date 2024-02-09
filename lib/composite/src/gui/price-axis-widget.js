"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceAxisWidget = void 0;
const fancy_canvas_1 = require("fancy-canvas");
const assertions_1 = require("../helpers/assertions");
const canvas_helpers_1 = require("../helpers/canvas-helpers");
const make_font_1 = require("../helpers/make-font");
const text_width_cache_1 = require("../model/text-width-cache");
const canvas_utils_1 = require("./canvas-utils");
const internal_layout_sizes_hints_1 = require("./internal-layout-sizes-hints");
const mouse_event_handler_1 = require("./mouse-event-handler");
var CursorType;
(function (CursorType) {
    CursorType[CursorType["Default"] = 0] = "Default";
    CursorType[CursorType["NsResize"] = 1] = "NsResize";
})(CursorType || (CursorType = {}));
var Constants;
(function (Constants) {
    Constants[Constants["DefaultOptimalWidth"] = 34] = "DefaultOptimalWidth";
})(Constants || (Constants = {}));
(function (Constants) {
    Constants[Constants["LabelOffset"] = 5] = "LabelOffset";
})(Constants || (Constants = {}));
function buildPriceAxisViewsGetter(zOrder, priceScaleId) {
    return (source) => {
        var _a, _b, _c, _d;
        const psId = (_b = (_a = source.priceScale()) === null || _a === void 0 ? void 0 : _a.id()) !== null && _b !== void 0 ? _b : '';
        if (psId !== priceScaleId) {
            // exclude if source is using a different price scale.
            return [];
        }
        return (_d = (_c = source.pricePaneViews) === null || _c === void 0 ? void 0 : _c.call(source, zOrder)) !== null && _d !== void 0 ? _d : [];
    };
}
class PriceAxisWidget {
    constructor(pane, options, rendererOptionsProvider, side) {
        this._priceScale = null;
        this._size = null;
        this._mousedown = false;
        this._widthCache = new text_width_cache_1.TextWidthCache(200);
        this._font = null;
        this._prevOptimalWidth = 0;
        this._isSettingSize = false;
        this._canvasSuggestedBitmapSizeChangedHandler = () => {
            if (this._isSettingSize) {
                return;
            }
            this._pane.chart().model().lightUpdate();
        };
        this._topCanvasSuggestedBitmapSizeChangedHandler = () => {
            if (this._isSettingSize) {
                return;
            }
            this._pane.chart().model().lightUpdate();
        };
        this._pane = pane;
        this._options = options;
        this._layoutOptions = options.layout;
        this._rendererOptionsProvider = rendererOptionsProvider;
        this._isLeft = side === 'left';
        this._sourcePaneViews = buildPriceAxisViewsGetter('normal', side);
        this._sourceTopPaneViews = buildPriceAxisViewsGetter('top', side);
        this._sourceBottomPaneViews = buildPriceAxisViewsGetter('bottom', side);
        this._cell = document.createElement('div');
        this._cell.style.height = '100%';
        this._cell.style.overflow = 'hidden';
        this._cell.style.width = '25px';
        this._cell.style.left = '0';
        this._cell.style.position = 'relative';
        this._canvasBinding = (0, canvas_utils_1.createBoundCanvas)(this._cell, (0, fancy_canvas_1.size)({ width: 16, height: 16 }));
        this._canvasBinding.subscribeSuggestedBitmapSizeChanged(this._canvasSuggestedBitmapSizeChangedHandler);
        const canvas = this._canvasBinding.canvasElement;
        canvas.style.position = 'absolute';
        canvas.style.zIndex = '1';
        canvas.style.left = '0';
        canvas.style.top = '0';
        this._topCanvasBinding = (0, canvas_utils_1.createBoundCanvas)(this._cell, (0, fancy_canvas_1.size)({ width: 16, height: 16 }));
        this._topCanvasBinding.subscribeSuggestedBitmapSizeChanged(this._topCanvasSuggestedBitmapSizeChangedHandler);
        const topCanvas = this._topCanvasBinding.canvasElement;
        topCanvas.style.position = 'absolute';
        topCanvas.style.zIndex = '2';
        topCanvas.style.left = '0';
        topCanvas.style.top = '0';
        const handler = {
            mouseDownEvent: this._mouseDownEvent.bind(this),
            touchStartEvent: this._mouseDownEvent.bind(this),
            pressedMouseMoveEvent: this._pressedMouseMoveEvent.bind(this),
            touchMoveEvent: this._pressedMouseMoveEvent.bind(this),
            mouseDownOutsideEvent: this._mouseDownOutsideEvent.bind(this),
            mouseUpEvent: this._mouseUpEvent.bind(this),
            touchEndEvent: this._mouseUpEvent.bind(this),
            mouseDoubleClickEvent: this._mouseDoubleClickEvent.bind(this),
            doubleTapEvent: this._mouseDoubleClickEvent.bind(this),
            mouseEnterEvent: this._mouseEnterEvent.bind(this),
            mouseLeaveEvent: this._mouseLeaveEvent.bind(this),
        };
        this._mouseEventHandler = new mouse_event_handler_1.MouseEventHandler(this._topCanvasBinding.canvasElement, handler, {
            treatVertTouchDragAsPageScroll: () => !this._options.handleScroll.vertTouchDrag,
            treatHorzTouchDragAsPageScroll: () => true,
        });
    }
    destroy() {
        this._mouseEventHandler.destroy();
        this._topCanvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._topCanvasSuggestedBitmapSizeChangedHandler);
        (0, canvas_utils_1.releaseCanvas)(this._topCanvasBinding.canvasElement);
        this._topCanvasBinding.dispose();
        this._canvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._canvasSuggestedBitmapSizeChangedHandler);
        (0, canvas_utils_1.releaseCanvas)(this._canvasBinding.canvasElement);
        this._canvasBinding.dispose();
        if (this._priceScale !== null) {
            this._priceScale.onMarksChanged().unsubscribeAll(this);
        }
        this._priceScale = null;
    }
    getElement() {
        return this._cell;
    }
    fontSize() {
        return this._layoutOptions.fontSize;
    }
    rendererOptions() {
        const options = this._rendererOptionsProvider.options();
        const isFontChanged = this._font !== options.font;
        if (isFontChanged) {
            this._widthCache.reset();
            this._font = options.font;
        }
        return options;
    }
    optimalWidth() {
        if (this._priceScale === null) {
            return 0;
        }
        let tickMarkMaxWidth = 0;
        const rendererOptions = this.rendererOptions();
        const ctx = (0, assertions_1.ensureNotNull)(this._canvasBinding.canvasElement.getContext('2d'));
        ctx.save();
        const tickMarks = this._priceScale.marks();
        ctx.font = this._baseFont();
        if (tickMarks.length > 0) {
            tickMarkMaxWidth = Math.max(this._widthCache.measureText(ctx, tickMarks[0].label), this._widthCache.measureText(ctx, tickMarks[tickMarks.length - 1].label));
        }
        const views = this._backLabels();
        for (let j = views.length; j--;) {
            const width = this._widthCache.measureText(ctx, views[j].text());
            if (width > tickMarkMaxWidth) {
                tickMarkMaxWidth = width;
            }
        }
        const firstValue = this._priceScale.firstValue();
        if (firstValue !== null && this._size !== null) {
            const topValue = this._priceScale.coordinateToPrice(1, firstValue);
            const bottomValue = this._priceScale.coordinateToPrice(this._size.height - 2, firstValue);
            tickMarkMaxWidth = Math.max(tickMarkMaxWidth, this._widthCache.measureText(ctx, this._priceScale.formatPrice(Math.floor(Math.min(topValue, bottomValue)) + 0.11111111111111, firstValue)), this._widthCache.measureText(ctx, this._priceScale.formatPrice(Math.ceil(Math.max(topValue, bottomValue)) - 0.11111111111111, firstValue)));
        }
        ctx.restore();
        const resultTickMarksMaxWidth = tickMarkMaxWidth || 34 /* Constants.DefaultOptimalWidth */;
        const res = Math.ceil(rendererOptions.borderSize +
            rendererOptions.tickLength +
            rendererOptions.paddingInner +
            rendererOptions.paddingOuter +
            5 /* Constants.LabelOffset */ +
            resultTickMarksMaxWidth);
        // make it even, remove this after migration to perfect fancy canvas
        return (0, internal_layout_sizes_hints_1.suggestPriceScaleWidth)(res);
    }
    setSize(newSize) {
        if (this._size === null || !(0, fancy_canvas_1.equalSizes)(this._size, newSize)) {
            this._size = newSize;
            this._isSettingSize = true;
            this._canvasBinding.resizeCanvasElement(newSize);
            this._topCanvasBinding.resizeCanvasElement(newSize);
            this._isSettingSize = false;
            this._cell.style.width = `${newSize.width}px`;
            this._cell.style.height = `${newSize.height}px`;
        }
    }
    getWidth() {
        return (0, assertions_1.ensureNotNull)(this._size).width;
    }
    setPriceScale(priceScale) {
        if (this._priceScale === priceScale) {
            return;
        }
        if (this._priceScale !== null) {
            this._priceScale.onMarksChanged().unsubscribeAll(this);
        }
        this._priceScale = priceScale;
        priceScale.onMarksChanged().subscribe(this._onMarksChanged.bind(this), this);
    }
    priceScale() {
        return this._priceScale;
    }
    reset() {
        const pane = this._pane.state();
        const model = this._pane.chart().model();
        model.resetPriceScale(pane, (0, assertions_1.ensureNotNull)(this.priceScale()));
    }
    paint(type) {
        if (this._size === null) {
            return;
        }
        if (type !== 1 /* InvalidationLevel.Cursor */) {
            this._alignLabels();
            this._canvasBinding.applySuggestedBitmapSize();
            const target = (0, fancy_canvas_1.tryCreateCanvasRenderingTarget2D)(this._canvasBinding);
            if (target !== null) {
                target.useBitmapCoordinateSpace((scope) => {
                    this._drawBackground(scope);
                    this._drawBorder(scope);
                });
                this._pane.drawAdditionalSources(target, this._sourceBottomPaneViews);
                this._drawTickMarks(target);
                this._pane.drawAdditionalSources(target, this._sourcePaneViews);
                this._drawBackLabels(target);
            }
        }
        this._topCanvasBinding.applySuggestedBitmapSize();
        const topTarget = (0, fancy_canvas_1.tryCreateCanvasRenderingTarget2D)(this._topCanvasBinding);
        if (topTarget !== null) {
            topTarget.useBitmapCoordinateSpace(({ context: ctx, bitmapSize }) => {
                ctx.clearRect(0, 0, bitmapSize.width, bitmapSize.height);
            });
            this._drawCrosshairLabel(topTarget);
            this._pane.drawAdditionalSources(topTarget, this._sourceTopPaneViews);
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
    update() {
        var _a;
        // this call has side-effect - it regenerates marks on the price scale
        (_a = this._priceScale) === null || _a === void 0 ? void 0 : _a.marks();
    }
    _mouseDownEvent(e) {
        if (this._priceScale === null || this._priceScale.isEmpty() || !this._options.handleScale.axisPressedMouseMove.price) {
            return;
        }
        const model = this._pane.chart().model();
        const pane = this._pane.state();
        this._mousedown = true;
        model.startScalePrice(pane, this._priceScale, e.localY);
    }
    _pressedMouseMoveEvent(e) {
        if (this._priceScale === null || !this._options.handleScale.axisPressedMouseMove.price) {
            return;
        }
        const model = this._pane.chart().model();
        const pane = this._pane.state();
        const priceScale = this._priceScale;
        model.scalePriceTo(pane, priceScale, e.localY);
    }
    _mouseDownOutsideEvent() {
        if (this._priceScale === null || !this._options.handleScale.axisPressedMouseMove.price) {
            return;
        }
        const model = this._pane.chart().model();
        const pane = this._pane.state();
        const priceScale = this._priceScale;
        if (this._mousedown) {
            this._mousedown = false;
            model.endScalePrice(pane, priceScale);
        }
    }
    _mouseUpEvent(e) {
        if (this._priceScale === null || !this._options.handleScale.axisPressedMouseMove.price) {
            return;
        }
        const model = this._pane.chart().model();
        const pane = this._pane.state();
        this._mousedown = false;
        model.endScalePrice(pane, this._priceScale);
    }
    _mouseDoubleClickEvent(e) {
        if (this._options.handleScale.axisDoubleClickReset.price) {
            this.reset();
        }
    }
    _mouseEnterEvent(e) {
        if (this._priceScale === null) {
            return;
        }
        const model = this._pane.chart().model();
        if (model.options().handleScale.axisPressedMouseMove.price && !this._priceScale.isPercentage() && !this._priceScale.isIndexedTo100()) {
            this._setCursor(1 /* CursorType.NsResize */);
        }
    }
    _mouseLeaveEvent(e) {
        this._setCursor(0 /* CursorType.Default */);
    }
    _backLabels() {
        const res = [];
        const priceScale = (this._priceScale === null) ? undefined : this._priceScale;
        const addViewsForSources = (sources) => {
            for (let i = 0; i < sources.length; ++i) {
                const source = sources[i];
                const views = source.priceAxisViews(this._pane.state(), priceScale);
                for (let j = 0; j < views.length; j++) {
                    res.push(views[j]);
                }
            }
        };
        // calculate max and min coordinates for views on selection
        // crosshair individually
        addViewsForSources(this._pane.state().orderedSources());
        return res;
    }
    _drawBackground({ context: ctx, bitmapSize }) {
        const { width, height } = bitmapSize;
        const model = this._pane.state().model();
        const topColor = model.backgroundTopColor();
        const bottomColor = model.backgroundBottomColor();
        if (topColor === bottomColor) {
            (0, canvas_helpers_1.clearRect)(ctx, 0, 0, width, height, topColor);
        }
        else {
            (0, canvas_helpers_1.clearRectWithGradient)(ctx, 0, 0, width, height, topColor, bottomColor);
        }
    }
    _drawBorder({ context: ctx, bitmapSize, horizontalPixelRatio }) {
        if (this._size === null || this._priceScale === null || !this._priceScale.options().borderVisible) {
            return;
        }
        ctx.fillStyle = this._priceScale.options().borderColor;
        const borderSize = Math.max(1, Math.floor(this.rendererOptions().borderSize * horizontalPixelRatio));
        let left;
        if (this._isLeft) {
            left = bitmapSize.width - borderSize;
        }
        else {
            left = 0;
        }
        ctx.fillRect(left, 0, borderSize, bitmapSize.height);
    }
    _drawTickMarks(target) {
        if (this._size === null || this._priceScale === null) {
            return;
        }
        const tickMarks = this._priceScale.marks();
        const priceScaleOptions = this._priceScale.options();
        const rendererOptions = this.rendererOptions();
        const tickMarkLeftX = this._isLeft ?
            (this._size.width - rendererOptions.tickLength) :
            0;
        if (priceScaleOptions.borderVisible && priceScaleOptions.ticksVisible) {
            target.useBitmapCoordinateSpace(({ context: ctx, horizontalPixelRatio, verticalPixelRatio }) => {
                ctx.fillStyle = priceScaleOptions.borderColor;
                const tickHeight = Math.max(1, Math.floor(verticalPixelRatio));
                const tickOffset = Math.floor(verticalPixelRatio * 0.5);
                const tickLength = Math.round(rendererOptions.tickLength * horizontalPixelRatio);
                ctx.beginPath();
                for (const tickMark of tickMarks) {
                    ctx.rect(Math.floor(tickMarkLeftX * horizontalPixelRatio), Math.round(tickMark.coord * verticalPixelRatio) - tickOffset, tickLength, tickHeight);
                }
                ctx.fill();
            });
        }
        target.useMediaCoordinateSpace(({ context: ctx }) => {
            var _a;
            ctx.font = this._baseFont();
            ctx.fillStyle = (_a = priceScaleOptions.textColor) !== null && _a !== void 0 ? _a : this._layoutOptions.textColor;
            ctx.textAlign = this._isLeft ? 'right' : 'left';
            ctx.textBaseline = 'middle';
            const textLeftX = this._isLeft ?
                Math.round(tickMarkLeftX - rendererOptions.paddingInner) :
                Math.round(tickMarkLeftX + rendererOptions.tickLength + rendererOptions.paddingInner);
            const yMidCorrections = tickMarks.map((mark) => this._widthCache.yMidCorrection(ctx, mark.label));
            for (let i = tickMarks.length; i--;) {
                const tickMark = tickMarks[i];
                ctx.fillText(tickMark.label, textLeftX, tickMark.coord + yMidCorrections[i]);
            }
        });
    }
    _alignLabels() {
        if (this._size === null || this._priceScale === null) {
            return;
        }
        let center = this._size.height / 2;
        const views = [];
        const orderedSources = this._priceScale.orderedSources().slice(); // Copy of array
        const pane = this._pane;
        const paneState = pane.state();
        const rendererOptions = this.rendererOptions();
        // if we are default price scale, append labels from no-scale
        const isDefault = this._priceScale === paneState.defaultVisiblePriceScale();
        if (isDefault) {
            this._pane.state().orderedSources().forEach((source) => {
                if (paneState.isOverlay(source)) {
                    orderedSources.push(source);
                }
            });
        }
        // we can use any, but let's use the first source as "center" one
        const centerSource = this._priceScale.dataSources()[0];
        const priceScale = this._priceScale;
        const updateForSources = (sources) => {
            sources.forEach((source) => {
                const sourceViews = source.priceAxisViews(paneState, priceScale);
                // never align selected sources
                sourceViews.forEach((view) => {
                    view.setFixedCoordinate(null);
                    if (view.isVisible()) {
                        views.push(view);
                    }
                });
                if (centerSource === source && sourceViews.length > 0) {
                    center = sourceViews[0].coordinate();
                }
            });
        };
        // crosshair individually
        updateForSources(orderedSources);
        views.forEach((view) => view.setFixedCoordinate(view.coordinate()));
        const options = this._priceScale.options();
        if (!options.alignLabels) {
            return;
        }
        this._fixLabelOverlap(views, rendererOptions, center);
    }
    _fixLabelOverlap(views, rendererOptions, center) {
        if (this._size === null) {
            return;
        }
        // split into two parts
        const top = views.filter((view) => view.coordinate() <= center);
        const bottom = views.filter((view) => view.coordinate() > center);
        // sort top from center to top
        top.sort((l, r) => r.coordinate() - l.coordinate());
        // share center label
        if (top.length && bottom.length) {
            bottom.push(top[0]);
        }
        bottom.sort((l, r) => l.coordinate() - r.coordinate());
        for (const view of views) {
            const halfHeight = Math.floor(view.height(rendererOptions) / 2);
            const coordinate = view.coordinate();
            if (coordinate > -halfHeight && coordinate < halfHeight) {
                view.setFixedCoordinate(halfHeight);
            }
            if (coordinate > (this._size.height - halfHeight) && coordinate < this._size.height + halfHeight) {
                view.setFixedCoordinate(this._size.height - halfHeight);
            }
        }
        for (let i = 1; i < top.length; i++) {
            const view = top[i];
            const prev = top[i - 1];
            const height = prev.height(rendererOptions, false);
            const coordinate = view.coordinate();
            const prevFixedCoordinate = prev.getFixedCoordinate();
            if (coordinate > prevFixedCoordinate - height) {
                view.setFixedCoordinate(prevFixedCoordinate - height);
            }
        }
        for (let j = 1; j < bottom.length; j++) {
            const view = bottom[j];
            const prev = bottom[j - 1];
            const height = prev.height(rendererOptions, true);
            const coordinate = view.coordinate();
            const prevFixedCoordinate = prev.getFixedCoordinate();
            if (coordinate < prevFixedCoordinate + height) {
                view.setFixedCoordinate(prevFixedCoordinate + height);
            }
        }
    }
    _drawBackLabels(target) {
        if (this._size === null) {
            return;
        }
        const views = this._backLabels();
        const rendererOptions = this.rendererOptions();
        const align = this._isLeft ? 'right' : 'left';
        views.forEach((view) => {
            if (view.isAxisLabelVisible()) {
                const renderer = view.renderer((0, assertions_1.ensureNotNull)(this._priceScale));
                renderer.draw(target, rendererOptions, this._widthCache, align);
            }
        });
    }
    _drawCrosshairLabel(target) {
        if (this._size === null || this._priceScale === null) {
            return;
        }
        const model = this._pane.chart().model();
        const views = []; // array of arrays
        const pane = this._pane.state();
        const v = model.crosshairSource().priceAxisViews(pane, this._priceScale);
        if (v.length) {
            views.push(v);
        }
        const ro = this.rendererOptions();
        const align = this._isLeft ? 'right' : 'left';
        views.forEach((arr) => {
            arr.forEach((view) => {
                view.renderer((0, assertions_1.ensureNotNull)(this._priceScale)).draw(target, ro, this._widthCache, align);
            });
        });
    }
    _setCursor(type) {
        this._cell.style.cursor = type === 1 /* CursorType.NsResize */ ? 'ns-resize' : 'default';
    }
    _onMarksChanged() {
        const width = this.optimalWidth();
        // avoid price scale is shrunk
        // using < instead !== to avoid infinite changes
        if (this._prevOptimalWidth < width) {
            this._pane.chart().model().fullUpdate();
        }
        this._prevOptimalWidth = width;
    }
    _baseFont() {
        return (0, make_font_1.makeFont)(this._layoutOptions.fontSize, this._layoutOptions.fontFamily);
    }
}
exports.PriceAxisWidget = PriceAxisWidget;
