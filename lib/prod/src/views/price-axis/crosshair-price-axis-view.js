import { generateContrastColors } from '../../helpers/color';
import { PriceAxisView } from './price-axis-view';
export class CrosshairPriceAxisView extends PriceAxisView {
    constructor(source, priceScale, valueProvider) {
        super();
        this._private__source = source;
        this._private__priceScale = priceScale;
        this._private__valueProvider = valueProvider;
    }
    _internal__updateRendererData(axisRendererData, paneRendererData, commonRendererData) {
        axisRendererData._internal_visible = false;
        if (this._private__source._internal_options().mode === 2 /* CrosshairMode.Hidden */) {
            return;
        }
        const options = this._private__source._internal_options().horzLine;
        if (!options.labelVisible) {
            return;
        }
        const firstValue = this._private__priceScale._internal_firstValue();
        if (!this._private__source._internal_visible() || this._private__priceScale._internal_isEmpty() || (firstValue === null)) {
            return;
        }
        const colors = generateContrastColors(options.labelBackgroundColor);
        commonRendererData._internal_background = colors._internal_background;
        axisRendererData._internal_color = colors._internal_foreground;
        const additionalPadding = 2 / 12 * this._private__priceScale._internal_fontSize();
        commonRendererData._internal_additionalPaddingTop = additionalPadding;
        commonRendererData._internal_additionalPaddingBottom = additionalPadding;
        const value = this._private__valueProvider(this._private__priceScale);
        commonRendererData._internal_coordinate = value._internal_coordinate;
        axisRendererData._internal_text = this._private__priceScale._internal_formatPrice(value._internal_price, firstValue);
        axisRendererData._internal_visible = true;
    }
}
