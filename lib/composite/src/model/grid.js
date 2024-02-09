"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Grid = void 0;
const grid_pane_view_1 = require("../views/pane/grid-pane-view");
class Grid {
    constructor(pane) {
        this._paneView = new grid_pane_view_1.GridPaneView(pane);
    }
    paneView() {
        return this._paneView;
    }
}
exports.Grid = Grid;
