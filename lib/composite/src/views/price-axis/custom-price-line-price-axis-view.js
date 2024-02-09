"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomPriceLinePriceAxisView = void 0;
const color_1 = require("../../helpers/color");
const price_axis_view_1 = require("./price-axis-view");
class CustomPriceLinePriceAxisView extends price_axis_view_1.PriceAxisView {
    constructor(series, priceLine) {
        super();
        this._series = series;
        this._priceLine = priceLine;
    }
    _updateRendererData(axisRendererData, paneRendererData, commonData) {
        axisRendererData.visible = false;
        paneRendererData.visible = false;
        const options = this._priceLine.options();
        const labelVisible = options.axisLabelVisible;
        const showPaneLabel = options.title !== '';
        const series = this._series;
        if (!labelVisible || !series.visible()) {
            return;
        }
        const y = this._priceLine.yCoord();
        if (y === null) {
            return;
        }
        if (showPaneLabel) {
            paneRendererData.text = options.title;
            paneRendererData.visible = true;
        }
        paneRendererData.borderColor = series.model().backgroundColorAtYPercentFromTop(y / series.priceScale().height());
        axisRendererData.text = this._formatPrice(options.price);
        axisRendererData.visible = true;
        const colors = (0, color_1.generateContrastColors)(options.axisLabelColor || options.color);
        commonData.background = colors.background;
        const textColor = options.axisLabelTextColor || colors.foreground;
        axisRendererData.color = textColor; // price text
        paneRendererData.color = textColor; // title text
        commonData.coordinate = y;
    }
    _formatPrice(price) {
        const firstValue = this._series.firstValue();
        if (firstValue === null) {
            return '';
        }
        return this._series.priceScale().formatPrice(price, firstValue.value);
    }
}
exports.CustomPriceLinePriceAxisView = CustomPriceLinePriceAxisView;
