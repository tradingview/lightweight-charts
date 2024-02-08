import { undefinedIfNull } from '../../helpers/strict-type-checks';
import { SeriesPaneViewBase } from './series-pane-view-base';
export class BarsPaneViewBase extends SeriesPaneViewBase {
    constructor(series, model) {
        super(series, model, false);
    }
    _internal__convertToCoordinates(priceScale, timeScale, firstValue) {
        timeScale._internal_indexesToCoordinates(this._internal__items, undefinedIfNull(this._internal__itemsVisibleRange));
        priceScale._internal_barPricesToCoordinates(this._internal__items, firstValue, undefinedIfNull(this._internal__itemsVisibleRange));
    }
    _internal__createDefaultItem(time, bar, colorer) {
        return {
            _internal_time: time,
            _internal_open: bar._internal_value[0 /* PlotRowValueIndex.Open */],
            _internal_high: bar._internal_value[1 /* PlotRowValueIndex.High */],
            _internal_low: bar._internal_value[2 /* PlotRowValueIndex.Low */],
            _internal_close: bar._internal_value[3 /* PlotRowValueIndex.Close */],
            _internal_x: NaN,
            _internal_openY: NaN,
            _internal_highY: NaN,
            _internal_lowY: NaN,
            _internal_closeY: NaN,
        };
    }
    _internal__fillRawPoints() {
        const colorer = this._internal__series._internal_barColorer();
        this._internal__items = this._internal__series._internal_bars()._internal_rows().map((row) => this._internal__createRawItem(row._internal_index, row, colorer));
    }
}
