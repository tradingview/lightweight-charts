import { equalSizes, size, tryCreateCanvasRenderingTarget2D, } from 'fancy-canvas';
import { ensureNotNull } from '../helpers/assertions';
import { clearRect, clearRectWithGradient } from '../helpers/canvas-helpers';
import { makeFont } from '../helpers/make-font';
import { TextWidthCache } from '../model/text-width-cache';
import { createBoundCanvas, releaseCanvas } from './canvas-utils';
import { suggestPriceScaleWidth } from './internal-layout-sizes-hints';
import { MouseEventHandler } from './mouse-event-handler';
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
function recalculateOverlapping(views, direction, scaleHeight, rendererOptions) {
    if (!views.length) {
        return;
    }
    let currentGroupStart = 0;
    const center = scaleHeight / 2;
    const initLabelHeight = views[0].height(rendererOptions, true);
    let spaceBeforeCurrentGroup = direction === 1
        ? center - (views[0].getFixedCoordinate() - initLabelHeight / 2)
        : views[0].getFixedCoordinate() - initLabelHeight / 2 - center;
    spaceBeforeCurrentGroup = Math.max(0, spaceBeforeCurrentGroup);
    for (let i = 1; i < views.length; i++) {
        const view = views[i];
        const prev = views[i - 1];
        const height = prev.height(rendererOptions, false);
        const coordinate = view.getFixedCoordinate();
        const prevFixedCoordinate = prev.getFixedCoordinate();
        const overlap = direction === 1
            ? coordinate > prevFixedCoordinate - height
            : coordinate < prevFixedCoordinate + height;
        if (overlap) {
            const fixedCoordinate = prevFixedCoordinate - height * direction;
            view.setFixedCoordinate(fixedCoordinate);
            const edgePoint = fixedCoordinate - direction * height / 2;
            const outOfViewport = direction === 1 ? edgePoint < 0 : edgePoint > scaleHeight;
            if (outOfViewport && spaceBeforeCurrentGroup > 0) {
                // shift the whole group up or down
                const desiredGroupShift = direction === 1 ? -1 - edgePoint : edgePoint - scaleHeight;
                const possibleShift = Math.min(desiredGroupShift, spaceBeforeCurrentGroup);
                for (let k = currentGroupStart; k < views.length; k++) {
                    views[k].setFixedCoordinate(views[k].getFixedCoordinate() + direction * possibleShift);
                }
                spaceBeforeCurrentGroup -= possibleShift;
            }
        }
        else {
            currentGroupStart = i;
            spaceBeforeCurrentGroup = direction === 1
                ? prevFixedCoordinate - height - coordinate
                : coordinate - (prevFixedCoordinate + height);
        }
    }
}
export class PriceAxisWidget {
    constructor(pane, options, rendererOptionsProvider, side) {
        this._priceScale = null;
        this._size = null;
        this._mousedown = false;
        this._widthCache = new TextWidthCache(200);
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
        this._canvasBinding = createBoundCanvas(this._cell, size({ width: 16, height: 16 }));
        this._canvasBinding.subscribeSuggestedBitmapSizeChanged(this._canvasSuggestedBitmapSizeChangedHandler);
        const canvas = this._canvasBinding.canvasElement;
        canvas.style.position = 'absolute';
        canvas.style.zIndex = '1';
        canvas.style.left = '0';
        canvas.style.top = '0';
        this._topCanvasBinding = createBoundCanvas(this._cell, size({ width: 16, height: 16 }));
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
        this._mouseEventHandler = new MouseEventHandler(this._topCanvasBinding.canvasElement, handler, {
            treatVertTouchDragAsPageScroll: () => !this._options.handleScroll.vertTouchDrag,
            treatHorzTouchDragAsPageScroll: () => true,
        });
    }
    destroy() {
        this._mouseEventHandler.destroy();
        this._topCanvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._topCanvasSuggestedBitmapSizeChangedHandler);
        releaseCanvas(this._topCanvasBinding.canvasElement);
        this._topCanvasBinding.dispose();
        this._canvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._canvasSuggestedBitmapSizeChangedHandler);
        releaseCanvas(this._canvasBinding.canvasElement);
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
        const ctx = ensureNotNull(this._canvasBinding.canvasElement.getContext('2d'));
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
        return suggestPriceScaleWidth(res);
    }
    setSize(newSize) {
        if (this._size === null || !equalSizes(this._size, newSize)) {
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
        return ensureNotNull(this._size).width;
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
        model.resetPriceScale(pane, ensureNotNull(this.priceScale()));
    }
    paint(type) {
        if (this._size === null) {
            return;
        }
        if (type !== 1 /* InvalidationLevel.Cursor */) {
            this._alignLabels();
            this._canvasBinding.applySuggestedBitmapSize();
            const target = tryCreateCanvasRenderingTarget2D(this._canvasBinding);
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
        const topTarget = tryCreateCanvasRenderingTarget2D(this._topCanvasBinding);
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
            clearRect(ctx, 0, 0, width, height, topColor);
        }
        else {
            clearRectWithGradient(ctx, 0, 0, width, height, topColor, bottomColor);
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
            });
        };
        // crosshair individually
        updateForSources(orderedSources);
        views.forEach((view) => view.setFixedCoordinate(view.coordinate()));
        const options = this._priceScale.options();
        if (!options.alignLabels) {
            return;
        }
        this._fixLabelOverlap(views, rendererOptions);
    }
    _fixLabelOverlap(views, rendererOptions) {
        if (this._size === null) {
            return;
        }
        const center = this._size.height / 2;
        // split into two parts
        const top = views.filter((view) => view.coordinate() <= center);
        const bottom = views.filter((view) => view.coordinate() > center);
        // sort top from center to top
        top.sort((l, r) => r.coordinate() - l.coordinate());
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
        recalculateOverlapping(top, 1, this._size.height, rendererOptions);
        recalculateOverlapping(bottom, -1, this._size.height, rendererOptions);
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
                const renderer = view.renderer(ensureNotNull(this._priceScale));
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
                view.renderer(ensureNotNull(this._priceScale)).draw(target, ro, this._widthCache, align);
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
        return makeFont(this._layoutOptions.fontSize, this._layoutOptions.fontFamily);
    }
}
