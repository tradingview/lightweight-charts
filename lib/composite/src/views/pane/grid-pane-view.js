"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GridPaneView = void 0;
const grid_renderer_1 = require("../../renderers/grid-renderer");
class GridPaneView {
    constructor(pane) {
        this._renderer = new grid_renderer_1.GridRenderer();
        this._invalidated = true;
        this._pane = pane;
    }
    update() {
        this._invalidated = true;
    }
    renderer() {
        if (this._invalidated) {
            const gridOptions = this._pane.model().options().grid;
            const data = {
                horzLinesVisible: gridOptions.horzLines.visible,
                vertLinesVisible: gridOptions.vertLines.visible,
                horzLinesColor: gridOptions.horzLines.color,
                vertLinesColor: gridOptions.vertLines.color,
                horzLineStyle: gridOptions.horzLines.style,
                vertLineStyle: gridOptions.vertLines.style,
                priceMarks: this._pane.defaultPriceScale().marks(),
                // need this conversiom because TimeMark is a part of external interface
                // and fields inside TimeMark are not minified
                timeMarks: (this._pane.model().timeScale().marks() || []).map((tm) => {
                    return { coord: tm.coord };
                }),
            };
            this._renderer.setData(data);
            this._invalidated = false;
        }
        return this._renderer;
    }
}
exports.GridPaneView = GridPaneView;
