import { ensureNever } from '../../helpers/assertions';
import { isNumber } from '../../helpers/strict-type-checks';
import { visibleTimedValues } from '../../model/time-data';
import { SeriesMarkersRenderer, } from '../../renderers/series-markers-renderer';
import { calculateAdjustedMargin, calculateShapeHeight, shapeMargin as calculateShapeMargin, } from '../../renderers/series-markers-utils';
// eslint-disable-next-line max-params
function fillSizeAndY(rendererItem, marker, seriesData, offsets, textHeight, shapeMargin, priceScale, timeScale, firstValue) {
    const inBarPrice = isNumber(seriesData) ? seriesData : seriesData.close;
    const highPrice = isNumber(seriesData) ? seriesData : seriesData.high;
    const lowPrice = isNumber(seriesData) ? seriesData : seriesData.low;
    const sizeMultiplier = isNumber(marker.size) ? Math.max(marker.size, 0) : 1;
    const shapeSize = calculateShapeHeight(timeScale.barSpacing()) * sizeMultiplier;
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
    ensureNever(marker.position);
}
export class SeriesMarkersPaneView {
    constructor(series, model) {
        this._invalidated = true;
        this._dataInvalidated = true;
        this._autoScaleMarginsInvalidated = true;
        this._autoScaleMargins = null;
        this._markersPositions = null;
        this._renderer = new SeriesMarkersRenderer();
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
            this._markersPositions = null;
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
                const shapeMargin = calculateShapeMargin(barSpacing);
                const marginValue = calculateShapeHeight(barSpacing) * 1.5 + shapeMargin * 2;
                const positions = this._getMarkerPositions();
                this._autoScaleMargins = {
                    above: calculateAdjustedMargin(marginValue, positions.aboveBar, positions.inBar),
                    below: calculateAdjustedMargin(marginValue, positions.belowBar, positions.inBar),
                };
            }
            else {
                this._autoScaleMargins = null;
            }
            this._autoScaleMarginsInvalidated = false;
        }
        return this._autoScaleMargins;
    }
    _getMarkerPositions() {
        if (this._markersPositions === null) {
            this._markersPositions = this._series.indexedMarkers().reduce((acc, marker) => {
                if (!acc[marker.position]) {
                    acc[marker.position] = true;
                }
                return acc;
            }, {
                inBar: false,
                aboveBar: false,
                belowBar: false,
            });
        }
        return this._markersPositions;
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
        const shapeMargin = calculateShapeMargin(timeScale.barSpacing());
        const offsets = {
            aboveBar: shapeMargin,
            belowBar: shapeMargin,
        };
        this._data.visibleRange = visibleTimedValues(this._data.items, visibleBars, true);
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
