import { undefinedIfNull } from '../../helpers/strict-type-checks';
import { SeriesPaneViewBase } from './series-pane-view-base';
class CustomSeriesPaneRendererWrapper {
    constructor(sourceRenderer, priceScale) {
        this._private__sourceRenderer = sourceRenderer;
        this._private__priceScale = priceScale;
    }
    _internal_draw(target, isHovered, hitTestData) {
        this._private__sourceRenderer.draw(target, this._private__priceScale, isHovered, hitTestData);
    }
}
export class SeriesCustomPaneView extends SeriesPaneViewBase {
    constructor(series, model, paneView) {
        super(series, model, false);
        this._private__paneView = paneView;
        this._internal__renderer = new CustomSeriesPaneRendererWrapper(this._private__paneView.renderer(), (price) => {
            const firstValue = series._internal_firstValue();
            if (firstValue === null) {
                return null;
            }
            return series._internal_priceScale()._internal_priceToCoordinate(price, firstValue._internal_value);
        });
    }
    _internal_priceValueBuilder(plotRow) {
        return this._private__paneView.priceValueBuilder(plotRow);
    }
    _internal_isWhitespace(data) {
        return this._private__paneView.isWhitespace(data);
    }
    _internal__fillRawPoints() {
        const colorer = this._internal__series._internal_barColorer();
        this._internal__items = this._internal__series._internal_bars()._internal_rows()
            .map((row) => {
            return Object.assign(Object.assign({ _internal_time: row._internal_index, _internal_x: NaN }, colorer._internal_barStyle(row._internal_index)), { _internal_originalData: row._internal_data });
        });
    }
    _internal__convertToCoordinates(priceScale, timeScale) {
        timeScale._internal_indexesToCoordinates(this._internal__items, undefinedIfNull(this._internal__itemsVisibleRange));
    }
    _internal__prepareRendererData() {
        this._private__paneView.update({
            bars: this._internal__items.map(unwrapItemData),
            barSpacing: this._internal__model._internal_timeScale()._internal_barSpacing(),
            visibleRange: this._internal__itemsVisibleRange,
        }, this._internal__series._internal_options());
    }
}
function unwrapItemData(item) {
    return {
        x: item._internal_x,
        time: item._internal_time,
        originalData: item._internal_originalData,
        barColor: item._internal_barColor,
    };
}
