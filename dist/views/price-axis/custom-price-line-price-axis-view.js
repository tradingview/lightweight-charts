import { generateContrastColors } from '../../helpers/color';
import { PriceAxisView } from './price-axis-view';
export class CustomPriceLinePriceAxisView extends PriceAxisView {
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
        const colors = generateContrastColors(options.axisLabelColor || options.color);
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
