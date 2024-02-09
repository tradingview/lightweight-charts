"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarsPaneViewBase = void 0;
const strict_type_checks_1 = require("../../helpers/strict-type-checks");
const series_pane_view_base_1 = require("./series-pane-view-base");
class BarsPaneViewBase extends series_pane_view_base_1.SeriesPaneViewBase {
    constructor(series, model) {
        super(series, model, false);
    }
    _convertToCoordinates(priceScale, timeScale, firstValue) {
        timeScale.indexesToCoordinates(this._items, (0, strict_type_checks_1.undefinedIfNull)(this._itemsVisibleRange));
        priceScale.barPricesToCoordinates(this._items, firstValue, (0, strict_type_checks_1.undefinedIfNull)(this._itemsVisibleRange));
    }
    _createDefaultItem(time, bar, colorer) {
        return {
            time: time,
            open: bar.value[0 /* PlotRowValueIndex.Open */],
            high: bar.value[1 /* PlotRowValueIndex.High */],
            low: bar.value[2 /* PlotRowValueIndex.Low */],
            close: bar.value[3 /* PlotRowValueIndex.Close */],
            x: NaN,
            openY: NaN,
            highY: NaN,
            lowY: NaN,
            closeY: NaN,
        };
    }
    _fillRawPoints() {
        const colorer = this._series.barColorer();
        this._items = this._series.bars().rows().map((row) => this._createRawItem(row.index, row, colorer));
    }
}
exports.BarsPaneViewBase = BarsPaneViewBase;
