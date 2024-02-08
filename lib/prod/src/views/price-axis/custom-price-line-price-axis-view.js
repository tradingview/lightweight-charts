import { generateContrastColors } from '../../helpers/color';
import { PriceAxisView } from './price-axis-view';
export class CustomPriceLinePriceAxisView extends PriceAxisView {
    constructor(series, priceLine) {
        super();
        this._private__series = series;
        this._private__priceLine = priceLine;
    }
    _internal__updateRendererData(axisRendererData, paneRendererData, commonData) {
        axisRendererData._internal_visible = false;
        paneRendererData._internal_visible = false;
        const options = this._private__priceLine._internal_options();
        const labelVisible = options.axisLabelVisible;
        const showPaneLabel = options.title !== '';
        const series = this._private__series;
        if (!labelVisible || !series._internal_visible()) {
            return;
        }
        const y = this._private__priceLine._internal_yCoord();
        if (y === null) {
            return;
        }
        if (showPaneLabel) {
            paneRendererData._internal_text = options.title;
            paneRendererData._internal_visible = true;
        }
        paneRendererData._internal_borderColor = series._internal_model()._internal_backgroundColorAtYPercentFromTop(y / series._internal_priceScale()._internal_height());
        axisRendererData._internal_text = this._private__formatPrice(options.price);
        axisRendererData._internal_visible = true;
        const colors = generateContrastColors(options.axisLabelColor || options.color);
        commonData._internal_background = colors._internal_background;
        const textColor = options.axisLabelTextColor || colors._internal_foreground;
        axisRendererData._internal_color = textColor; // price text
        paneRendererData._internal_color = textColor; // title text
        commonData._internal_coordinate = y;
    }
    _private__formatPrice(price) {
        const firstValue = this._private__series._internal_firstValue();
        if (firstValue === null) {
            return '';
        }
        return this._private__series._internal_priceScale()._internal_formatPrice(price, firstValue._internal_value);
    }
}
