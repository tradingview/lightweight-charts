"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaneRendererLine = void 0;
const line_renderer_base_1 = require("./line-renderer-base");
class PaneRendererLine extends line_renderer_base_1.PaneRendererLineBase {
    _strokeStyle(renderingScope, item) {
        return item.lineColor;
    }
}
exports.PaneRendererLine = PaneRendererLine;
