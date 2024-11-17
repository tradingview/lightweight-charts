import { undefinedIfNull } from '../../helpers/strict-type-checks';
import { SeriesPaneViewBase } from './series-pane-view-base';
class CustomSeriesPaneRendererWrapper {
    constructor(sourceRenderer, priceScale) {
        this._sourceRenderer = sourceRenderer;
        this._priceScale = priceScale;
    }
    draw(target, isHovered, hitTestData) {
        this._sourceRenderer.draw(target, this._priceScale, isHovered, hitTestData);
    }
}
export class SeriesCustomPaneView extends SeriesPaneViewBase {
    constructor(series, model, paneView) {
        super(series, model, false);
        this._paneView = paneView;
        this._renderer = new CustomSeriesPaneRendererWrapper(this._paneView.renderer(), (price) => {
            const firstValue = series.firstValue();
            if (firstValue === null) {
                return null;
            }
            return series.priceScale().priceToCoordinate(price, firstValue.value);
        });
    }
    priceValueBuilder(plotRow) {
        return this._paneView.priceValueBuilder(plotRow);
    }
    isWhitespace(data) {
        return this._paneView.isWhitespace(data);
    }
    _fillRawPoints() {
        const colorer = this._series.barColorer();
        this._items = this._series
            .bars()
            .rows()
            .map((row) => {
            return Object.assign(Object.assign({ time: row.index, x: NaN }, colorer.barStyle(row.index)), { originalData: row.data });
        });
    }
    _convertToCoordinates(priceScale, timeScale) {
        timeScale.indexesToCoordinates(this._items, undefinedIfNull(this._itemsVisibleRange));
    }
    _prepareRendererData() {
        this._paneView.update({
            bars: this._items.map(unwrapItemData),
            barSpacing: this._model.timeScale().barSpacing(),
            visibleRange: this._itemsVisibleRange,
        }, this._series.options());
    }
}
function unwrapItemData(item) {
    return {
        x: item.x,
        time: item.time,
        originalData: item.originalData,
        barColor: item.barColor,
    };
}
