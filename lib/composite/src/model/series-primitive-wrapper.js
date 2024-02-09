"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeriesPrimitiveWrapper = void 0;
const time_axis_view_renderer_1 = require("../renderers/time-axis-view-renderer");
const price_axis_view_1 = require("../views/price-axis/price-axis-view");
class SeriesPrimitiveRendererWrapper {
    constructor(baseRenderer) {
        this._baseRenderer = baseRenderer;
    }
    draw(target, isHovered, hitTestData) {
        this._baseRenderer.draw(target);
    }
    drawBackground(target, isHovered, hitTestData) {
        var _a, _b;
        (_b = (_a = this._baseRenderer).drawBackground) === null || _b === void 0 ? void 0 : _b.call(_a, target);
    }
}
class SeriesPrimitivePaneViewWrapper {
    constructor(paneView) {
        this._cache = null;
        this._paneView = paneView;
    }
    renderer() {
        var _a;
        const baseRenderer = this._paneView.renderer();
        if (baseRenderer === null) {
            return null;
        }
        if (((_a = this._cache) === null || _a === void 0 ? void 0 : _a.base) === baseRenderer) {
            return this._cache.wrapper;
        }
        const wrapper = new SeriesPrimitiveRendererWrapper(baseRenderer);
        this._cache = {
            base: baseRenderer,
            wrapper,
        };
        return wrapper;
    }
    zOrder() {
        var _a, _b, _c;
        return (_c = (_b = (_a = this._paneView).zOrder) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : 'normal';
    }
}
function getAxisViewData(baseView) {
    var _a, _b, _c, _d, _e;
    return {
        text: baseView.text(),
        coordinate: baseView.coordinate(),
        fixedCoordinate: (_a = baseView.fixedCoordinate) === null || _a === void 0 ? void 0 : _a.call(baseView),
        color: baseView.textColor(),
        background: baseView.backColor(),
        visible: (_c = (_b = baseView.visible) === null || _b === void 0 ? void 0 : _b.call(baseView)) !== null && _c !== void 0 ? _c : true,
        tickVisible: (_e = (_d = baseView.tickVisible) === null || _d === void 0 ? void 0 : _d.call(baseView)) !== null && _e !== void 0 ? _e : true,
    };
}
class SeriesPrimitiveTimeAxisViewWrapper {
    constructor(baseView, timeScale) {
        this._renderer = new time_axis_view_renderer_1.TimeAxisViewRenderer();
        this._baseView = baseView;
        this._timeScale = timeScale;
    }
    renderer() {
        this._renderer.setData(Object.assign({ width: this._timeScale.width() }, getAxisViewData(this._baseView)));
        return this._renderer;
    }
}
class SeriesPrimitivePriceAxisViewWrapper extends price_axis_view_1.PriceAxisView {
    constructor(baseView, priceScale) {
        super();
        this._baseView = baseView;
        this._priceScale = priceScale;
    }
    _updateRendererData(axisRendererData, paneRendererData, commonRendererData) {
        const data = getAxisViewData(this._baseView);
        commonRendererData.background = data.background;
        axisRendererData.color = data.color;
        const additionalPadding = 2 / 12 * this._priceScale.fontSize();
        commonRendererData.additionalPaddingTop = additionalPadding;
        commonRendererData.additionalPaddingBottom = additionalPadding;
        commonRendererData.coordinate = data.coordinate;
        commonRendererData.fixedCoordinate = data.fixedCoordinate;
        axisRendererData.text = data.text;
        axisRendererData.visible = data.visible;
        axisRendererData.tickVisible = data.tickVisible;
    }
}
class SeriesPrimitiveWrapper {
    constructor(primitive, series) {
        this._paneViewsCache = null;
        this._timeAxisViewsCache = null;
        this._priceAxisViewsCache = null;
        this._priceAxisPaneViewsCache = null;
        this._timeAxisPaneViewsCache = null;
        this._primitive = primitive;
        this._series = series;
    }
    primitive() {
        return this._primitive;
    }
    updateAllViews() {
        var _a, _b;
        (_b = (_a = this._primitive).updateAllViews) === null || _b === void 0 ? void 0 : _b.call(_a);
    }
    paneViews() {
        var _a, _b, _c, _d;
        const base = (_c = (_b = (_a = this._primitive).paneViews) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : [];
        if (((_d = this._paneViewsCache) === null || _d === void 0 ? void 0 : _d.base) === base) {
            return this._paneViewsCache.wrapper;
        }
        const wrapper = base.map((pw) => new SeriesPrimitivePaneViewWrapper(pw));
        this._paneViewsCache = {
            base,
            wrapper,
        };
        return wrapper;
    }
    timeAxisViews() {
        var _a, _b, _c, _d;
        const base = (_c = (_b = (_a = this._primitive).timeAxisViews) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : [];
        if (((_d = this._timeAxisViewsCache) === null || _d === void 0 ? void 0 : _d.base) === base) {
            return this._timeAxisViewsCache.wrapper;
        }
        const timeScale = this._series.model().timeScale();
        const wrapper = base.map((aw) => new SeriesPrimitiveTimeAxisViewWrapper(aw, timeScale));
        this._timeAxisViewsCache = {
            base,
            wrapper,
        };
        return wrapper;
    }
    priceAxisViews() {
        var _a, _b, _c, _d;
        const base = (_c = (_b = (_a = this._primitive).priceAxisViews) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : [];
        if (((_d = this._priceAxisViewsCache) === null || _d === void 0 ? void 0 : _d.base) === base) {
            return this._priceAxisViewsCache.wrapper;
        }
        const priceScale = this._series.priceScale();
        const wrapper = base.map((aw) => new SeriesPrimitivePriceAxisViewWrapper(aw, priceScale));
        this._priceAxisViewsCache = {
            base,
            wrapper,
        };
        return wrapper;
    }
    priceAxisPaneViews() {
        var _a, _b, _c, _d;
        const base = (_c = (_b = (_a = this._primitive).priceAxisPaneViews) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : [];
        if (((_d = this._priceAxisPaneViewsCache) === null || _d === void 0 ? void 0 : _d.base) === base) {
            return this._priceAxisPaneViewsCache.wrapper;
        }
        const wrapper = base.map((pw) => new SeriesPrimitivePaneViewWrapper(pw));
        this._priceAxisPaneViewsCache = {
            base,
            wrapper,
        };
        return wrapper;
    }
    timeAxisPaneViews() {
        var _a, _b, _c, _d;
        const base = (_c = (_b = (_a = this._primitive).timeAxisPaneViews) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : [];
        if (((_d = this._timeAxisPaneViewsCache) === null || _d === void 0 ? void 0 : _d.base) === base) {
            return this._timeAxisPaneViewsCache.wrapper;
        }
        const wrapper = base.map((pw) => new SeriesPrimitivePaneViewWrapper(pw));
        this._timeAxisPaneViewsCache = {
            base,
            wrapper,
        };
        return wrapper;
    }
    autoscaleInfo(startTimePoint, endTimePoint) {
        var _a, _b, _c;
        return ((_c = (_b = (_a = this._primitive).autoscaleInfo) === null || _b === void 0 ? void 0 : _b.call(_a, startTimePoint, endTimePoint)) !== null && _c !== void 0 ? _c : null);
    }
    hitTest(x, y) {
        var _a, _b, _c;
        return (_c = (_b = (_a = this._primitive).hitTest) === null || _b === void 0 ? void 0 : _b.call(_a, x, y)) !== null && _c !== void 0 ? _c : null;
    }
}
exports.SeriesPrimitiveWrapper = SeriesPrimitiveWrapper;
