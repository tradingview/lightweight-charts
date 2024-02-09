"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeriesMarkersPaneView = void 0;
const assertions_1 = require("../../helpers/assertions");
const strict_type_checks_1 = require("../../helpers/strict-type-checks");
const time_data_1 = require("../../model/time-data");
const series_markers_renderer_1 = require("../../renderers/series-markers-renderer");
const series_markers_utils_1 = require("../../renderers/series-markers-utils");
var Constants;
(function (Constants) {
    Constants[Constants["TextMargin"] = 0.1] = "TextMargin";
})(Constants || (Constants = {}));
// eslint-disable-next-line max-params
function fillSizeAndY(rendererItem, marker, seriesData, offsets, textHeight, shapeMargin, priceScale, timeScale, firstValue) {
    const inBarPrice = (0, strict_type_checks_1.isNumber)(seriesData) ? seriesData : seriesData.close;
    const highPrice = (0, strict_type_checks_1.isNumber)(seriesData) ? seriesData : seriesData.high;
    const lowPrice = (0, strict_type_checks_1.isNumber)(seriesData) ? seriesData : seriesData.low;
    const sizeMultiplier = (0, strict_type_checks_1.isNumber)(marker.size) ? Math.max(marker.size, 0) : 1;
    const shapeSize = (0, series_markers_utils_1.calculateShapeHeight)(timeScale.barSpacing()) * sizeMultiplier;
    const halfSize = shapeSize / 2;
    rendererItem.size = shapeSize;
    switch (marker.position) {
        case 'inBar': {
            rendererItem.y = priceScale.priceToCoordinate(inBarPrice, firstValue);
            if (rendererItem.text !== undefined) {
                rendererItem.text.y = rendererItem.y + halfSize + shapeMargin + textHeight * (0.5 + 0.1 /* Constants.TextMargin */);
            }
            return;
        }
        case 'aboveBar': {
            rendererItem.y = (priceScale.priceToCoordinate(highPrice, firstValue) - halfSize - offsets.aboveBar);
            if (rendererItem.text !== undefined) {
                rendererItem.text.y = rendererItem.y - halfSize - textHeight * (0.5 + 0.1 /* Constants.TextMargin */);
                offsets.aboveBar += textHeight * (1 + 2 * 0.1 /* Constants.TextMargin */);
            }
            offsets.aboveBar += shapeSize + shapeMargin;
            return;
        }
        case 'belowBar': {
            rendererItem.y = (priceScale.priceToCoordinate(lowPrice, firstValue) + halfSize + offsets.belowBar);
            if (rendererItem.text !== undefined) {
                rendererItem.text.y = rendererItem.y + halfSize + shapeMargin + textHeight * (0.5 + 0.1 /* Constants.TextMargin */);
                offsets.belowBar += textHeight * (1 + 2 * 0.1 /* Constants.TextMargin */);
            }
            offsets.belowBar += shapeSize + shapeMargin;
            return;
        }
    }
    (0, assertions_1.ensureNever)(marker.position);
}
class SeriesMarkersPaneView {
    constructor(series, model) {
        this._invalidated = true;
        this._dataInvalidated = true;
        this._autoScaleMarginsInvalidated = true;
        this._autoScaleMargins = null;
        this._renderer = new series_markers_renderer_1.SeriesMarkersRenderer();
        this._series = series;
        this._model = model;
        this._data = {
            items: [],
            visibleRange: null,
        };
    }
    update(updateType) {
        this._invalidated = true;
        this._autoScaleMarginsInvalidated = true;
        if (updateType === 'data') {
            this._dataInvalidated = true;
        }
    }
    renderer(addAnchors) {
        if (!this._series.visible()) {
            return null;
        }
        if (this._invalidated) {
            this._makeValid();
        }
        const layout = this._model.options().layout;
        this._renderer.setParams(layout.fontSize, layout.fontFamily);
        this._renderer.setData(this._data);
        return this._renderer;
    }
    autoScaleMargins() {
        if (this._autoScaleMarginsInvalidated) {
            if (this._series.indexedMarkers().length > 0) {
                const barSpacing = this._model.timeScale().barSpacing();
                const shapeMargin = (0, series_markers_utils_1.shapeMargin)(barSpacing);
                const marginsAboveAndBelow = (0, series_markers_utils_1.calculateShapeHeight)(barSpacing) * 1.5 + shapeMargin * 2;
                this._autoScaleMargins = {
                    above: marginsAboveAndBelow,
                    below: marginsAboveAndBelow,
                };
            }
            else {
                this._autoScaleMargins = null;
            }
            this._autoScaleMarginsInvalidated = false;
        }
        return this._autoScaleMargins;
    }
    _makeValid() {
        const priceScale = this._series.priceScale();
        const timeScale = this._model.timeScale();
        const seriesMarkers = this._series.indexedMarkers();
        if (this._dataInvalidated) {
            this._data.items = seriesMarkers.map((marker) => ({
                time: marker.time,
                x: 0,
                y: 0,
                size: 0,
                shape: marker.shape,
                color: marker.color,
                internalId: marker.internalId,
                externalId: marker.id,
                text: undefined,
            }));
            this._dataInvalidated = false;
        }
        const layoutOptions = this._model.options().layout;
        this._data.visibleRange = null;
        const visibleBars = timeScale.visibleStrictRange();
        if (visibleBars === null) {
            return;
        }
        const firstValue = this._series.firstValue();
        if (firstValue === null) {
            return;
        }
        if (this._data.items.length === 0) {
            return;
        }
        let prevTimeIndex = NaN;
        const shapeMargin = (0, series_markers_utils_1.shapeMargin)(timeScale.barSpacing());
        const offsets = {
            aboveBar: shapeMargin,
            belowBar: shapeMargin,
        };
        this._data.visibleRange = (0, time_data_1.visibleTimedValues)(this._data.items, visibleBars, true);
        for (let index = this._data.visibleRange.from; index < this._data.visibleRange.to; index++) {
            const marker = seriesMarkers[index];
            if (marker.time !== prevTimeIndex) {
                // new bar, reset stack counter
                offsets.aboveBar = shapeMargin;
                offsets.belowBar = shapeMargin;
                prevTimeIndex = marker.time;
            }
            const rendererItem = this._data.items[index];
            rendererItem.x = timeScale.indexToCoordinate(marker.time);
            if (marker.text !== undefined && marker.text.length > 0) {
                rendererItem.text = {
                    content: marker.text,
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                };
            }
            const dataAt = this._series.dataAt(marker.time);
            if (dataAt === null) {
                continue;
            }
            fillSizeAndY(rendererItem, marker, dataAt, offsets, layoutOptions.fontSize, shapeMargin, priceScale, timeScale, firstValue.value);
        }
        this._invalidated = false;
    }
}
exports.SeriesMarkersPaneView = SeriesMarkersPaneView;
