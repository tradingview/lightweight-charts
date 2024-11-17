import { equalSizes, size, tryCreateCanvasRenderingTarget2D, } from 'fancy-canvas';
import { clearRect } from '../helpers/canvas-helpers';
import { Delegate } from '../helpers/delegate';
import { makeFont } from '../helpers/make-font';
import { TextWidthCache } from '../model/text-width-cache';
import { createBoundCanvas, releaseCanvas } from './canvas-utils';
import { drawBackground, drawForeground, drawSourcePaneViews } from './draw-functions';
import { MouseEventHandler } from './mouse-event-handler';
import { PriceAxisStub } from './price-axis-stub';
function buildTimeAxisViewsGetter(zOrder) {
    return (source) => { var _a, _b; return (_b = (_a = source.timePaneViews) === null || _a === void 0 ? void 0 : _a.call(source, zOrder)) !== null && _b !== void 0 ? _b : []; };
}
const sourcePaneViews = buildTimeAxisViewsGetter('normal');
const sourceTopPaneViews = buildTimeAxisViewsGetter('top');
const sourceBottomPaneViews = buildTimeAxisViewsGetter('bottom');
export class TimeAxisWidget {
    constructor(chartWidget, horzScaleBehavior) {
        this._leftStub = null;
        this._rightStub = null;
        this._rendererOptions = null;
        this._mouseDown = false;
        this._size = size({ width: 0, height: 0 });
        this._sizeChanged = new Delegate();
        this._widthCache = new TextWidthCache(5);
        this._isSettingSize = false;
        this._canvasSuggestedBitmapSizeChangedHandler = () => {
            if (!this._isSettingSize) {
                this._chart.model().lightUpdate();
            }
        };
        this._topCanvasSuggestedBitmapSizeChangedHandler = () => {
            if (!this._isSettingSize) {
                this._chart.model().lightUpdate();
            }
        };
        this._chart = chartWidget;
        this._horzScaleBehavior = horzScaleBehavior;
        this._options = chartWidget.options().layout;
        this._element = document.createElement('tr');
        this._leftStubCell = document.createElement('td');
        this._leftStubCell.style.padding = '0';
        this._rightStubCell = document.createElement('td');
        this._rightStubCell.style.padding = '0';
        this._cell = document.createElement('td');
        this._cell.style.height = '25px';
        this._cell.style.padding = '0';
        this._dv = document.createElement('div');
        this._dv.style.width = '100%';
        this._dv.style.height = '100%';
        this._dv.style.position = 'relative';
        this._dv.style.overflow = 'hidden';
        this._cell.appendChild(this._dv);
        this._canvasBinding = createBoundCanvas(this._dv, size({ width: 16, height: 16 }));
        this._canvasBinding.subscribeSuggestedBitmapSizeChanged(this._canvasSuggestedBitmapSizeChangedHandler);
        const canvas = this._canvasBinding.canvasElement;
        canvas.style.position = 'absolute';
        canvas.style.zIndex = '1';
        canvas.style.left = '0';
        canvas.style.top = '0';
        this._topCanvasBinding = createBoundCanvas(this._dv, size({ width: 16, height: 16 }));
        this._topCanvasBinding.subscribeSuggestedBitmapSizeChanged(this._topCanvasSuggestedBitmapSizeChangedHandler);
        const topCanvas = this._topCanvasBinding.canvasElement;
        topCanvas.style.position = 'absolute';
        topCanvas.style.zIndex = '2';
        topCanvas.style.left = '0';
        topCanvas.style.top = '0';
        this._element.appendChild(this._leftStubCell);
        this._element.appendChild(this._cell);
        this._element.appendChild(this._rightStubCell);
        this._recreateStubs();
        this._chart.model().priceScalesOptionsChanged().subscribe(this._recreateStubs.bind(this), this);
        this._mouseEventHandler = new MouseEventHandler(this._topCanvasBinding.canvasElement, this, {
            treatVertTouchDragAsPageScroll: () => true,
            treatHorzTouchDragAsPageScroll: () => !this._chart.options().handleScroll.horzTouchDrag,
        });
    }
    destroy() {
        this._mouseEventHandler.destroy();
        if (this._leftStub !== null) {
            this._leftStub.destroy();
        }
        if (this._rightStub !== null) {
            this._rightStub.destroy();
        }
        this._topCanvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._topCanvasSuggestedBitmapSizeChangedHandler);
        releaseCanvas(this._topCanvasBinding.canvasElement);
        this._topCanvasBinding.dispose();
        this._canvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._canvasSuggestedBitmapSizeChangedHandler);
        releaseCanvas(this._canvasBinding.canvasElement);
        this._canvasBinding.dispose();
    }
    getElement() {
        return this._element;
    }
    leftStub() {
        return this._leftStub;
    }
    rightStub() {
        return this._rightStub;
    }
    mouseDownEvent(event) {
        if (this._mouseDown) {
            return;
        }
        this._mouseDown = true;
        const model = this._chart.model();
        if (model.timeScale().isEmpty() || !this._chart.options().handleScale.axisPressedMouseMove.time) {
            return;
        }
        model.startScaleTime(event.localX);
    }
    touchStartEvent(event) {
        this.mouseDownEvent(event);
    }
    mouseDownOutsideEvent() {
        const model = this._chart.model();
        if (!model.timeScale().isEmpty() && this._mouseDown) {
            this._mouseDown = false;
            if (this._chart.options().handleScale.axisPressedMouseMove.time) {
                model.endScaleTime();
            }
        }
    }
    pressedMouseMoveEvent(event) {
        const model = this._chart.model();
        if (model.timeScale().isEmpty() || !this._chart.options().handleScale.axisPressedMouseMove.time) {
            return;
        }
        model.scaleTimeTo(event.localX);
    }
    touchMoveEvent(event) {
        this.pressedMouseMoveEvent(event);
    }
    mouseUpEvent() {
        this._mouseDown = false;
        const model = this._chart.model();
        if (model.timeScale().isEmpty() && !this._chart.options().handleScale.axisPressedMouseMove.time) {
            return;
        }
        model.endScaleTime();
    }
    touchEndEvent() {
        this.mouseUpEvent();
    }
    mouseDoubleClickEvent() {
        if (this._chart.options().handleScale.axisDoubleClickReset.time) {
            this._chart.model().resetTimeScale();
        }
    }
    doubleTapEvent() {
        this.mouseDoubleClickEvent();
    }
    mouseEnterEvent() {
        if (this._chart.model().options().handleScale.axisPressedMouseMove.time) {
            this._setCursor(1 /* CursorType.EwResize */);
        }
    }
    mouseLeaveEvent() {
        this._setCursor(0 /* CursorType.Default */);
    }
    getSize() {
        return this._size;
    }
    sizeChanged() {
        return this._sizeChanged;
    }
    setSizes(timeAxisSize, leftStubWidth, rightStubWidth) {
        if (!equalSizes(this._size, timeAxisSize)) {
            this._size = timeAxisSize;
            this._isSettingSize = true;
            this._canvasBinding.resizeCanvasElement(timeAxisSize);
            this._topCanvasBinding.resizeCanvasElement(timeAxisSize);
            this._isSettingSize = false;
            this._cell.style.width = `${timeAxisSize.width}px`;
            this._cell.style.height = `${timeAxisSize.height}px`;
            this._sizeChanged.fire(timeAxisSize);
        }
        if (this._leftStub !== null) {
            this._leftStub.setSize(size({ width: leftStubWidth, height: timeAxisSize.height }));
        }
        if (this._rightStub !== null) {
            this._rightStub.setSize(size({ width: rightStubWidth, height: timeAxisSize.height }));
        }
    }
    optimalHeight() {
        const rendererOptions = this._getRendererOptions();
        return Math.ceil(
        // rendererOptions.offsetSize +
        rendererOptions.borderSize +
            rendererOptions.tickLength +
            rendererOptions.fontSize +
            rendererOptions.paddingTop +
            rendererOptions.paddingBottom +
            rendererOptions.labelBottomOffset);
    }
    update() {
        // this call has side-effect - it regenerates marks on the time scale
        this._chart.model().timeScale().marks();
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
        if (type !== 1 /* InvalidationLevel.Cursor */) {
            this._canvasBinding.applySuggestedBitmapSize();
            const target = tryCreateCanvasRenderingTarget2D(this._canvasBinding);
            if (target !== null) {
                target.useBitmapCoordinateSpace((scope) => {
                    this._drawBackground(scope);
                    this._drawBorder(scope);
                    this._drawAdditionalSources(target, sourceBottomPaneViews);
                });
                this._drawTickMarks(target);
                this._drawAdditionalSources(target, sourcePaneViews);
                // atm we don't have sources to be drawn on time axis except crosshair which is rendered on top level canvas
                // so let's don't call this code at all for now
                // this._drawLabels(this._chart.model().dataSources(), target);
            }
            if (this._leftStub !== null) {
                this._leftStub.paint(type);
            }
            if (this._rightStub !== null) {
                this._rightStub.paint(type);
            }
        }
        this._topCanvasBinding.applySuggestedBitmapSize();
        const topTarget = tryCreateCanvasRenderingTarget2D(this._topCanvasBinding);
        if (topTarget !== null) {
            topTarget.useBitmapCoordinateSpace(({ context: ctx, bitmapSize }) => {
                ctx.clearRect(0, 0, bitmapSize.width, bitmapSize.height);
            });
            this._drawLabels([...this._chart.model().serieses(), this._chart.model().crosshairSource()], topTarget);
            this._drawAdditionalSources(topTarget, sourceTopPaneViews);
        }
    }
    _drawAdditionalSources(target, axisViewsGetter) {
        const sources = this._chart.model().serieses();
        for (const source of sources) {
            drawSourcePaneViews(axisViewsGetter, (renderer) => drawBackground(renderer, target, false, undefined), source, undefined);
        }
        for (const source of sources) {
            drawSourcePaneViews(axisViewsGetter, (renderer) => drawForeground(renderer, target, false, undefined), source, undefined);
        }
    }
    _drawBackground({ context: ctx, bitmapSize }) {
        clearRect(ctx, 0, 0, bitmapSize.width, bitmapSize.height, this._chart.model().backgroundBottomColor());
    }
    _drawBorder({ context: ctx, bitmapSize, verticalPixelRatio }) {
        if (this._chart.options().timeScale.borderVisible) {
            ctx.fillStyle = this._lineColor();
            const borderSize = Math.max(1, Math.floor(this._getRendererOptions().borderSize * verticalPixelRatio));
            ctx.fillRect(0, 0, bitmapSize.width, borderSize);
        }
    }
    _drawTickMarks(target) {
        const timeScale = this._chart.model().timeScale();
        const tickMarks = timeScale.marks();
        if (!tickMarks || tickMarks.length === 0) {
            return;
        }
        const maxWeight = this._horzScaleBehavior.maxTickMarkWeight(tickMarks);
        const rendererOptions = this._getRendererOptions();
        const options = timeScale.options();
        if (options.borderVisible && options.ticksVisible) {
            target.useBitmapCoordinateSpace(({ context: ctx, horizontalPixelRatio, verticalPixelRatio }) => {
                ctx.strokeStyle = this._lineColor();
                ctx.fillStyle = this._lineColor();
                const tickWidth = Math.max(1, Math.floor(horizontalPixelRatio));
                const tickOffset = Math.floor(horizontalPixelRatio * 0.5);
                ctx.beginPath();
                const tickLen = Math.round(rendererOptions.tickLength * verticalPixelRatio);
                for (let index = tickMarks.length; index--;) {
                    const x = Math.round(tickMarks[index].coord * horizontalPixelRatio);
                    ctx.rect(x - tickOffset, 0, tickWidth, tickLen);
                }
                ctx.fill();
            });
        }
        target.useMediaCoordinateSpace(({ context: ctx }) => {
            const yText = (rendererOptions.borderSize +
                rendererOptions.tickLength +
                rendererOptions.paddingTop +
                rendererOptions.fontSize / 2);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = this._textColor();
            // draw base marks
            ctx.font = this._baseFont();
            for (const tickMark of tickMarks) {
                if (tickMark.weight < maxWeight) {
                    const coordinate = tickMark.needAlignCoordinate ? this._alignTickMarkLabelCoordinate(ctx, tickMark.coord, tickMark.label) : tickMark.coord;
                    ctx.fillText(tickMark.label, coordinate, yText);
                }
            }
            if (this._chart.options().timeScale.allowBoldLabels) {
                ctx.font = this._baseBoldFont();
            }
            for (const tickMark of tickMarks) {
                if (tickMark.weight >= maxWeight) {
                    const coordinate = tickMark.needAlignCoordinate ? this._alignTickMarkLabelCoordinate(ctx, tickMark.coord, tickMark.label) : tickMark.coord;
                    ctx.fillText(tickMark.label, coordinate, yText);
                }
            }
        });
    }
    _alignTickMarkLabelCoordinate(ctx, coordinate, labelText) {
        const labelWidth = this._widthCache.measureText(ctx, labelText);
        const labelWidthHalf = labelWidth / 2;
        const leftTextCoordinate = Math.floor(coordinate - labelWidthHalf) + 0.5;
        if (leftTextCoordinate < 0) {
            coordinate = coordinate + Math.abs(0 - leftTextCoordinate);
        }
        else if (leftTextCoordinate + labelWidth > this._size.width) {
            coordinate = coordinate - Math.abs(this._size.width - (leftTextCoordinate + labelWidth));
        }
        return coordinate;
    }
    _drawLabels(sources, target) {
        const rendererOptions = this._getRendererOptions();
        for (const source of sources) {
            for (const view of source.timeAxisViews()) {
                view.renderer().draw(target, rendererOptions);
            }
        }
    }
    _lineColor() {
        return this._chart.options().timeScale.borderColor;
    }
    _textColor() {
        return this._options.textColor;
    }
    _fontSize() {
        return this._options.fontSize;
    }
    _baseFont() {
        return makeFont(this._fontSize(), this._options.fontFamily);
    }
    _baseBoldFont() {
        return makeFont(this._fontSize(), this._options.fontFamily, 'bold');
    }
    _getRendererOptions() {
        if (this._rendererOptions === null) {
            this._rendererOptions = {
                borderSize: 1 /* Constants.BorderSize */,
                baselineOffset: NaN,
                paddingTop: NaN,
                paddingBottom: NaN,
                paddingHorizontal: NaN,
                tickLength: 5 /* Constants.TickLength */,
                fontSize: NaN,
                font: '',
                widthCache: new TextWidthCache(),
                labelBottomOffset: 0,
            };
        }
        const rendererOptions = this._rendererOptions;
        const newFont = this._baseFont();
        if (rendererOptions.font !== newFont) {
            const fontSize = this._fontSize();
            rendererOptions.fontSize = fontSize;
            rendererOptions.font = newFont;
            rendererOptions.paddingTop = 3 * fontSize / 12;
            rendererOptions.paddingBottom = 3 * fontSize / 12;
            rendererOptions.paddingHorizontal = 9 * fontSize / 12;
            rendererOptions.baselineOffset = 0;
            rendererOptions.labelBottomOffset = 4 * fontSize / 12;
            rendererOptions.widthCache.reset();
        }
        return this._rendererOptions;
    }
    _setCursor(type) {
        this._cell.style.cursor = type === 1 /* CursorType.EwResize */ ? 'ew-resize' : 'default';
    }
    _recreateStubs() {
        const model = this._chart.model();
        const options = model.options();
        if (!options.leftPriceScale.visible && this._leftStub !== null) {
            this._leftStubCell.removeChild(this._leftStub.getElement());
            this._leftStub.destroy();
            this._leftStub = null;
        }
        if (!options.rightPriceScale.visible && this._rightStub !== null) {
            this._rightStubCell.removeChild(this._rightStub.getElement());
            this._rightStub.destroy();
            this._rightStub = null;
        }
        const rendererOptionsProvider = this._chart.model().rendererOptionsProvider();
        const params = {
            rendererOptionsProvider: rendererOptionsProvider,
        };
        const borderVisibleGetter = () => {
            return options.leftPriceScale.borderVisible && model.timeScale().options().borderVisible;
        };
        const bottomColorGetter = () => model.backgroundBottomColor();
        if (options.leftPriceScale.visible && this._leftStub === null) {
            this._leftStub = new PriceAxisStub('left', options, params, borderVisibleGetter, bottomColorGetter);
            this._leftStubCell.appendChild(this._leftStub.getElement());
        }
        if (options.rightPriceScale.visible && this._rightStub === null) {
            this._rightStub = new PriceAxisStub('right', options, params, borderVisibleGetter, bottomColorGetter);
            this._rightStubCell.appendChild(this._rightStub.getElement());
        }
    }
}
