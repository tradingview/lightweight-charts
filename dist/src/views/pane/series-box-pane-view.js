import { BoxRenderer } from '../../renderers/box-renderer';
export class SeriesBoxPaneView {
    constructor(series) {
        this._boxRendererData = {
            fillColor: '#000',
            fillOpacity: 1,
            borderColor: '#000',
            borderStyle: 0 /* LineStyle.Solid */,
            borderWidth: 1,
            borderVisible: false,
            corners: [],
            xLow: 0,
            xHigh: 0,
            yLow: 0,
            yHigh: 0,
            visible: false,
            width: 0,
            height: 0,
        };
        this._boxRenderer = new BoxRenderer();
        this._invalidated = true;
        this._series = series;
        this._model = series.model();
        this._boxRenderer.setData(this._boxRendererData);
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
        return this._boxRenderer;
    }
}
