"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeriesPaneViewBase = void 0;
const time_data_1 = require("../../model/time-data");
class SeriesPaneViewBase {
    constructor(series, model, extendedVisibleRange) {
        this._invalidated = true;
        this._dataInvalidated = true;
        this._optionsInvalidated = true;
        this._items = [];
        this._itemsVisibleRange = null;
        this._series = series;
        this._model = model;
        this._extendedVisibleRange = extendedVisibleRange;
    }
    update(updateType) {
        this._invalidated = true;
        if (updateType === 'data') {
            this._dataInvalidated = true;
        }
        if (updateType === 'options') {
            this._optionsInvalidated = true;
        }
    }
    renderer() {
        if (!this._series.visible()) {
            return null;
        }
        this._makeValid();
        return this._itemsVisibleRange === null ? null : this._renderer;
    }
    _updateOptions() {
        this._items = this._items.map((item) => (Object.assign(Object.assign({}, item), this._series.barColorer().barStyle(item.time))));
    }
    _clearVisibleRange() {
        this._itemsVisibleRange = null;
    }
    _makeValid() {
        if (this._dataInvalidated) {
            this._fillRawPoints();
            this._dataInvalidated = false;
        }
        if (this._optionsInvalidated) {
            this._updateOptions();
            this._optionsInvalidated = false;
        }
        if (this._invalidated) {
            this._makeValidImpl();
            this._invalidated = false;
        }
    }
    _makeValidImpl() {
        const priceScale = this._series.priceScale();
        const timeScale = this._model.timeScale();
        this._clearVisibleRange();
        if (timeScale.isEmpty() || priceScale.isEmpty()) {
            return;
        }
        const visibleBars = timeScale.visibleStrictRange();
        if (visibleBars === null) {
            return;
        }
        if (this._series.bars().size() === 0) {
            return;
        }
        const firstValue = this._series.firstValue();
        if (firstValue === null) {
            return;
        }
        this._itemsVisibleRange = (0, time_data_1.visibleTimedValues)(this._items, visibleBars, this._extendedVisibleRange);
        this._convertToCoordinates(priceScale, timeScale, firstValue.value);
        this._prepareRendererData();
    }
}
exports.SeriesPaneViewBase = SeriesPaneViewBase;
