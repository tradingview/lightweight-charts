import { HorizontalLineRenderer } from '../../renderers/horizontal-line-renderer';
export class SeriesHorizontalLinePaneView {
    constructor(series) {
        this._internal__lineRendererData = {
            _internal_y: 0,
            _internal_color: 'rgba(0, 0, 0, 0)',
            _internal_lineWidth: 1,
            _internal_lineStyle: 0 /* LineStyle.Solid */,
            _internal_visible: false,
        };
        this._internal__lineRenderer = new HorizontalLineRenderer();
        this._private__invalidated = true;
        this._internal__series = series;
        this._internal__model = series._internal_model();
        this._internal__lineRenderer._internal_setData(this._internal__lineRendererData);
    }
    _internal_update() {
        this._private__invalidated = true;
    }
    _internal_renderer() {
        if (!this._internal__series._internal_visible()) {
            return null;
        }
        if (this._private__invalidated) {
            this._internal__updateImpl();
            this._private__invalidated = false;
        }
        return this._internal__lineRenderer;
    }
}
