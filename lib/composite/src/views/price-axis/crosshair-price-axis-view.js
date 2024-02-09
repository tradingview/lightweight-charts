"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrosshairPriceAxisView = void 0;
const color_1 = require("../../helpers/color");
const price_axis_view_1 = require("./price-axis-view");
class CrosshairPriceAxisView extends price_axis_view_1.PriceAxisView {
    constructor(source, priceScale, valueProvider) {
        super();
        this._source = source;
        this._priceScale = priceScale;
        this._valueProvider = valueProvider;
    }
    _updateRendererData(axisRendererData, paneRendererData, commonRendererData) {
        axisRendererData.visible = false;
        if (this._source.options().mode === 2 /* CrosshairMode.Hidden */) {
            return;
        }
        const options = this._source.options().horzLine;
        if (!options.labelVisible) {
            return;
        }
        const firstValue = this._priceScale.firstValue();
        if (!this._source.visible() || this._priceScale.isEmpty() || (firstValue === null)) {
            return;
        }
        const colors = (0, color_1.generateContrastColors)(options.labelBackgroundColor);
        commonRendererData.background = colors.background;
        axisRendererData.color = colors.foreground;
        const additionalPadding = 2 / 12 * this._priceScale.fontSize();
        commonRendererData.additionalPaddingTop = additionalPadding;
        commonRendererData.additionalPaddingBottom = additionalPadding;
        const value = this._valueProvider(this._priceScale);
        commonRendererData.coordinate = value.coordinate;
        axisRendererData.text = this._priceScale.formatPrice(value.price, firstValue);
        axisRendererData.visible = true;
    }
}
exports.CrosshairPriceAxisView = CrosshairPriceAxisView;
