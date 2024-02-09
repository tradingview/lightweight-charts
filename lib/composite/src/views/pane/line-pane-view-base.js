"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinePaneViewBase = void 0;
const strict_type_checks_1 = require("../../helpers/strict-type-checks");
const series_pane_view_base_1 = require("./series-pane-view-base");
class LinePaneViewBase extends series_pane_view_base_1.SeriesPaneViewBase {
    constructor(series, model) {
        super(series, model, true);
    }
    _convertToCoordinates(priceScale, timeScale, firstValue) {
        timeScale.indexesToCoordinates(this._items, (0, strict_type_checks_1.undefinedIfNull)(this._itemsVisibleRange));
        priceScale.pointsArrayToCoordinates(this._items, firstValue, (0, strict_type_checks_1.undefinedIfNull)(this._itemsVisibleRange));
    }
    _createRawItemBase(time, price) {
        return {
            time: time,
            price: price,
            x: NaN,
            y: NaN,
        };
    }
    _fillRawPoints() {
        const colorer = this._series.barColorer();
        this._items = this._series.bars().rows().map((row) => {
            const value = row.value[3 /* PlotRowValueIndex.Close */];
            return this._createRawItem(row.index, value, colorer);
        });
    }
}
exports.LinePaneViewBase = LinePaneViewBase;
