import { undefinedIfNull } from '../../helpers/strict-type-checks';
import { SeriesPaneViewBase } from './series-pane-view-base';
export class LinePaneViewBase extends SeriesPaneViewBase {
    constructor(series, model) {
        super(series, model, true);
    }
    _convertToCoordinates(priceScale, timeScale, firstValue) {
        timeScale.indexesToCoordinates(this._items, undefinedIfNull(this._itemsVisibleRange));
        priceScale.pointsArrayToCoordinates(this._items, firstValue, undefinedIfNull(this._itemsVisibleRange));
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
