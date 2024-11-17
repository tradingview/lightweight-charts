import { WatermarkPaneView } from '../views/pane/watermark-pane-view';
import { DataSource } from './data-source';
export class Watermark extends DataSource {
    constructor(model, options) {
        super();
        this._options = options;
        this._paneView = new WatermarkPaneView(this);
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
