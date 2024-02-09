"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Watermark = void 0;
const watermark_pane_view_1 = require("../views/pane/watermark-pane-view");
const data_source_1 = require("./data-source");
class Watermark extends data_source_1.DataSource {
    constructor(model, options) {
        super();
        this._options = options;
        this._paneView = new watermark_pane_view_1.WatermarkPaneView(this);
    }
    priceAxisViews() {
        return [];
    }
    paneViews() {
        return [this._paneView];
    }
    options() {
        return this._options;
    }
    updateAllViews() {
        this._paneView.update();
    }
}
exports.Watermark = Watermark;
