"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatermarkPaneView = void 0;
const make_font_1 = require("../../helpers/make-font");
const watermark_renderer_1 = require("../../renderers/watermark-renderer");
class WatermarkPaneView {
    constructor(source) {
        this._invalidated = true;
        this._rendererData = {
            visible: false,
            color: '',
            lines: [],
            vertAlign: 'center',
            horzAlign: 'center',
        };
        this._renderer = new watermark_renderer_1.WatermarkRenderer(this._rendererData);
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
        const options = this._source.options();
        const data = this._rendererData;
        data.visible = options.visible;
        if (!data.visible) {
            return;
        }
        data.color = options.color;
        data.horzAlign = options.horzAlign;
        data.vertAlign = options.vertAlign;
        data.lines = [
            {
                text: options.text,
                font: (0, make_font_1.makeFont)(options.fontSize, options.fontFamily, options.fontStyle),
                lineHeight: options.fontSize * 1.2,
                vertOffset: 0,
                zoom: 0,
            },
        ];
    }
}
exports.WatermarkPaneView = WatermarkPaneView;
