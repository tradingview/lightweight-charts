import { PriceAxisViewRenderer } from '../../renderers/price-axis-view-renderer';
export class PriceAxisView {
    constructor(ctor) {
        this._private__commonRendererData = {
            _internal_coordinate: 0,
            _internal_background: '#000',
            _internal_additionalPaddingBottom: 0,
            _internal_additionalPaddingTop: 0,
        };
        this._private__axisRendererData = {
            _internal_text: '',
            _internal_visible: false,
            _internal_tickVisible: true,
            _internal_moveTextToInvisibleTick: false,
            _internal_borderColor: '',
            _internal_color: '#FFF',
            _internal_borderVisible: false,
            _internal_separatorVisible: false,
        };
        this._private__paneRendererData = {
            _internal_text: '',
            _internal_visible: false,
            _internal_tickVisible: false,
            _internal_moveTextToInvisibleTick: true,
            _internal_borderColor: '',
            _internal_color: '#FFF',
            _internal_borderVisible: true,
            _internal_separatorVisible: true,
        };
        this._private__invalidated = true;
        this._private__axisRenderer = new (ctor || PriceAxisViewRenderer)(this._private__axisRendererData, this._private__commonRendererData);
        this._private__paneRenderer = new (ctor || PriceAxisViewRenderer)(this._private__paneRendererData, this._private__commonRendererData);
    }
    _internal_text() {
        this._private__updateRendererDataIfNeeded();
        return this._private__axisRendererData._internal_text;
    }
    _internal_coordinate() {
        this._private__updateRendererDataIfNeeded();
        return this._private__commonRendererData._internal_coordinate;
    }
    _internal_update() {
        this._private__invalidated = true;
    }
    _internal_height(rendererOptions, useSecondLine = false) {
        return Math.max(this._private__axisRenderer._internal_height(rendererOptions, useSecondLine), this._private__paneRenderer._internal_height(rendererOptions, useSecondLine));
    }
    _internal_getFixedCoordinate() {
        return this._private__commonRendererData._internal_fixedCoordinate || 0;
    }
    _internal_setFixedCoordinate(value) {
        this._private__commonRendererData._internal_fixedCoordinate = value;
    }
    _internal_isVisible() {
        this._private__updateRendererDataIfNeeded();
        return this._private__axisRendererData._internal_visible || this._private__paneRendererData._internal_visible;
    }
    _internal_isAxisLabelVisible() {
        this._private__updateRendererDataIfNeeded();
        return this._private__axisRendererData._internal_visible;
    }
    _internal_renderer(priceScale) {
        this._private__updateRendererDataIfNeeded();
        // force update tickVisible state from price scale options
        // because we don't have and we can't have price axis in other methods
        // (like paneRenderer or any other who call _updateRendererDataIfNeeded)
        this._private__axisRendererData._internal_tickVisible = this._private__axisRendererData._internal_tickVisible && priceScale._internal_options().ticksVisible;
        this._private__paneRendererData._internal_tickVisible = this._private__paneRendererData._internal_tickVisible && priceScale._internal_options().ticksVisible;
        this._private__axisRenderer._internal_setData(this._private__axisRendererData, this._private__commonRendererData);
        this._private__paneRenderer._internal_setData(this._private__paneRendererData, this._private__commonRendererData);
        return this._private__axisRenderer;
    }
    _internal_paneRenderer() {
        this._private__updateRendererDataIfNeeded();
        this._private__axisRenderer._internal_setData(this._private__axisRendererData, this._private__commonRendererData);
        this._private__paneRenderer._internal_setData(this._private__paneRendererData, this._private__commonRendererData);
        return this._private__paneRenderer;
    }
    _private__updateRendererDataIfNeeded() {
        if (this._private__invalidated) {
            this._private__axisRendererData._internal_tickVisible = true;
            this._private__paneRendererData._internal_tickVisible = false;
            this._internal__updateRendererData(this._private__axisRendererData, this._private__paneRendererData, this._private__commonRendererData);
        }
    }
}
