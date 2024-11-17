import { generateContrastColors } from '../../helpers/color';
import { PriceAxisView } from './price-axis-view';
export class CrosshairPriceAxisView extends PriceAxisView {
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
        const colors = generateContrastColors(options.labelBackgroundColor);
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
