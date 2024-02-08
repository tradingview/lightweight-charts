import { GridPaneView } from '../views/pane/grid-pane-view';
export class Grid {
    constructor(pane) {
        this._private__paneView = new GridPaneView(pane);
    }
    _internal_paneView() {
        return this._private__paneView;
    }
}
