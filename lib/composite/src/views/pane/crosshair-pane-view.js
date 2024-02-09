"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrosshairPaneView = void 0;
const assertions_1 = require("../../helpers/assertions");
const crosshair_renderer_1 = require("../../renderers/crosshair-renderer");
class CrosshairPaneView {
    constructor(source) {
        this._invalidated = true;
        this._rendererData = {
            vertLine: {
                lineWidth: 1,
                lineStyle: 0,
                color: '',
                visible: false,
            },
            horzLine: {
                lineWidth: 1,
                lineStyle: 0,
                color: '',
                visible: false,
            },
            x: 0,
            y: 0,
        };
        this._renderer = new crosshair_renderer_1.CrosshairRenderer(this._rendererData);
        this._source = source;
    }
    update() {
        this._invalidated = true;
    }
    renderer() {
        if (this._invalidated) {
            this._updateImpl();
            this._invalidated = false;
        }
        return this._renderer;
    }
    _updateImpl() {
        const visible = this._source.visible();
        const pane = (0, assertions_1.ensureNotNull)(this._source.pane());
        const crosshairOptions = pane.model().options().crosshair;
        const data = this._rendererData;
        if (crosshairOptions.mode === 2 /* CrosshairMode.Hidden */) {
            data.horzLine.visible = false;
            data.vertLine.visible = false;
            return;
        }
        data.horzLine.visible = visible && this._source.horzLineVisible(pane);
        data.vertLine.visible = visible && this._source.vertLineVisible();
        data.horzLine.lineWidth = crosshairOptions.horzLine.width;
        data.horzLine.lineStyle = crosshairOptions.horzLine.style;
        data.horzLine.color = crosshairOptions.horzLine.color;
        data.vertLine.lineWidth = crosshairOptions.vertLine.width;
        data.vertLine.lineStyle = crosshairOptions.vertLine.style;
        data.vertLine.color = crosshairOptions.vertLine.color;
        data.x = this._source.appliedX();
        data.y = this._source.appliedY();
    }
}
exports.CrosshairPaneView = CrosshairPaneView;
