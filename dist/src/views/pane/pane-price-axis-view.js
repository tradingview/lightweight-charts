import { TextWidthCache } from '../../model/text-width-cache';
class PanePriceAxisViewRenderer {
    constructor(textWidthCache) {
        this._priceAxisViewRenderer = null;
        this._rendererOptions = null;
        this._align = 'right';
        this._textWidthCache = textWidthCache;
    }
    setParams(priceAxisViewRenderer, rendererOptions, align) {
        this._priceAxisViewRenderer = priceAxisViewRenderer;
        this._rendererOptions = rendererOptions;
        this._align = align;
    }
    draw(target) {
        if (this._rendererOptions === null || this._priceAxisViewRenderer === null) {
            return;
        }
        this._priceAxisViewRenderer.draw(target, this._rendererOptions, this._textWidthCache, this._align);
    }
}
export class PanePriceAxisView {
    constructor(priceAxisView, dataSource, chartModel) {
        this._priceAxisView = priceAxisView;
        this._textWidthCache = new TextWidthCache(50); // when should we clear cache?
        this._dataSource = dataSource;
        this._chartModel = chartModel;
        this._fontSize = -1;
        this._renderer = new PanePriceAxisViewRenderer(this._textWidthCache);
    }
    renderer() {
        const pane = this._chartModel.paneForSource(this._dataSource);
        if (pane === null) {
            return null;
        }
        // this price scale will be used to find label placement only (left, right, none)
        const priceScale = pane.isOverlay(this._dataSource) ? pane.defaultVisiblePriceScale() : this._dataSource.priceScale();
        if (priceScale === null) {
            return null;
        }
        const position = pane.priceScalePosition(priceScale);
        if (position === 'overlay') {
            return null;
        }
        const options = this._chartModel.priceAxisRendererOptions();
        if (options.fontSize !== this._fontSize) {
            this._fontSize = options.fontSize;
            this._textWidthCache.reset();
        }
        this._renderer.setParams(this._priceAxisView.paneRenderer(), options, position);
        return this._renderer;
    }
}
