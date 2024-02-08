import { visibleTimedValues } from '../../model/time-data';
export class SeriesPaneViewBase {
    constructor(series, model, extendedVisibleRange) {
        this._internal__invalidated = true;
        this._internal__dataInvalidated = true;
        this._internal__optionsInvalidated = true;
        this._internal__items = [];
        this._internal__itemsVisibleRange = null;
        this._internal__series = series;
        this._internal__model = model;
        this._private__extendedVisibleRange = extendedVisibleRange;
    }
    _internal_update(updateType) {
        this._internal__invalidated = true;
        if (updateType === 'data') {
            this._internal__dataInvalidated = true;
        }
        if (updateType === 'options') {
            this._internal__optionsInvalidated = true;
        }
    }
    _internal_renderer() {
        if (!this._internal__series._internal_visible()) {
            return null;
        }
        this._private__makeValid();
        return this._internal__itemsVisibleRange === null ? null : this._internal__renderer;
    }
    _internal__updateOptions() {
        this._internal__items = this._internal__items.map((item) => (Object.assign(Object.assign({}, item), this._internal__series._internal_barColorer()._internal_barStyle(item._internal_time))));
    }
    _internal__clearVisibleRange() {
        this._internal__itemsVisibleRange = null;
    }
    _private__makeValid() {
        if (this._internal__dataInvalidated) {
            this._internal__fillRawPoints();
            this._internal__dataInvalidated = false;
        }
        if (this._internal__optionsInvalidated) {
            this._internal__updateOptions();
            this._internal__optionsInvalidated = false;
        }
        if (this._internal__invalidated) {
            this._private__makeValidImpl();
            this._internal__invalidated = false;
        }
    }
    _private__makeValidImpl() {
        const priceScale = this._internal__series._internal_priceScale();
        const timeScale = this._internal__model._internal_timeScale();
        this._internal__clearVisibleRange();
        if (timeScale._internal_isEmpty() || priceScale._internal_isEmpty()) {
            return;
        }
        const visibleBars = timeScale._internal_visibleStrictRange();
        if (visibleBars === null) {
            return;
        }
        if (this._internal__series._internal_bars()._internal_size() === 0) {
            return;
        }
        const firstValue = this._internal__series._internal_firstValue();
        if (firstValue === null) {
            return;
        }
        this._internal__itemsVisibleRange = visibleTimedValues(this._internal__items, visibleBars, this._private__extendedVisibleRange);
        this._internal__convertToCoordinates(priceScale, timeScale, firstValue._internal_value);
        this._internal__prepareRendererData();
    }
}
