import { equalSizes, size, tryCreateCanvasRenderingTarget2D, } from 'fancy-canvas';
import { clearRect } from '../helpers/canvas-helpers';
import { Delegate } from '../helpers/delegate';
import { makeFont } from '../helpers/make-font';
import { TextWidthCache } from '../model/text-width-cache';
import { createBoundCanvas, releaseCanvas } from './canvas-utils';
import { drawBackground, drawForeground, drawSourcePaneViews } from './draw-functions';
import { MouseEventHandler } from './mouse-event-handler';
import { PriceAxisStub } from './price-axis-stub';
;
;
function buildTimeAxisViewsGetter(zOrder) {
    return (source) => { var _a, _b; return (_b = (_a = source._internal_timePaneViews) === null || _a === void 0 ? void 0 : _a.call(source, zOrder)) !== null && _b !== void 0 ? _b : []; };
}
const sourcePaneViews = buildTimeAxisViewsGetter('normal');
const sourceTopPaneViews = buildTimeAxisViewsGetter('top');
const sourceBottomPaneViews = buildTimeAxisViewsGetter('bottom');
export class TimeAxisWidget {
    constructor(chartWidget, horzScaleBehavior) {
        this._private__leftStub = null;
        this._private__rightStub = null;
        this._private__rendererOptions = null;
        this._private__mouseDown = false;
        this._private__size = size({ width: 0, height: 0 });
        this._private__sizeChanged = new Delegate();
        this._private__widthCache = new TextWidthCache(5);
        this._private__isSettingSize = false;
        this._private__canvasSuggestedBitmapSizeChangedHandler = () => {
            if (!this._private__isSettingSize) {
                this._private__chart._internal_model()._internal_lightUpdate();
            }
        };
        this._private__topCanvasSuggestedBitmapSizeChangedHandler = () => {
            if (!this._private__isSettingSize) {
                this._private__chart._internal_model()._internal_lightUpdate();
            }
        };
        this._private__chart = chartWidget;
        this._private__horzScaleBehavior = horzScaleBehavior;
        this._private__options = chartWidget._internal_options().layout;
        this._private__element = document.createElement('tr');
        this._private__leftStubCell = document.createElement('td');
        this._private__leftStubCell.style.padding = '0';
        this._private__rightStubCell = document.createElement('td');
        this._private__rightStubCell.style.padding = '0';
        this._private__cell = document.createElement('td');
        this._private__cell.style.height = '25px';
        this._private__cell.style.padding = '0';
        this._private__dv = document.createElement('div');
        this._private__dv.style.width = '100%';
        this._private__dv.style.height = '100%';
        this._private__dv.style.position = 'relative';
        this._private__dv.style.overflow = 'hidden';
        this._private__cell.appendChild(this._private__dv);
        this._private__canvasBinding = createBoundCanvas(this._private__dv, size({ width: 16, height: 16 }));
        this._private__canvasBinding.subscribeSuggestedBitmapSizeChanged(this._private__canvasSuggestedBitmapSizeChangedHandler);
        const canvas = this._private__canvasBinding.canvasElement;
        canvas.style.position = 'absolute';
        canvas.style.zIndex = '1';
        canvas.style.left = '0';
        canvas.style.top = '0';
        this._private__topCanvasBinding = createBoundCanvas(this._private__dv, size({ width: 16, height: 16 }));
        this._private__topCanvasBinding.subscribeSuggestedBitmapSizeChanged(this._private__topCanvasSuggestedBitmapSizeChangedHandler);
        const topCanvas = this._private__topCanvasBinding.canvasElement;
        topCanvas.style.position = 'absolute';
        topCanvas.style.zIndex = '2';
        topCanvas.style.left = '0';
        topCanvas.style.top = '0';
        this._private__element.appendChild(this._private__leftStubCell);
        this._private__element.appendChild(this._private__cell);
        this._private__element.appendChild(this._private__rightStubCell);
        this._private__recreateStubs();
        this._private__chart._internal_model()._internal_priceScalesOptionsChanged()._internal_subscribe(this._private__recreateStubs.bind(this), this);
        this._private__mouseEventHandler = new MouseEventHandler(this._private__topCanvasBinding.canvasElement, this, {
            _internal_treatVertTouchDragAsPageScroll: () => true,
            _internal_treatHorzTouchDragAsPageScroll: () => !this._private__chart._internal_options().handleScroll.horzTouchDrag,
        });
    }
    _internal_destroy() {
        this._private__mouseEventHandler._internal_destroy();
        if (this._private__leftStub !== null) {
            this._private__leftStub._internal_destroy();
        }
        if (this._private__rightStub !== null) {
            this._private__rightStub._internal_destroy();
        }
        this._private__topCanvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._private__topCanvasSuggestedBitmapSizeChangedHandler);
        releaseCanvas(this._private__topCanvasBinding.canvasElement);
        this._private__topCanvasBinding.dispose();
        this._private__canvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._private__canvasSuggestedBitmapSizeChangedHandler);
        releaseCanvas(this._private__canvasBinding.canvasElement);
        this._private__canvasBinding.dispose();
    }
    _internal_getElement() {
        return this._private__element;
    }
    _internal_leftStub() {
        return this._private__leftStub;
    }
    _internal_rightStub() {
        return this._private__rightStub;
    }
    _internal_mouseDownEvent(event) {
        if (this._private__mouseDown) {
            return;
        }
        this._private__mouseDown = true;
        const model = this._private__chart._internal_model();
        if (model._internal_timeScale()._internal_isEmpty() || !this._private__chart._internal_options().handleScale.axisPressedMouseMove.time) {
            return;
        }
        model._internal_startScaleTime(event.localX);
    }
    _internal_touchStartEvent(event) {
        this._internal_mouseDownEvent(event);
    }
    _internal_mouseDownOutsideEvent() {
        const model = this._private__chart._internal_model();
        if (!model._internal_timeScale()._internal_isEmpty() && this._private__mouseDown) {
            this._private__mouseDown = false;
            if (this._private__chart._internal_options().handleScale.axisPressedMouseMove.time) {
                model._internal_endScaleTime();
            }
        }
    }
    _internal_pressedMouseMoveEvent(event) {
        const model = this._private__chart._internal_model();
        if (model._internal_timeScale()._internal_isEmpty() || !this._private__chart._internal_options().handleScale.axisPressedMouseMove.time) {
            return;
        }
        model._internal_scaleTimeTo(event.localX);
    }
    _internal_touchMoveEvent(event) {
        this._internal_pressedMouseMoveEvent(event);
    }
    _internal_mouseUpEvent() {
        this._private__mouseDown = false;
        const model = this._private__chart._internal_model();
        if (model._internal_timeScale()._internal_isEmpty() && !this._private__chart._internal_options().handleScale.axisPressedMouseMove.time) {
            return;
        }
        model._internal_endScaleTime();
    }
    _internal_touchEndEvent() {
        this._internal_mouseUpEvent();
    }
    _internal_mouseDoubleClickEvent() {
        if (this._private__chart._internal_options().handleScale.axisDoubleClickReset.time) {
            this._private__chart._internal_model()._internal_resetTimeScale();
        }
    }
    _internal_doubleTapEvent() {
        this._internal_mouseDoubleClickEvent();
    }
    _internal_mouseEnterEvent() {
        if (this._private__chart._internal_model()._internal_options().handleScale.axisPressedMouseMove.time) {
            this._private__setCursor(1 /* CursorType.EwResize */);
        }
    }
    _internal_mouseLeaveEvent() {
        this._private__setCursor(0 /* CursorType.Default */);
    }
    _internal_getSize() {
        return this._private__size;
    }
    _internal_sizeChanged() {
        return this._private__sizeChanged;
    }
    _internal_setSizes(timeAxisSize, leftStubWidth, rightStubWidth) {
        if (!equalSizes(this._private__size, timeAxisSize)) {
            this._private__size = timeAxisSize;
            this._private__isSettingSize = true;
            this._private__canvasBinding.resizeCanvasElement(timeAxisSize);
            this._private__topCanvasBinding.resizeCanvasElement(timeAxisSize);
            this._private__isSettingSize = false;
            this._private__cell.style.width = `${timeAxisSize.width}px`;
            this._private__cell.style.height = `${timeAxisSize.height}px`;
            this._private__sizeChanged._internal_fire(timeAxisSize);
        }
        if (this._private__leftStub !== null) {
            this._private__leftStub._internal_setSize(size({ width: leftStubWidth, height: timeAxisSize.height }));
        }
        if (this._private__rightStub !== null) {
            this._private__rightStub._internal_setSize(size({ width: rightStubWidth, height: timeAxisSize.height }));
        }
    }
    _internal_optimalHeight() {
        const rendererOptions = this._private__getRendererOptions();
        return Math.ceil(
        // rendererOptions.offsetSize +
        rendererOptions._internal_borderSize +
            rendererOptions._internal_tickLength +
            rendererOptions._internal_fontSize +
            rendererOptions._internal_paddingTop +
            rendererOptions._internal_paddingBottom +
            rendererOptions._internal_labelBottomOffset);
    }
    _internal_update() {
        // this call has side-effect - it regenerates marks on the time scale
        this._private__chart._internal_model()._internal_timeScale()._internal_marks();
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
        if (type !== 1 /* InvalidationLevel.Cursor */) {
            this._private__canvasBinding.applySuggestedBitmapSize();
            const target = tryCreateCanvasRenderingTarget2D(this._private__canvasBinding);
            if (target !== null) {
                target.useBitmapCoordinateSpace((scope) => {
                    this._private__drawBackground(scope);
                    this._private__drawBorder(scope);
                    this._private__drawAdditionalSources(target, sourceBottomPaneViews);
                });
                this._private__drawTickMarks(target);
                this._private__drawAdditionalSources(target, sourcePaneViews);
                // atm we don't have sources to be drawn on time axis except crosshair which is rendered on top level canvas
                // so let's don't call this code at all for now
                // this._drawLabels(this._chart.model().dataSources(), target);
            }
            if (this._private__leftStub !== null) {
                this._private__leftStub._internal_paint(type);
            }
            if (this._private__rightStub !== null) {
                this._private__rightStub._internal_paint(type);
            }
        }
        this._private__topCanvasBinding.applySuggestedBitmapSize();
        const topTarget = tryCreateCanvasRenderingTarget2D(this._private__topCanvasBinding);
        if (topTarget !== null) {
            topTarget.useBitmapCoordinateSpace(({ context: ctx, bitmapSize }) => {
                ctx.clearRect(0, 0, bitmapSize.width, bitmapSize.height);
            });
            this._private__drawLabels([...this._private__chart._internal_model()._internal_serieses(), this._private__chart._internal_model()._internal_crosshairSource()], topTarget);
            this._private__drawAdditionalSources(topTarget, sourceTopPaneViews);
        }
    }
    _private__drawAdditionalSources(target, axisViewsGetter) {
        const sources = this._private__chart._internal_model()._internal_serieses();
        for (const source of sources) {
            drawSourcePaneViews(axisViewsGetter, (renderer) => drawBackground(renderer, target, false, undefined), source, undefined);
        }
        for (const source of sources) {
            drawSourcePaneViews(axisViewsGetter, (renderer) => drawForeground(renderer, target, false, undefined), source, undefined);
        }
    }
    _private__drawBackground({ context: ctx, bitmapSize }) {
        clearRect(ctx, 0, 0, bitmapSize.width, bitmapSize.height, this._private__chart._internal_model()._internal_backgroundBottomColor());
    }
    _private__drawBorder({ context: ctx, bitmapSize, verticalPixelRatio }) {
        if (this._private__chart._internal_options().timeScale.borderVisible) {
            ctx.fillStyle = this._private__lineColor();
            const borderSize = Math.max(1, Math.floor(this._private__getRendererOptions()._internal_borderSize * verticalPixelRatio));
            ctx.fillRect(0, 0, bitmapSize.width, borderSize);
        }
    }
    _private__drawTickMarks(target) {
        const timeScale = this._private__chart._internal_model()._internal_timeScale();
        const tickMarks = timeScale._internal_marks();
        if (!tickMarks || tickMarks.length === 0) {
            return;
        }
        const maxWeight = this._private__horzScaleBehavior.maxTickMarkWeight(tickMarks);
        const rendererOptions = this._private__getRendererOptions();
        const options = timeScale._internal_options();
        if (options.borderVisible && options.ticksVisible) {
            target.useBitmapCoordinateSpace(({ context: ctx, horizontalPixelRatio, verticalPixelRatio }) => {
                ctx.strokeStyle = this._private__lineColor();
                ctx.fillStyle = this._private__lineColor();
                const tickWidth = Math.max(1, Math.floor(horizontalPixelRatio));
                const tickOffset = Math.floor(horizontalPixelRatio * 0.5);
                ctx.beginPath();
                const tickLen = Math.round(rendererOptions._internal_tickLength * verticalPixelRatio);
                for (let index = tickMarks.length; index--;) {
                    const x = Math.round(tickMarks[index].coord * horizontalPixelRatio);
                    ctx.rect(x - tickOffset, 0, tickWidth, tickLen);
                }
                ctx.fill();
            });
        }
        target.useMediaCoordinateSpace(({ context: ctx }) => {
            const yText = (rendererOptions._internal_borderSize +
                rendererOptions._internal_tickLength +
                rendererOptions._internal_paddingTop +
                rendererOptions._internal_fontSize / 2);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = this._private__textColor();
            // draw base marks
            ctx.font = this._private__baseFont();
            for (const tickMark of tickMarks) {
                if (tickMark.weight < maxWeight) {
                    const coordinate = tickMark.needAlignCoordinate ? this._private__alignTickMarkLabelCoordinate(ctx, tickMark.coord, tickMark.label) : tickMark.coord;
                    ctx.fillText(tickMark.label, coordinate, yText);
                }
            }
            if (this._private__chart._internal_options().timeScale.allowBoldLabels) {
                ctx.font = this._private__baseBoldFont();
            }
            for (const tickMark of tickMarks) {
                if (tickMark.weight >= maxWeight) {
                    const coordinate = tickMark.needAlignCoordinate ? this._private__alignTickMarkLabelCoordinate(ctx, tickMark.coord, tickMark.label) : tickMark.coord;
                    ctx.fillText(tickMark.label, coordinate, yText);
                }
            }
        });
    }
    _private__alignTickMarkLabelCoordinate(ctx, coordinate, labelText) {
        const labelWidth = this._private__widthCache._internal_measureText(ctx, labelText);
        const labelWidthHalf = labelWidth / 2;
        const leftTextCoordinate = Math.floor(coordinate - labelWidthHalf) + 0.5;
        if (leftTextCoordinate < 0) {
            coordinate = coordinate + Math.abs(0 - leftTextCoordinate);
        }
        else if (leftTextCoordinate + labelWidth > this._private__size.width) {
            coordinate = coordinate - Math.abs(this._private__size.width - (leftTextCoordinate + labelWidth));
        }
        return coordinate;
    }
    _private__drawLabels(sources, target) {
        const rendererOptions = this._private__getRendererOptions();
        for (const source of sources) {
            for (const view of source._internal_timeAxisViews()) {
                view._internal_renderer()._internal_draw(target, rendererOptions);
            }
        }
    }
    _private__lineColor() {
        return this._private__chart._internal_options().timeScale.borderColor;
    }
    _private__textColor() {
        return this._private__options.textColor;
    }
    _private__fontSize() {
        return this._private__options.fontSize;
    }
    _private__baseFont() {
        return makeFont(this._private__fontSize(), this._private__options.fontFamily);
    }
    _private__baseBoldFont() {
        return makeFont(this._private__fontSize(), this._private__options.fontFamily, 'bold');
    }
    _private__getRendererOptions() {
        if (this._private__rendererOptions === null) {
            this._private__rendererOptions = {
                _internal_borderSize: 1 /* Constants.BorderSize */,
                _internal_baselineOffset: NaN,
                _internal_paddingTop: NaN,
                _internal_paddingBottom: NaN,
                _internal_paddingHorizontal: NaN,
                _internal_tickLength: 5 /* Constants.TickLength */,
                _internal_fontSize: NaN,
                _internal_font: '',
                _internal_widthCache: new TextWidthCache(),
                _internal_labelBottomOffset: 0,
            };
        }
        const rendererOptions = this._private__rendererOptions;
        const newFont = this._private__baseFont();
        if (rendererOptions._internal_font !== newFont) {
            const fontSize = this._private__fontSize();
            rendererOptions._internal_fontSize = fontSize;
            rendererOptions._internal_font = newFont;
            rendererOptions._internal_paddingTop = 3 * fontSize / 12;
            rendererOptions._internal_paddingBottom = 3 * fontSize / 12;
            rendererOptions._internal_paddingHorizontal = 9 * fontSize / 12;
            rendererOptions._internal_baselineOffset = 0;
            rendererOptions._internal_labelBottomOffset = 4 * fontSize / 12;
            rendererOptions._internal_widthCache._internal_reset();
        }
        return this._private__rendererOptions;
    }
    _private__setCursor(type) {
        this._private__cell.style.cursor = type === 1 /* CursorType.EwResize */ ? 'ew-resize' : 'default';
    }
    _private__recreateStubs() {
        const model = this._private__chart._internal_model();
        const options = model._internal_options();
        if (!options.leftPriceScale.visible && this._private__leftStub !== null) {
            this._private__leftStubCell.removeChild(this._private__leftStub._internal_getElement());
            this._private__leftStub._internal_destroy();
            this._private__leftStub = null;
        }
        if (!options.rightPriceScale.visible && this._private__rightStub !== null) {
            this._private__rightStubCell.removeChild(this._private__rightStub._internal_getElement());
            this._private__rightStub._internal_destroy();
            this._private__rightStub = null;
        }
        const rendererOptionsProvider = this._private__chart._internal_model()._internal_rendererOptionsProvider();
        const params = {
            _internal_rendererOptionsProvider: rendererOptionsProvider,
        };
        const borderVisibleGetter = () => {
            return options.leftPriceScale.borderVisible && model._internal_timeScale()._internal_options().borderVisible;
        };
        const bottomColorGetter = () => model._internal_backgroundBottomColor();
        if (options.leftPriceScale.visible && this._private__leftStub === null) {
            this._private__leftStub = new PriceAxisStub('left', options, params, borderVisibleGetter, bottomColorGetter);
            this._private__leftStubCell.appendChild(this._private__leftStub._internal_getElement());
        }
        if (options.rightPriceScale.visible && this._private__rightStub === null) {
            this._private__rightStub = new PriceAxisStub('right', options, params, borderVisibleGetter, bottomColorGetter);
            this._private__rightStubCell.appendChild(this._private__rightStub._internal_getElement());
        }
    }
}
