import { WatermarkPaneView } from '../views/pane/watermark-pane-view';
import { DataSource } from './data-source';
export class Watermark extends DataSource {
    constructor(model, options) {
        super();
        this._private__options = options;
        this._private__paneView = new WatermarkPaneView(this);
    }
    _internal_priceAxisViews() {
        return [];
    }
    _internal_paneViews() {
        return [this._private__paneView];
    }
    _internal_options() {
        return this._private__options;
    }
    _internal_updateAllViews() {
        this._private__paneView._internal_update();
    }
}
