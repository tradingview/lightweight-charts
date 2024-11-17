import { generateContrastColors } from '../../helpers/color';
import { PriceAxisView } from './price-axis-view';
export class SeriesPriceAxisView extends PriceAxisView {
    constructor(source) {
        super();
        this._source = source;
    }
    _updateRendererData(axisRendererData, paneRendererData, commonRendererData) {
        axisRendererData.visible = false;
        paneRendererData.visible = false;
        const source = this._source;
        if (!source.visible()) {
            return;
        }
        const seriesOptions = source.options();
        const showSeriesLastValue = seriesOptions.lastValueVisible;
        const showSymbolLabel = source.title() !== '';
        const showPriceAndPercentage = seriesOptions.seriesLastValueMode === 0 /* PriceAxisLastValueMode.LastPriceAndPercentageValue */;
        const lastValueData = source.lastValueData(false);
        if (lastValueData.noData) {
            return;
        }
        if (showSeriesLastValue) {
            axisRendererData.text = this._axisText(lastValueData, showSeriesLastValue, showPriceAndPercentage);
            axisRendererData.visible = axisRendererData.text.length !== 0;
        }
        if (showSymbolLabel || showPriceAndPercentage) {
            paneRendererData.text = this._paneText(lastValueData, showSeriesLastValue, showSymbolLabel, showPriceAndPercentage);
            paneRendererData.visible = paneRendererData.text.length > 0;
        }
        const lastValueColor = source.priceLineColor(lastValueData.color);
        const colors = generateContrastColors(lastValueColor);
        commonRendererData.background = colors.background;
        commonRendererData.coordinate = lastValueData.coordinate;
        paneRendererData.borderColor = source.model().backgroundColorAtYPercentFromTop(lastValueData.coordinate / source.priceScale().height());
        axisRendererData.borderColor = lastValueColor;
        axisRendererData.color = colors.foreground;
        paneRendererData.color = colors.foreground;
    }
    _paneText(lastValue, showSeriesLastValue, showSymbolLabel, showPriceAndPercentage) {
        let result = '';
        const title = this._source.title();
        if (showSymbolLabel && title.length !== 0) {
            result += `${title} `;
        }
        if (showSeriesLastValue && showPriceAndPercentage) {
            result += this._source.priceScale().isPercentage() ?
                lastValue.formattedPriceAbsolute : lastValue.formattedPricePercentage;
        }
        return result.trim();
    }
    _axisText(lastValueData, showSeriesLastValue, showPriceAndPercentage) {
        if (!showSeriesLastValue) {
            return '';
        }
        if (!showPriceAndPercentage) {
            return lastValueData.text;
        }
        return this._source.priceScale().isPercentage() ?
            lastValueData.formattedPricePercentage : lastValueData.formattedPriceAbsolute;
    }
}
