"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceAxisRendererOptionsProvider = void 0;
const make_font_1 = require("../helpers/make-font");
var RendererConstants;
(function (RendererConstants) {
    RendererConstants[RendererConstants["BorderSize"] = 1] = "BorderSize";
    RendererConstants[RendererConstants["TickLength"] = 5] = "TickLength";
})(RendererConstants || (RendererConstants = {}));
class PriceAxisRendererOptionsProvider {
    constructor(chartModel) {
        this._rendererOptions = {
            borderSize: 1 /* RendererConstants.BorderSize */,
            tickLength: 5 /* RendererConstants.TickLength */,
            fontSize: NaN,
            font: '',
            fontFamily: '',
            color: '',
            paneBackgroundColor: '',
            paddingBottom: 0,
            paddingInner: 0,
            paddingOuter: 0,
            paddingTop: 0,
            baselineOffset: 0,
        };
        this._chartModel = chartModel;
    }
    options() {
        const rendererOptions = this._rendererOptions;
        const currentFontSize = this._fontSize();
        const currentFontFamily = this._fontFamily();
        if (rendererOptions.fontSize !== currentFontSize || rendererOptions.fontFamily !== currentFontFamily) {
            rendererOptions.fontSize = currentFontSize;
            rendererOptions.fontFamily = currentFontFamily;
            rendererOptions.font = (0, make_font_1.makeFont)(currentFontSize, currentFontFamily);
            rendererOptions.paddingTop = 2.5 / 12 * currentFontSize; // 2.5 px for 12px font
            rendererOptions.paddingBottom = rendererOptions.paddingTop;
            rendererOptions.paddingInner = currentFontSize / 12 * rendererOptions.tickLength;
            rendererOptions.paddingOuter = currentFontSize / 12 * rendererOptions.tickLength;
            rendererOptions.baselineOffset = 0;
        }
        rendererOptions.color = this._textColor();
        rendererOptions.paneBackgroundColor = this._paneBackgroundColor();
        return this._rendererOptions;
    }
    _textColor() {
        return this._chartModel.options().layout.textColor;
    }
    _paneBackgroundColor() {
        return this._chartModel.backgroundTopColor();
    }
    _fontSize() {
        return this._chartModel.options().layout.fontSize;
    }
    _fontFamily() {
        return this._chartModel.options().layout.fontFamily;
    }
}
exports.PriceAxisRendererOptionsProvider = PriceAxisRendererOptionsProvider;
