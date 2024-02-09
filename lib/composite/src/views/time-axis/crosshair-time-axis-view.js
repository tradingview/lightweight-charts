"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrosshairTimeAxisView = void 0;
const assertions_1 = require("../../helpers/assertions");
const color_1 = require("../../helpers/color");
const time_axis_view_renderer_1 = require("../../renderers/time-axis-view-renderer");
class CrosshairTimeAxisView {
    constructor(crosshair, model, valueProvider) {
        this._invalidated = true;
        this._renderer = new time_axis_view_renderer_1.TimeAxisViewRenderer();
        this._rendererData = {
            visible: false,
            background: '#4c525e',
            color: 'white',
            text: '',
            width: 0,
            coordinate: NaN,
            tickVisible: true,
        };
        this._crosshair = crosshair;
        this._model = model;
        this._valueProvider = valueProvider;
    }
    update() {
        this._invalidated = true;
    }
    renderer() {
        if (this._invalidated) {
            this._updateImpl();
            this._invalidated = false;
        }
        this._renderer.setData(this._rendererData);
        return this._renderer;
    }
    _updateImpl() {
        const data = this._rendererData;
        data.visible = false;
        if (this._crosshair.options().mode === 2 /* CrosshairMode.Hidden */) {
            return;
        }
        const options = this._crosshair.options().vertLine;
        if (!options.labelVisible) {
            return;
        }
        const timeScale = this._model.timeScale();
        if (timeScale.isEmpty()) {
            return;
        }
        data.width = timeScale.width();
        const value = this._valueProvider();
        if (value === null) {
            return;
        }
        data.coordinate = value.coordinate;
        const currentTime = timeScale.indexToTimeScalePoint(this._crosshair.appliedIndex());
        data.text = timeScale.formatDateTime((0, assertions_1.ensureNotNull)(currentTime));
        data.visible = true;
        const colors = (0, color_1.generateContrastColors)(options.labelBackgroundColor);
        data.background = colors.background;
        data.color = colors.foreground;
        data.tickVisible = timeScale.options().ticksVisible;
    }
}
exports.CrosshairTimeAxisView = CrosshairTimeAxisView;
