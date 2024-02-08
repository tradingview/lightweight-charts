import { generateContrastColors } from '../../helpers/color';
import { PriceAxisView } from './price-axis-view';
export class SeriesPriceAxisView extends PriceAxisView {
    constructor(source) {
        super();
        this._private__source = source;
    }
    _internal__updateRendererData(axisRendererData, paneRendererData, commonRendererData) {
        axisRendererData._internal_visible = false;
        paneRendererData._internal_visible = false;
        const source = this._private__source;
        if (!source._internal_visible()) {
            return;
        }
        const seriesOptions = source._internal_options();
        const showSeriesLastValue = seriesOptions.lastValueVisible;
        const showSymbolLabel = source._internal_title() !== '';
        const showPriceAndPercentage = seriesOptions.seriesLastValueMode === 0 /* PriceAxisLastValueMode.LastPriceAndPercentageValue */;
        const lastValueData = source._internal_lastValueData(false);
        if (lastValueData._internal_noData) {
            return;
        }
        if (showSeriesLastValue) {
            axisRendererData._internal_text = this._internal__axisText(lastValueData, showSeriesLastValue, showPriceAndPercentage);
            axisRendererData._internal_visible = axisRendererData._internal_text.length !== 0;
        }
        if (showSymbolLabel || showPriceAndPercentage) {
            paneRendererData._internal_text = this._internal__paneText(lastValueData, showSeriesLastValue, showSymbolLabel, showPriceAndPercentage);
            paneRendererData._internal_visible = paneRendererData._internal_text.length > 0;
        }
        const lastValueColor = source._internal_priceLineColor(lastValueData._internal_color);
        const colors = generateContrastColors(lastValueColor);
        commonRendererData._internal_background = colors._internal_background;
        commonRendererData._internal_coordinate = lastValueData._internal_coordinate;
        paneRendererData._internal_borderColor = source._internal_model()._internal_backgroundColorAtYPercentFromTop(lastValueData._internal_coordinate / source._internal_priceScale()._internal_height());
        axisRendererData._internal_borderColor = lastValueColor;
        axisRendererData._internal_color = colors._internal_foreground;
        paneRendererData._internal_color = colors._internal_foreground;
    }
    _internal__paneText(lastValue, showSeriesLastValue, showSymbolLabel, showPriceAndPercentage) {
        let result = '';
        const title = this._private__source._internal_title();
        if (showSymbolLabel && title.length !== 0) {
            result += `${title} `;
        }
        if (showSeriesLastValue && showPriceAndPercentage) {
            result += this._private__source._internal_priceScale()._internal_isPercentage() ?
                lastValue._internal_formattedPriceAbsolute : lastValue._internal_formattedPricePercentage;
        }
        return result.trim();
    }
    _internal__axisText(lastValueData, showSeriesLastValue, showPriceAndPercentage) {
        if (!showSeriesLastValue) {
            return '';
        }
        if (!showPriceAndPercentage) {
            return lastValueData._internal_text;
        }
        return this._private__source._internal_priceScale()._internal_isPercentage() ?
            lastValueData._internal_formattedPricePercentage : lastValueData._internal_formattedPriceAbsolute;
    }
}
