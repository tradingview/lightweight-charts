import { equalSizes, size, tryCreateCanvasRenderingTarget2D, } from 'fancy-canvas';
import { ensureNotNull } from '../helpers/assertions';
import { clearRect, clearRectWithGradient } from '../helpers/canvas-helpers';
import { makeFont } from '../helpers/make-font';
import { TextWidthCache } from '../model/text-width-cache';
import { createBoundCanvas, releaseCanvas } from './canvas-utils';
import { suggestPriceScaleWidth } from './internal-layout-sizes-hints';
import { MouseEventHandler } from './mouse-event-handler';
;
;
;
function buildPriceAxisViewsGetter(zOrder, priceScaleId) {
    return (source) => {
        var _a, _b, _c, _d;
        const psId = (_b = (_a = source._internal_priceScale()) === null || _a === void 0 ? void 0 : _a._internal_id()) !== null && _b !== void 0 ? _b : '';
        if (psId !== priceScaleId) {
            // exclude if source is using a different price scale.
            return [];
        }
        return (_d = (_c = source._internal_pricePaneViews) === null || _c === void 0 ? void 0 : _c.call(source, zOrder)) !== null && _d !== void 0 ? _d : [];
    };
}
export class PriceAxisWidget {
    constructor(pane, options, rendererOptionsProvider, side) {
        this._private__priceScale = null;
        this._private__size = null;
        this._private__mousedown = false;
        this._private__widthCache = new TextWidthCache(200);
        this._private__font = null;
        this._private__prevOptimalWidth = 0;
        this._private__isSettingSize = false;
        this._private__canvasSuggestedBitmapSizeChangedHandler = () => {
            if (this._private__isSettingSize) {
                return;
            }
            this._private__pane._internal_chart()._internal_model()._internal_lightUpdate();
        };
        this._private__topCanvasSuggestedBitmapSizeChangedHandler = () => {
            if (this._private__isSettingSize) {
                return;
            }
            this._private__pane._internal_chart()._internal_model()._internal_lightUpdate();
        };
        this._private__pane = pane;
        this._private__options = options;
        this._private__layoutOptions = options.layout;
        this._private__rendererOptionsProvider = rendererOptionsProvider;
        this._private__isLeft = side === 'left';
        this._private__sourcePaneViews = buildPriceAxisViewsGetter('normal', side);
        this._private__sourceTopPaneViews = buildPriceAxisViewsGetter('top', side);
        this._private__sourceBottomPaneViews = buildPriceAxisViewsGetter('bottom', side);
        this._private__cell = document.createElement('div');
        this._private__cell.style.height = '100%';
        this._private__cell.style.overflow = 'hidden';
        this._private__cell.style.width = '25px';
        this._private__cell.style.left = '0';
        this._private__cell.style.position = 'relative';
        this._private__canvasBinding = createBoundCanvas(this._private__cell, size({ width: 16, height: 16 }));
        this._private__canvasBinding.subscribeSuggestedBitmapSizeChanged(this._private__canvasSuggestedBitmapSizeChangedHandler);
        const canvas = this._private__canvasBinding.canvasElement;
        canvas.style.position = 'absolute';
        canvas.style.zIndex = '1';
        canvas.style.left = '0';
        canvas.style.top = '0';
        this._private__topCanvasBinding = createBoundCanvas(this._private__cell, size({ width: 16, height: 16 }));
        this._private__topCanvasBinding.subscribeSuggestedBitmapSizeChanged(this._private__topCanvasSuggestedBitmapSizeChangedHandler);
        const topCanvas = this._private__topCanvasBinding.canvasElement;
        topCanvas.style.position = 'absolute';
        topCanvas.style.zIndex = '2';
        topCanvas.style.left = '0';
        topCanvas.style.top = '0';
        const handler = {
            _internal_mouseDownEvent: this._private__mouseDownEvent.bind(this),
            _internal_touchStartEvent: this._private__mouseDownEvent.bind(this),
            _internal_pressedMouseMoveEvent: this._private__pressedMouseMoveEvent.bind(this),
            _internal_touchMoveEvent: this._private__pressedMouseMoveEvent.bind(this),
            _internal_mouseDownOutsideEvent: this._private__mouseDownOutsideEvent.bind(this),
            _internal_mouseUpEvent: this._private__mouseUpEvent.bind(this),
            _internal_touchEndEvent: this._private__mouseUpEvent.bind(this),
            _internal_mouseDoubleClickEvent: this._private__mouseDoubleClickEvent.bind(this),
            _internal_doubleTapEvent: this._private__mouseDoubleClickEvent.bind(this),
            _internal_mouseEnterEvent: this._private__mouseEnterEvent.bind(this),
            _internal_mouseLeaveEvent: this._private__mouseLeaveEvent.bind(this),
        };
        this._private__mouseEventHandler = new MouseEventHandler(this._private__topCanvasBinding.canvasElement, handler, {
            _internal_treatVertTouchDragAsPageScroll: () => !this._private__options.handleScroll.vertTouchDrag,
            _internal_treatHorzTouchDragAsPageScroll: () => true,
        });
    }
    _internal_destroy() {
        this._private__mouseEventHandler._internal_destroy();
        this._private__topCanvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._private__topCanvasSuggestedBitmapSizeChangedHandler);
        releaseCanvas(this._private__topCanvasBinding.canvasElement);
        this._private__topCanvasBinding.dispose();
        this._private__canvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._private__canvasSuggestedBitmapSizeChangedHandler);
        releaseCanvas(this._private__canvasBinding.canvasElement);
        this._private__canvasBinding.dispose();
        if (this._private__priceScale !== null) {
            this._private__priceScale._internal_onMarksChanged()._internal_unsubscribeAll(this);
        }
        this._private__priceScale = null;
    }
    _internal_getElement() {
        return this._private__cell;
    }
    _internal_fontSize() {
        return this._private__layoutOptions.fontSize;
    }
    _internal_rendererOptions() {
        const options = this._private__rendererOptionsProvider._internal_options();
        const isFontChanged = this._private__font !== options._internal_font;
        if (isFontChanged) {
            this._private__widthCache._internal_reset();
            this._private__font = options._internal_font;
        }
        return options;
    }
    _internal_optimalWidth() {
        if (this._private__priceScale === null) {
            return 0;
        }
        let tickMarkMaxWidth = 0;
        const rendererOptions = this._internal_rendererOptions();
        const ctx = ensureNotNull(this._private__canvasBinding.canvasElement.getContext('2d'));
        ctx.save();
        const tickMarks = this._private__priceScale._internal_marks();
        ctx.font = this._private__baseFont();
        if (tickMarks.length > 0) {
            tickMarkMaxWidth = Math.max(this._private__widthCache._internal_measureText(ctx, tickMarks[0]._internal_label), this._private__widthCache._internal_measureText(ctx, tickMarks[tickMarks.length - 1]._internal_label));
        }
        const views = this._private__backLabels();
        for (let j = views.length; j--;) {
            const width = this._private__widthCache._internal_measureText(ctx, views[j]._internal_text());
            if (width > tickMarkMaxWidth) {
                tickMarkMaxWidth = width;
            }
        }
        const firstValue = this._private__priceScale._internal_firstValue();
        if (firstValue !== null && this._private__size !== null) {
            const topValue = this._private__priceScale._internal_coordinateToPrice(1, firstValue);
            const bottomValue = this._private__priceScale._internal_coordinateToPrice(this._private__size.height - 2, firstValue);
            tickMarkMaxWidth = Math.max(tickMarkMaxWidth, this._private__widthCache._internal_measureText(ctx, this._private__priceScale._internal_formatPrice(Math.floor(Math.min(topValue, bottomValue)) + 0.11111111111111, firstValue)), this._private__widthCache._internal_measureText(ctx, this._private__priceScale._internal_formatPrice(Math.ceil(Math.max(topValue, bottomValue)) - 0.11111111111111, firstValue)));
        }
        ctx.restore();
        const resultTickMarksMaxWidth = tickMarkMaxWidth || 34 /* Constants.DefaultOptimalWidth */;
        const res = Math.ceil(rendererOptions._internal_borderSize +
            rendererOptions._internal_tickLength +
            rendererOptions._internal_paddingInner +
            rendererOptions._internal_paddingOuter +
            5 /* Constants.LabelOffset */ +
            resultTickMarksMaxWidth);
        // make it even, remove this after migration to perfect fancy canvas
        return suggestPriceScaleWidth(res);
    }
    _internal_setSize(newSize) {
        if (this._private__size === null || !equalSizes(this._private__size, newSize)) {
            this._private__size = newSize;
            this._private__isSettingSize = true;
            this._private__canvasBinding.resizeCanvasElement(newSize);
            this._private__topCanvasBinding.resizeCanvasElement(newSize);
            this._private__isSettingSize = false;
            this._private__cell.style.width = `${newSize.width}px`;
            this._private__cell.style.height = `${newSize.height}px`;
        }
    }
    _internal_getWidth() {
        return ensureNotNull(this._private__size).width;
    }
    _internal_setPriceScale(priceScale) {
        if (this._private__priceScale === priceScale) {
            return;
        }
        if (this._private__priceScale !== null) {
            this._private__priceScale._internal_onMarksChanged()._internal_unsubscribeAll(this);
        }
        this._private__priceScale = priceScale;
        priceScale._internal_onMarksChanged()._internal_subscribe(this._private__onMarksChanged.bind(this), this);
    }
    _internal_priceScale() {
        return this._private__priceScale;
    }
    _internal_reset() {
        const pane = this._private__pane._internal_state();
        const model = this._private__pane._internal_chart()._internal_model();
        model._internal_resetPriceScale(pane, ensureNotNull(this._internal_priceScale()));
    }
    _internal_paint(type) {
        if (this._private__size === null) {
            return;
        }
        if (type !== 1 /* InvalidationLevel.Cursor */) {
            this._private__alignLabels();
            this._private__canvasBinding.applySuggestedBitmapSize();
            const target = tryCreateCanvasRenderingTarget2D(this._private__canvasBinding);
            if (target !== null) {
                target.useBitmapCoordinateSpace((scope) => {
                    this._private__drawBackground(scope);
                    this._private__drawBorder(scope);
                });
                this._private__pane._internal_drawAdditionalSources(target, this._private__sourceBottomPaneViews);
                this._private__drawTickMarks(target);
                this._private__pane._internal_drawAdditionalSources(target, this._private__sourcePaneViews);
                this._private__drawBackLabels(target);
            }
        }
        this._private__topCanvasBinding.applySuggestedBitmapSize();
        const topTarget = tryCreateCanvasRenderingTarget2D(this._private__topCanvasBinding);
        if (topTarget !== null) {
            topTarget.useBitmapCoordinateSpace(({ context: ctx, bitmapSize }) => {
                ctx.clearRect(0, 0, bitmapSize.width, bitmapSize.height);
            });
            this._private__drawCrosshairLabel(topTarget);
            this._private__pane._internal_drawAdditionalSources(topTarget, this._private__sourceTopPaneViews);
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
    _internal_update() {
        var _a;
        // this call has side-effect - it regenerates marks on the price scale
        (_a = this._private__priceScale) === null || _a === void 0 ? void 0 : _a._internal_marks();
    }
    _private__mouseDownEvent(e) {
        if (this._private__priceScale === null || this._private__priceScale._internal_isEmpty() || !this._private__options.handleScale.axisPressedMouseMove.price) {
            return;
        }
        const model = this._private__pane._internal_chart()._internal_model();
        const pane = this._private__pane._internal_state();
        this._private__mousedown = true;
        model._internal_startScalePrice(pane, this._private__priceScale, e.localY);
    }
    _private__pressedMouseMoveEvent(e) {
        if (this._private__priceScale === null || !this._private__options.handleScale.axisPressedMouseMove.price) {
            return;
        }
        const model = this._private__pane._internal_chart()._internal_model();
        const pane = this._private__pane._internal_state();
        const priceScale = this._private__priceScale;
        model._internal_scalePriceTo(pane, priceScale, e.localY);
    }
    _private__mouseDownOutsideEvent() {
        if (this._private__priceScale === null || !this._private__options.handleScale.axisPressedMouseMove.price) {
            return;
        }
        const model = this._private__pane._internal_chart()._internal_model();
        const pane = this._private__pane._internal_state();
        const priceScale = this._private__priceScale;
        if (this._private__mousedown) {
            this._private__mousedown = false;
            model._internal_endScalePrice(pane, priceScale);
        }
    }
    _private__mouseUpEvent(e) {
        if (this._private__priceScale === null || !this._private__options.handleScale.axisPressedMouseMove.price) {
            return;
        }
        const model = this._private__pane._internal_chart()._internal_model();
        const pane = this._private__pane._internal_state();
        this._private__mousedown = false;
        model._internal_endScalePrice(pane, this._private__priceScale);
    }
    _private__mouseDoubleClickEvent(e) {
        if (this._private__options.handleScale.axisDoubleClickReset.price) {
            this._internal_reset();
        }
    }
    _private__mouseEnterEvent(e) {
        if (this._private__priceScale === null) {
            return;
        }
        const model = this._private__pane._internal_chart()._internal_model();
        if (model._internal_options().handleScale.axisPressedMouseMove.price && !this._private__priceScale._internal_isPercentage() && !this._private__priceScale._internal_isIndexedTo100()) {
            this._private__setCursor(1 /* CursorType.NsResize */);
        }
    }
    _private__mouseLeaveEvent(e) {
        this._private__setCursor(0 /* CursorType.Default */);
    }
    _private__backLabels() {
        const res = [];
        const priceScale = (this._private__priceScale === null) ? undefined : this._private__priceScale;
        const addViewsForSources = (sources) => {
            for (let i = 0; i < sources.length; ++i) {
                const source = sources[i];
                const views = source._internal_priceAxisViews(this._private__pane._internal_state(), priceScale);
                for (let j = 0; j < views.length; j++) {
                    res.push(views[j]);
                }
            }
        };
        // calculate max and min coordinates for views on selection
        // crosshair individually
        addViewsForSources(this._private__pane._internal_state()._internal_orderedSources());
        return res;
    }
    _private__drawBackground({ context: ctx, bitmapSize }) {
        const { width, height } = bitmapSize;
        const model = this._private__pane._internal_state()._internal_model();
        const topColor = model._internal_backgroundTopColor();
        const bottomColor = model._internal_backgroundBottomColor();
        if (topColor === bottomColor) {
            clearRect(ctx, 0, 0, width, height, topColor);
        }
        else {
            clearRectWithGradient(ctx, 0, 0, width, height, topColor, bottomColor);
        }
    }
    _private__drawBorder({ context: ctx, bitmapSize, horizontalPixelRatio }) {
        if (this._private__size === null || this._private__priceScale === null || !this._private__priceScale._internal_options().borderVisible) {
            return;
        }
        ctx.fillStyle = this._private__priceScale._internal_options().borderColor;
        const borderSize = Math.max(1, Math.floor(this._internal_rendererOptions()._internal_borderSize * horizontalPixelRatio));
        let left;
        if (this._private__isLeft) {
            left = bitmapSize.width - borderSize;
        }
        else {
            left = 0;
        }
        ctx.fillRect(left, 0, borderSize, bitmapSize.height);
    }
    _private__drawTickMarks(target) {
        if (this._private__size === null || this._private__priceScale === null) {
            return;
        }
        const tickMarks = this._private__priceScale._internal_marks();
        const priceScaleOptions = this._private__priceScale._internal_options();
        const rendererOptions = this._internal_rendererOptions();
        const tickMarkLeftX = this._private__isLeft ?
            (this._private__size.width - rendererOptions._internal_tickLength) :
            0;
        if (priceScaleOptions.borderVisible && priceScaleOptions.ticksVisible) {
            target.useBitmapCoordinateSpace(({ context: ctx, horizontalPixelRatio, verticalPixelRatio }) => {
                ctx.fillStyle = priceScaleOptions.borderColor;
                const tickHeight = Math.max(1, Math.floor(verticalPixelRatio));
                const tickOffset = Math.floor(verticalPixelRatio * 0.5);
                const tickLength = Math.round(rendererOptions._internal_tickLength * horizontalPixelRatio);
                ctx.beginPath();
                for (const tickMark of tickMarks) {
                    ctx.rect(Math.floor(tickMarkLeftX * horizontalPixelRatio), Math.round(tickMark._internal_coord * verticalPixelRatio) - tickOffset, tickLength, tickHeight);
                }
                ctx.fill();
            });
        }
        target.useMediaCoordinateSpace(({ context: ctx }) => {
            var _a;
            ctx.font = this._private__baseFont();
            ctx.fillStyle = (_a = priceScaleOptions.textColor) !== null && _a !== void 0 ? _a : this._private__layoutOptions.textColor;
            ctx.textAlign = this._private__isLeft ? 'right' : 'left';
            ctx.textBaseline = 'middle';
            const textLeftX = this._private__isLeft ?
                Math.round(tickMarkLeftX - rendererOptions._internal_paddingInner) :
                Math.round(tickMarkLeftX + rendererOptions._internal_tickLength + rendererOptions._internal_paddingInner);
            const yMidCorrections = tickMarks.map((mark) => this._private__widthCache._internal_yMidCorrection(ctx, mark._internal_label));
            for (let i = tickMarks.length; i--;) {
                const tickMark = tickMarks[i];
                ctx.fillText(tickMark._internal_label, textLeftX, tickMark._internal_coord + yMidCorrections[i]);
            }
        });
    }
    _private__alignLabels() {
        if (this._private__size === null || this._private__priceScale === null) {
            return;
        }
        let center = this._private__size.height / 2;
        const views = [];
        const orderedSources = this._private__priceScale._internal_orderedSources().slice(); // Copy of array
        const pane = this._private__pane;
        const paneState = pane._internal_state();
        const rendererOptions = this._internal_rendererOptions();
        // if we are default price scale, append labels from no-scale
        const isDefault = this._private__priceScale === paneState._internal_defaultVisiblePriceScale();
        if (isDefault) {
            this._private__pane._internal_state()._internal_orderedSources().forEach((source) => {
                if (paneState._internal_isOverlay(source)) {
                    orderedSources.push(source);
                }
            });
        }
        // we can use any, but let's use the first source as "center" one
        const centerSource = this._private__priceScale._internal_dataSources()[0];
        const priceScale = this._private__priceScale;
        const updateForSources = (sources) => {
            sources.forEach((source) => {
                const sourceViews = source._internal_priceAxisViews(paneState, priceScale);
                // never align selected sources
                sourceViews.forEach((view) => {
                    view._internal_setFixedCoordinate(null);
                    if (view._internal_isVisible()) {
                        views.push(view);
                    }
                });
                if (centerSource === source && sourceViews.length > 0) {
                    center = sourceViews[0]._internal_coordinate();
                }
            });
        };
        // crosshair individually
        updateForSources(orderedSources);
        views.forEach((view) => view._internal_setFixedCoordinate(view._internal_coordinate()));
        const options = this._private__priceScale._internal_options();
        if (!options.alignLabels) {
            return;
        }
        this._private__fixLabelOverlap(views, rendererOptions, center);
    }
    _private__fixLabelOverlap(views, rendererOptions, center) {
        if (this._private__size === null) {
            return;
        }
        // split into two parts
        const top = views.filter((view) => view._internal_coordinate() <= center);
        const bottom = views.filter((view) => view._internal_coordinate() > center);
        // sort top from center to top
        top.sort((l, r) => r._internal_coordinate() - l._internal_coordinate());
        // share center label
        if (top.length && bottom.length) {
            bottom.push(top[0]);
        }
        bottom.sort((l, r) => l._internal_coordinate() - r._internal_coordinate());
        for (const view of views) {
            const halfHeight = Math.floor(view._internal_height(rendererOptions) / 2);
            const coordinate = view._internal_coordinate();
            if (coordinate > -halfHeight && coordinate < halfHeight) {
                view._internal_setFixedCoordinate(halfHeight);
            }
            if (coordinate > (this._private__size.height - halfHeight) && coordinate < this._private__size.height + halfHeight) {
                view._internal_setFixedCoordinate(this._private__size.height - halfHeight);
            }
        }
        for (let i = 1; i < top.length; i++) {
            const view = top[i];
            const prev = top[i - 1];
            const height = prev._internal_height(rendererOptions, false);
            const coordinate = view._internal_coordinate();
            const prevFixedCoordinate = prev._internal_getFixedCoordinate();
            if (coordinate > prevFixedCoordinate - height) {
                view._internal_setFixedCoordinate(prevFixedCoordinate - height);
            }
        }
        for (let j = 1; j < bottom.length; j++) {
            const view = bottom[j];
            const prev = bottom[j - 1];
            const height = prev._internal_height(rendererOptions, true);
            const coordinate = view._internal_coordinate();
            const prevFixedCoordinate = prev._internal_getFixedCoordinate();
            if (coordinate < prevFixedCoordinate + height) {
                view._internal_setFixedCoordinate(prevFixedCoordinate + height);
            }
        }
    }
    _private__drawBackLabels(target) {
        if (this._private__size === null) {
            return;
        }
        const views = this._private__backLabels();
        const rendererOptions = this._internal_rendererOptions();
        const align = this._private__isLeft ? 'right' : 'left';
        views.forEach((view) => {
            if (view._internal_isAxisLabelVisible()) {
                const renderer = view._internal_renderer(ensureNotNull(this._private__priceScale));
                renderer._internal_draw(target, rendererOptions, this._private__widthCache, align);
            }
        });
    }
    _private__drawCrosshairLabel(target) {
        if (this._private__size === null || this._private__priceScale === null) {
            return;
        }
        const model = this._private__pane._internal_chart()._internal_model();
        const views = []; // array of arrays
        const pane = this._private__pane._internal_state();
        const v = model._internal_crosshairSource()._internal_priceAxisViews(pane, this._private__priceScale);
        if (v.length) {
            views.push(v);
        }
        const ro = this._internal_rendererOptions();
        const align = this._private__isLeft ? 'right' : 'left';
        views.forEach((arr) => {
            arr.forEach((view) => {
                view._internal_renderer(ensureNotNull(this._private__priceScale))._internal_draw(target, ro, this._private__widthCache, align);
            });
        });
    }
    _private__setCursor(type) {
        this._private__cell.style.cursor = type === 1 /* CursorType.NsResize */ ? 'ns-resize' : 'default';
    }
    _private__onMarksChanged() {
        const width = this._internal_optimalWidth();
        // avoid price scale is shrunk
        // using < instead !== to avoid infinite changes
        if (this._private__prevOptimalWidth < width) {
            this._private__pane._internal_chart()._internal_model()._internal_fullUpdate();
        }
        this._private__prevOptimalWidth = width;
    }
    _private__baseFont() {
        return makeFont(this._private__layoutOptions.fontSize, this._private__layoutOptions.fontFamily);
    }
}
