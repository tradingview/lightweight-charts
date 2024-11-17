import { HorizontalLineRenderer } from '../../renderers/horizontal-line-renderer';
export class SeriesHorizontalLinePaneView {
    constructor(series) {
        this._lineRendererData = {
            y: 0,
            color: 'rgba(0, 0, 0, 0)',
            lineWidth: 1,
            lineStyle: 0 /* LineStyle.Solid */,
            visible: false,
        };
        this._lineRenderer = new HorizontalLineRenderer();
        this._invalidated = true;
        this._series = series;
        this._model = series.model();
        this._lineRenderer.setData(this._lineRendererData);
    }
    update() {
        this._invalidated = true;
    }
    renderer() {
        if (!this._series.visible()) {
            return null;
        }
        if (this._invalidated) {
            this._updateImpl();
            this._invalidated = false;
        }
        return this._lineRenderer;
    }
}
