import { makeFont } from '../helpers/make-font';
;
export class PriceAxisRendererOptionsProvider {
    constructor(chartModel) {
        this._private__rendererOptions = {
            _internal_borderSize: 1 /* RendererConstants.BorderSize */,
            _internal_tickLength: 5 /* RendererConstants.TickLength */,
            _internal_fontSize: NaN,
            _internal_font: '',
            _internal_fontFamily: '',
            _internal_color: '',
            _internal_paneBackgroundColor: '',
            _internal_paddingBottom: 0,
            _internal_paddingInner: 0,
            _internal_paddingOuter: 0,
            _internal_paddingTop: 0,
            _internal_baselineOffset: 0,
        };
        this._private__chartModel = chartModel;
    }
    _internal_options() {
        const rendererOptions = this._private__rendererOptions;
        const currentFontSize = this._private__fontSize();
        const currentFontFamily = this._private__fontFamily();
        if (rendererOptions._internal_fontSize !== currentFontSize || rendererOptions._internal_fontFamily !== currentFontFamily) {
            rendererOptions._internal_fontSize = currentFontSize;
            rendererOptions._internal_fontFamily = currentFontFamily;
            rendererOptions._internal_font = makeFont(currentFontSize, currentFontFamily);
            rendererOptions._internal_paddingTop = 2.5 / 12 * currentFontSize; // 2.5 px for 12px font
            rendererOptions._internal_paddingBottom = rendererOptions._internal_paddingTop;
            rendererOptions._internal_paddingInner = currentFontSize / 12 * rendererOptions._internal_tickLength;
            rendererOptions._internal_paddingOuter = currentFontSize / 12 * rendererOptions._internal_tickLength;
            rendererOptions._internal_baselineOffset = 0;
        }
        rendererOptions._internal_color = this._private__textColor();
        rendererOptions._internal_paneBackgroundColor = this._private__paneBackgroundColor();
        return this._private__rendererOptions;
    }
    _private__textColor() {
        return this._private__chartModel._internal_options().layout.textColor;
    }
    _private__paneBackgroundColor() {
        return this._private__chartModel._internal_backgroundTopColor();
    }
    _private__fontSize() {
        return this._private__chartModel._internal_options().layout.fontSize;
    }
    _private__fontFamily() {
        return this._private__chartModel._internal_options().layout.fontFamily;
    }
}
