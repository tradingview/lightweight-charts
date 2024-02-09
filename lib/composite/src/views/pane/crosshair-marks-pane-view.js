"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrosshairMarksPaneView = void 0;
const assertions_1 = require("../../helpers/assertions");
const composite_renderer_1 = require("../../renderers/composite-renderer");
const marks_renderer_1 = require("../../renderers/marks-renderer");
function createEmptyMarkerData() {
    return {
        items: [{
                x: 0,
                y: 0,
                time: 0,
                price: 0,
            }],
        lineColor: '',
        backColor: '',
        radius: 0,
        lineWidth: 0,
        visibleRange: null,
    };
}
const rangeForSinglePoint = { from: 0, to: 1 };
class CrosshairMarksPaneView {
    constructor(chartModel, crosshair) {
        this._compositeRenderer = new composite_renderer_1.CompositeRenderer();
        this._markersRenderers = [];
        this._markersData = [];
        this._invalidated = true;
        this._chartModel = chartModel;
        this._crosshair = crosshair;
        this._compositeRenderer.setRenderers(this._markersRenderers);
    }
    update(updateType) {
        const serieses = this._chartModel.serieses();
        if (serieses.length !== this._markersRenderers.length) {
            this._markersData = serieses.map(createEmptyMarkerData);
            this._markersRenderers = this._markersData.map((data) => {
                const res = new marks_renderer_1.PaneRendererMarks();
                res.setData(data);
                return res;
            });
            this._compositeRenderer.setRenderers(this._markersRenderers);
        }
        this._invalidated = true;
    }
    renderer() {
        if (this._invalidated) {
            this._updateImpl();
            this._invalidated = false;
        }
        return this._compositeRenderer;
    }
    _updateImpl() {
        const forceHidden = this._crosshair.options().mode === 2 /* CrosshairMode.Hidden */;
        const serieses = this._chartModel.serieses();
        const timePointIndex = this._crosshair.appliedIndex();
        const timeScale = this._chartModel.timeScale();
        serieses.forEach((s, index) => {
            var _a;
            const data = this._markersData[index];
            const seriesData = s.markerDataAtIndex(timePointIndex);
            if (forceHidden || seriesData === null || !s.visible()) {
                data.visibleRange = null;
                return;
            }
            const firstValue = (0, assertions_1.ensureNotNull)(s.firstValue());
            data.lineColor = seriesData.backgroundColor;
            data.radius = seriesData.radius;
            data.lineWidth = seriesData.borderWidth;
            data.items[0].price = seriesData.price;
            data.items[0].y = s.priceScale().priceToCoordinate(seriesData.price, firstValue.value);
            data.backColor = (_a = seriesData.borderColor) !== null && _a !== void 0 ? _a : this._chartModel.backgroundColorAtYPercentFromTop(data.items[0].y / s.priceScale().height());
            data.items[0].time = timePointIndex;
            data.items[0].x = timeScale.indexToCoordinate(timePointIndex);
            data.visibleRange = rangeForSinglePoint;
        });
    }
}
exports.CrosshairMarksPaneView = CrosshairMarksPaneView;
