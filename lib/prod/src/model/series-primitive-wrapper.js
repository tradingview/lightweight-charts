import { TimeAxisViewRenderer } from '../renderers/time-axis-view-renderer';
import { PriceAxisView } from '../views/price-axis/price-axis-view';
class SeriesPrimitiveRendererWrapper {
    constructor(baseRenderer) {
        this._private__baseRenderer = baseRenderer;
    }
    _internal_draw(target, isHovered, hitTestData) {
        this._private__baseRenderer.draw(target);
    }
    _internal_drawBackground(target, isHovered, hitTestData) {
        var _a, _b;
        (_b = (_a = this._private__baseRenderer).drawBackground) === null || _b === void 0 ? void 0 : _b.call(_a, target);
    }
}
class SeriesPrimitivePaneViewWrapper {
    constructor(paneView) {
        this._private__cache = null;
        this._private__paneView = paneView;
    }
    _internal_renderer() {
        var _a;
        const baseRenderer = this._private__paneView.renderer();
        if (baseRenderer === null) {
            return null;
        }
        if (((_a = this._private__cache) === null || _a === void 0 ? void 0 : _a._internal_base) === baseRenderer) {
            return this._private__cache._internal_wrapper;
        }
        const wrapper = new SeriesPrimitiveRendererWrapper(baseRenderer);
        this._private__cache = {
            _internal_base: baseRenderer,
            _internal_wrapper: wrapper,
        };
        return wrapper;
    }
    _internal_zOrder() {
        var _a, _b, _c;
        return (_c = (_b = (_a = this._private__paneView).zOrder) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : 'normal';
    }
}
function getAxisViewData(baseView) {
    var _a, _b, _c, _d, _e;
    return {
        _internal_text: baseView.text(),
        _internal_coordinate: baseView.coordinate(),
        _internal_fixedCoordinate: (_a = baseView.fixedCoordinate) === null || _a === void 0 ? void 0 : _a.call(baseView),
        _internal_color: baseView.textColor(),
        _internal_background: baseView.backColor(),
        _internal_visible: (_c = (_b = baseView.visible) === null || _b === void 0 ? void 0 : _b.call(baseView)) !== null && _c !== void 0 ? _c : true,
        _internal_tickVisible: (_e = (_d = baseView.tickVisible) === null || _d === void 0 ? void 0 : _d.call(baseView)) !== null && _e !== void 0 ? _e : true,
    };
}
class SeriesPrimitiveTimeAxisViewWrapper {
    constructor(baseView, timeScale) {
        this._private__renderer = new TimeAxisViewRenderer();
        this._private__baseView = baseView;
        this._private__timeScale = timeScale;
    }
    _internal_renderer() {
        this._private__renderer._internal_setData(Object.assign({ _internal_width: this._private__timeScale._internal_width() }, getAxisViewData(this._private__baseView)));
        return this._private__renderer;
    }
}
class SeriesPrimitivePriceAxisViewWrapper extends PriceAxisView {
    constructor(baseView, priceScale) {
        super();
        this._private__baseView = baseView;
        this._private__priceScale = priceScale;
    }
    _internal__updateRendererData(axisRendererData, paneRendererData, commonRendererData) {
        const data = getAxisViewData(this._private__baseView);
        commonRendererData._internal_background = data._internal_background;
        axisRendererData._internal_color = data._internal_color;
        const additionalPadding = 2 / 12 * this._private__priceScale._internal_fontSize();
        commonRendererData._internal_additionalPaddingTop = additionalPadding;
        commonRendererData._internal_additionalPaddingBottom = additionalPadding;
        commonRendererData._internal_coordinate = data._internal_coordinate;
        commonRendererData._internal_fixedCoordinate = data._internal_fixedCoordinate;
        axisRendererData._internal_text = data._internal_text;
        axisRendererData._internal_visible = data._internal_visible;
        axisRendererData._internal_tickVisible = data._internal_tickVisible;
    }
}
export class SeriesPrimitiveWrapper {
    constructor(primitive, series) {
        this._private__paneViewsCache = null;
        this._private__timeAxisViewsCache = null;
        this._private__priceAxisViewsCache = null;
        this._private__priceAxisPaneViewsCache = null;
        this._private__timeAxisPaneViewsCache = null;
        this._private__primitive = primitive;
        this._private__series = series;
    }
    _internal_primitive() {
        return this._private__primitive;
    }
    _internal_updateAllViews() {
        var _a, _b;
        (_b = (_a = this._private__primitive).updateAllViews) === null || _b === void 0 ? void 0 : _b.call(_a);
    }
    _internal_paneViews() {
        var _a, _b, _c, _d;
        const base = (_c = (_b = (_a = this._private__primitive).paneViews) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : [];
        if (((_d = this._private__paneViewsCache) === null || _d === void 0 ? void 0 : _d._internal_base) === base) {
            return this._private__paneViewsCache._internal_wrapper;
        }
        const wrapper = base.map((pw) => new SeriesPrimitivePaneViewWrapper(pw));
        this._private__paneViewsCache = {
            _internal_base: base,
            _internal_wrapper: wrapper,
        };
        return wrapper;
    }
    _internal_timeAxisViews() {
        var _a, _b, _c, _d;
        const base = (_c = (_b = (_a = this._private__primitive).timeAxisViews) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : [];
        if (((_d = this._private__timeAxisViewsCache) === null || _d === void 0 ? void 0 : _d._internal_base) === base) {
            return this._private__timeAxisViewsCache._internal_wrapper;
        }
        const timeScale = this._private__series._internal_model()._internal_timeScale();
        const wrapper = base.map((aw) => new SeriesPrimitiveTimeAxisViewWrapper(aw, timeScale));
        this._private__timeAxisViewsCache = {
            _internal_base: base,
            _internal_wrapper: wrapper,
        };
        return wrapper;
    }
    _internal_priceAxisViews() {
        var _a, _b, _c, _d;
        const base = (_c = (_b = (_a = this._private__primitive).priceAxisViews) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : [];
        if (((_d = this._private__priceAxisViewsCache) === null || _d === void 0 ? void 0 : _d._internal_base) === base) {
            return this._private__priceAxisViewsCache._internal_wrapper;
        }
        const priceScale = this._private__series._internal_priceScale();
        const wrapper = base.map((aw) => new SeriesPrimitivePriceAxisViewWrapper(aw, priceScale));
        this._private__priceAxisViewsCache = {
            _internal_base: base,
            _internal_wrapper: wrapper,
        };
        return wrapper;
    }
    _internal_priceAxisPaneViews() {
        var _a, _b, _c, _d;
        const base = (_c = (_b = (_a = this._private__primitive).priceAxisPaneViews) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : [];
        if (((_d = this._private__priceAxisPaneViewsCache) === null || _d === void 0 ? void 0 : _d._internal_base) === base) {
            return this._private__priceAxisPaneViewsCache._internal_wrapper;
        }
        const wrapper = base.map((pw) => new SeriesPrimitivePaneViewWrapper(pw));
        this._private__priceAxisPaneViewsCache = {
            _internal_base: base,
            _internal_wrapper: wrapper,
        };
        return wrapper;
    }
    _internal_timeAxisPaneViews() {
        var _a, _b, _c, _d;
        const base = (_c = (_b = (_a = this._private__primitive).timeAxisPaneViews) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : [];
        if (((_d = this._private__timeAxisPaneViewsCache) === null || _d === void 0 ? void 0 : _d._internal_base) === base) {
            return this._private__timeAxisPaneViewsCache._internal_wrapper;
        }
        const wrapper = base.map((pw) => new SeriesPrimitivePaneViewWrapper(pw));
        this._private__timeAxisPaneViewsCache = {
            _internal_base: base,
            _internal_wrapper: wrapper,
        };
        return wrapper;
    }
    _internal_autoscaleInfo(startTimePoint, endTimePoint) {
        var _a, _b, _c;
        return ((_c = (_b = (_a = this._private__primitive).autoscaleInfo) === null || _b === void 0 ? void 0 : _b.call(_a, startTimePoint, endTimePoint)) !== null && _c !== void 0 ? _c : null);
    }
    _internal_hitTest(x, y) {
        var _a, _b, _c;
        return (_c = (_b = (_a = this._private__primitive).hitTest) === null || _b === void 0 ? void 0 : _b.call(_a, x, y)) !== null && _c !== void 0 ? _c : null;
    }
}
