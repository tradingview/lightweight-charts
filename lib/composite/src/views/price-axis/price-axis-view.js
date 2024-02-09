"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceAxisView = void 0;
const price_axis_view_renderer_1 = require("../../renderers/price-axis-view-renderer");
class PriceAxisView {
    constructor(ctor) {
        this._commonRendererData = {
            coordinate: 0,
            background: '#000',
            additionalPaddingBottom: 0,
            additionalPaddingTop: 0,
        };
        this._axisRendererData = {
            text: '',
            visible: false,
            tickVisible: true,
            moveTextToInvisibleTick: false,
            borderColor: '',
            color: '#FFF',
            borderVisible: false,
            separatorVisible: false,
        };
        this._paneRendererData = {
            text: '',
            visible: false,
            tickVisible: false,
            moveTextToInvisibleTick: true,
            borderColor: '',
            color: '#FFF',
            borderVisible: true,
            separatorVisible: true,
        };
        this._invalidated = true;
        this._axisRenderer = new (ctor || price_axis_view_renderer_1.PriceAxisViewRenderer)(this._axisRendererData, this._commonRendererData);
        this._paneRenderer = new (ctor || price_axis_view_renderer_1.PriceAxisViewRenderer)(this._paneRendererData, this._commonRendererData);
    }
    text() {
        this._updateRendererDataIfNeeded();
        return this._axisRendererData.text;
    }
    coordinate() {
        this._updateRendererDataIfNeeded();
        return this._commonRendererData.coordinate;
    }
    update() {
        this._invalidated = true;
    }
    height(rendererOptions, useSecondLine = false) {
        return Math.max(this._axisRenderer.height(rendererOptions, useSecondLine), this._paneRenderer.height(rendererOptions, useSecondLine));
    }
    getFixedCoordinate() {
        return this._commonRendererData.fixedCoordinate || 0;
    }
    setFixedCoordinate(value) {
        this._commonRendererData.fixedCoordinate = value;
    }
    isVisible() {
        this._updateRendererDataIfNeeded();
        return this._axisRendererData.visible || this._paneRendererData.visible;
    }
    isAxisLabelVisible() {
        this._updateRendererDataIfNeeded();
        return this._axisRendererData.visible;
    }
    renderer(priceScale) {
        this._updateRendererDataIfNeeded();
        // force update tickVisible state from price scale options
        // because we don't have and we can't have price axis in other methods
        // (like paneRenderer or any other who call _updateRendererDataIfNeeded)
        this._axisRendererData.tickVisible = this._axisRendererData.tickVisible && priceScale.options().ticksVisible;
        this._paneRendererData.tickVisible = this._paneRendererData.tickVisible && priceScale.options().ticksVisible;
        this._axisRenderer.setData(this._axisRendererData, this._commonRendererData);
        this._paneRenderer.setData(this._paneRendererData, this._commonRendererData);
        return this._axisRenderer;
    }
    paneRenderer() {
        this._updateRendererDataIfNeeded();
        this._axisRenderer.setData(this._axisRendererData, this._commonRendererData);
        this._paneRenderer.setData(this._paneRendererData, this._commonRendererData);
        return this._paneRenderer;
    }
    _updateRendererDataIfNeeded() {
        if (this._invalidated) {
            this._axisRendererData.tickVisible = true;
            this._paneRendererData.tickVisible = false;
            this._updateRendererData(this._axisRendererData, this._paneRendererData, this._commonRendererData);
        }
    }
}
exports.PriceAxisView = PriceAxisView;
