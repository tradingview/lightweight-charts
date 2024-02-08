import { TextWidthCache } from '../../model/text-width-cache';
class PanePriceAxisViewRenderer {
    constructor(textWidthCache) {
        this._private__priceAxisViewRenderer = null;
        this._private__rendererOptions = null;
        this._private__align = 'right';
        this._private__textWidthCache = textWidthCache;
    }
    _internal_setParams(priceAxisViewRenderer, rendererOptions, align) {
        this._private__priceAxisViewRenderer = priceAxisViewRenderer;
        this._private__rendererOptions = rendererOptions;
        this._private__align = align;
    }
    _internal_draw(target) {
        if (this._private__rendererOptions === null || this._private__priceAxisViewRenderer === null) {
            return;
        }
        this._private__priceAxisViewRenderer._internal_draw(target, this._private__rendererOptions, this._private__textWidthCache, this._private__align);
    }
}
export class PanePriceAxisView {
    constructor(priceAxisView, dataSource, chartModel) {
        this._private__priceAxisView = priceAxisView;
        this._private__textWidthCache = new TextWidthCache(50); // when should we clear cache?
        this._private__dataSource = dataSource;
        this._private__chartModel = chartModel;
        this._private__fontSize = -1;
        this._private__renderer = new PanePriceAxisViewRenderer(this._private__textWidthCache);
    }
    _internal_renderer() {
        const pane = this._private__chartModel._internal_paneForSource(this._private__dataSource);
        if (pane === null) {
            return null;
        }
        // this price scale will be used to find label placement only (left, right, none)
        const priceScale = pane._internal_isOverlay(this._private__dataSource) ? pane._internal_defaultVisiblePriceScale() : this._private__dataSource._internal_priceScale();
        if (priceScale === null) {
            return null;
        }
        const position = pane._internal_priceScalePosition(priceScale);
        if (position === 'overlay') {
            return null;
        }
        const options = this._private__chartModel._internal_priceAxisRendererOptions();
        if (options._internal_fontSize !== this._private__fontSize) {
            this._private__fontSize = options._internal_fontSize;
            this._private__textWidthCache._internal_reset();
        }
        this._private__renderer._internal_setParams(this._private__priceAxisView._internal_paneRenderer(), options, position);
        return this._private__renderer;
    }
}
