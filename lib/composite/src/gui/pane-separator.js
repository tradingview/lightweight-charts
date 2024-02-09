"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaneSeparator = exports.SEPARATOR_HEIGHT = void 0;
const mathex_1 = require("../helpers/mathex");
const mouse_event_handler_1 = require("./mouse-event-handler");
exports.SEPARATOR_HEIGHT = 1;
class PaneSeparator {
    constructor(chartWidget, topPaneIndex, bottomPaneIndex, disableResize) {
        this._startY = 0;
        this._deltaY = 0;
        this._totalHeight = 0;
        this._totalStretch = 0;
        this._minPaneHeight = 0;
        this._maxPaneHeight = 0;
        this._pixelStretchFactor = 0;
        this._chartWidget = chartWidget;
        this._paneA = chartWidget.paneWidgets()[topPaneIndex];
        this._paneB = chartWidget.paneWidgets()[bottomPaneIndex];
        this._rowElement = document.createElement('tr');
        this._rowElement.style.height = exports.SEPARATOR_HEIGHT + 'px';
        this._cell = document.createElement('td');
        this._cell.style.padding = '0';
        this._cell.setAttribute('colspan', '3');
        this._updateBorderColor();
        this._rowElement.appendChild(this._cell);
        if (disableResize) {
            this._handle = null;
            this._mouseEventHandler = null;
        }
        else {
            this._handle = document.createElement('div');
            this._handle.style.position = 'absolute';
            this._handle.style.zIndex = '50';
            this._handle.style.height = '5px';
            this._handle.style.width = '100%';
            this._handle.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
            this._handle.style.cursor = 'ns-resize';
            this._cell.appendChild(this._handle);
            const handlers = {
                mouseDownEvent: this._mouseDownEvent.bind(this),
                touchStartEvent: this._mouseDownEvent.bind(this),
                pressedMouseMoveEvent: this._pressedMouseMoveEvent.bind(this),
                touchMoveEvent: this._pressedMouseMoveEvent.bind(this),
                mouseUpEvent: this._mouseUpEvent.bind(this),
                touchEndEvent: this._mouseUpEvent.bind(this),
            };
            this._mouseEventHandler = new mouse_event_handler_1.MouseEventHandler(this._handle, handlers, {
                treatVertTouchDragAsPageScroll: () => false,
                treatHorzTouchDragAsPageScroll: () => true,
            });
        }
    }
    destroy() {
        if (this._mouseEventHandler !== null) {
            this._mouseEventHandler.destroy();
        }
    }
    getElement() {
        return this._rowElement;
    }
    // public getSize(): Size {
    // 	return size({
    // 		width: this._paneA.getSize().width,
    // 		height: SEPARATOR_HEIGHT,
    // 	});
    // }
    // public getBitmapSize(): Size {
    // 	return size({
    // 		width: this._paneA.getBitmapSize().width,
    // 		height: SEPARATOR_HEIGHT * window.devicePixelRatio,
    // 	});
    // }
    // public drawBitmap(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // 	const bitmapSize = this.getBitmapSize();
    // 	ctx.fillStyle = this._chartWidget.options().timeScale.borderColor;
    // 	ctx.fillRect(x, y, bitmapSize.width, bitmapSize.height);
    // }
    update() {
        this._updateBorderColor();
    }
    _updateBorderColor() {
        this._cell.style.background = this._chartWidget.options().timeScale.borderColor;
    }
    _mouseDownEvent(event) {
        this._startY = event.pageY;
        this._deltaY = 0;
        this._totalHeight = this._paneA.getSize().height + this._paneB.getSize().height;
        this._totalStretch = this._paneA.stretchFactor() + this._paneB.stretchFactor();
        this._minPaneHeight = 30;
        this._maxPaneHeight = this._totalHeight - this._minPaneHeight;
        this._pixelStretchFactor = this._totalStretch / this._totalHeight;
    }
    _pressedMouseMoveEvent(event) {
        this._deltaY = (event.pageY - this._startY);
        const upperHeight = this._paneA.getSize().height;
        const newUpperPaneHeight = (0, mathex_1.clamp)(upperHeight + this._deltaY, this._minPaneHeight, this._maxPaneHeight);
        const newUpperPaneStretch = newUpperPaneHeight * this._pixelStretchFactor;
        const newLowerPaneStretch = this._totalStretch - newUpperPaneStretch;
        this._paneA.setStretchFactor(newUpperPaneStretch);
        this._paneB.setStretchFactor(newLowerPaneStretch);
        this._chartWidget.model().fullUpdate();
        if (this._paneA.getSize().height !== upperHeight) {
            this._startY = event.pageY;
        }
    }
    _mouseUpEvent(event) {
        this._startY = 0;
        this._deltaY = 0;
        this._totalHeight = 0;
        this._totalStretch = 0;
        this._minPaneHeight = 0;
        this._maxPaneHeight = 0;
        this._pixelStretchFactor = 0;
    }
}
exports.PaneSeparator = PaneSeparator;
