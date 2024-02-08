export class DataSource {
    constructor() {
        this._internal__priceScale = null;
        this._private__zorder = 0;
    }
    _internal_zorder() {
        return this._private__zorder;
    }
    _internal_setZorder(zorder) {
        this._private__zorder = zorder;
    }
    _internal_priceScale() {
        return this._internal__priceScale;
    }
    _internal_setPriceScale(priceScale) {
        this._internal__priceScale = priceScale;
    }
    _internal_labelPaneViews(pane) {
        return [];
    }
    _internal_timeAxisViews() {
        return [];
    }
    _internal_visible() {
        return true;
    }
}
