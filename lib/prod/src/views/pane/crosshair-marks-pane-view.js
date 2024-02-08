import { ensureNotNull } from '../../helpers/assertions';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { PaneRendererMarks } from '../../renderers/marks-renderer';
function createEmptyMarkerData() {
    return {
        _internal_items: [{
                _internal_x: 0,
                _internal_y: 0,
                _internal_time: 0,
                _internal_price: 0,
            }],
        _internal_lineColor: '',
        _internal_backColor: '',
        _internal_radius: 0,
        _internal_lineWidth: 0,
        _internal_visibleRange: null,
    };
}
const rangeForSinglePoint = { from: 0, to: 1 };
export class CrosshairMarksPaneView {
    constructor(chartModel, crosshair) {
        this._private__compositeRenderer = new CompositeRenderer();
        this._private__markersRenderers = [];
        this._private__markersData = [];
        this._private__invalidated = true;
        this._private__chartModel = chartModel;
        this._private__crosshair = crosshair;
        this._private__compositeRenderer._internal_setRenderers(this._private__markersRenderers);
    }
    _internal_update(updateType) {
        const serieses = this._private__chartModel._internal_serieses();
        if (serieses.length !== this._private__markersRenderers.length) {
            this._private__markersData = serieses.map(createEmptyMarkerData);
            this._private__markersRenderers = this._private__markersData.map((data) => {
                const res = new PaneRendererMarks();
                res._internal_setData(data);
                return res;
            });
            this._private__compositeRenderer._internal_setRenderers(this._private__markersRenderers);
        }
        this._private__invalidated = true;
    }
    _internal_renderer() {
        if (this._private__invalidated) {
            this._private__updateImpl();
            this._private__invalidated = false;
        }
        return this._private__compositeRenderer;
    }
    _private__updateImpl() {
        const forceHidden = this._private__crosshair._internal_options().mode === 2 /* CrosshairMode.Hidden */;
        const serieses = this._private__chartModel._internal_serieses();
        const timePointIndex = this._private__crosshair._internal_appliedIndex();
        const timeScale = this._private__chartModel._internal_timeScale();
        serieses.forEach((s, index) => {
            var _a;
            const data = this._private__markersData[index];
            const seriesData = s._internal_markerDataAtIndex(timePointIndex);
            if (forceHidden || seriesData === null || !s._internal_visible()) {
                data._internal_visibleRange = null;
                return;
            }
            const firstValue = ensureNotNull(s._internal_firstValue());
            data._internal_lineColor = seriesData._internal_backgroundColor;
            data._internal_radius = seriesData._internal_radius;
            data._internal_lineWidth = seriesData._internal_borderWidth;
            data._internal_items[0]._internal_price = seriesData._internal_price;
            data._internal_items[0]._internal_y = s._internal_priceScale()._internal_priceToCoordinate(seriesData._internal_price, firstValue._internal_value);
            data._internal_backColor = (_a = seriesData._internal_borderColor) !== null && _a !== void 0 ? _a : this._private__chartModel._internal_backgroundColorAtYPercentFromTop(data._internal_items[0]._internal_y / s._internal_priceScale()._internal_height());
            data._internal_items[0]._internal_time = timePointIndex;
            data._internal_items[0]._internal_x = timeScale._internal_indexToCoordinate(timePointIndex);
            data._internal_visibleRange = rangeForSinglePoint;
        });
    }
}
