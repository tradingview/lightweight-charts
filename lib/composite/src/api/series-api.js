"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeriesApi = void 0;
const assertions_1 = require("../helpers/assertions");
const delegate_1 = require("../helpers/delegate");
const strict_type_checks_1 = require("../helpers/strict-type-checks");
const data_validators_1 = require("../model/data-validators");
const range_impl_1 = require("../model/range-impl");
const series_markers_1 = require("../model/series-markers");
const time_scale_visible_range_1 = require("../model/time-scale-visible-range");
const get_series_data_creator_1 = require("./get-series-data-creator");
const price_line_options_defaults_1 = require("./options/price-line-options-defaults");
const price_line_api_1 = require("./price-line-api");
class SeriesApi {
    constructor(series, dataUpdatesConsumer, priceScaleApiProvider, chartApi, horzScaleBehavior) {
        this._dataChangedDelegate = new delegate_1.Delegate();
        this._series = series;
        this._dataUpdatesConsumer = dataUpdatesConsumer;
        this._priceScaleApiProvider = priceScaleApiProvider;
        this._horzScaleBehavior = horzScaleBehavior;
        this._chartApi = chartApi;
    }
    destroy() {
        this._dataChangedDelegate.destroy();
    }
    priceFormatter() {
        return this._series.formatter();
    }
    priceToCoordinate(price) {
        const firstValue = this._series.firstValue();
        if (firstValue === null) {
            return null;
        }
        return this._series.priceScale().priceToCoordinate(price, firstValue.value);
    }
    coordinateToPrice(coordinate) {
        const firstValue = this._series.firstValue();
        if (firstValue === null) {
            return null;
        }
        return this._series.priceScale().coordinateToPrice(coordinate, firstValue.value);
    }
    barsInLogicalRange(range) {
        if (range === null) {
            return null;
        }
        // we use TimeScaleVisibleRange here to convert LogicalRange to strict range properly
        const correctedRange = new time_scale_visible_range_1.TimeScaleVisibleRange(new range_impl_1.RangeImpl(range.from, range.to)).strictRange();
        const bars = this._series.bars();
        if (bars.isEmpty()) {
            return null;
        }
        const dataFirstBarInRange = bars.search(correctedRange.left(), 1 /* MismatchDirection.NearestRight */);
        const dataLastBarInRange = bars.search(correctedRange.right(), -1 /* MismatchDirection.NearestLeft */);
        const dataFirstIndex = (0, assertions_1.ensureNotNull)(bars.firstIndex());
        const dataLastIndex = (0, assertions_1.ensureNotNull)(bars.lastIndex());
        // this means that we request data in the data gap
        // e.g. let's say we have series with data [0..10, 30..60]
        // and we request bars info in range [15, 25]
        // thus, dataFirstBarInRange will be with index 30 and dataLastBarInRange with 10
        if (dataFirstBarInRange !== null && dataLastBarInRange !== null && dataFirstBarInRange.index > dataLastBarInRange.index) {
            return {
                barsBefore: range.from - dataFirstIndex,
                barsAfter: dataLastIndex - range.to,
            };
        }
        const barsBefore = (dataFirstBarInRange === null || dataFirstBarInRange.index === dataFirstIndex)
            ? range.from - dataFirstIndex
            : dataFirstBarInRange.index - dataFirstIndex;
        const barsAfter = (dataLastBarInRange === null || dataLastBarInRange.index === dataLastIndex)
            ? dataLastIndex - range.to
            : dataLastIndex - dataLastBarInRange.index;
        const result = { barsBefore, barsAfter };
        // actually they can't exist separately
        if (dataFirstBarInRange !== null && dataLastBarInRange !== null) {
            result.from = dataFirstBarInRange.originalTime;
            result.to = dataLastBarInRange.originalTime;
        }
        return result;
    }
    setData(data) {
        (0, data_validators_1.checkItemsAreOrdered)(data, this._horzScaleBehavior);
        (0, data_validators_1.checkSeriesValuesType)(this._series.seriesType(), data);
        this._dataUpdatesConsumer.applyNewData(this._series, data);
        this._onDataChanged('full');
    }
    update(bar) {
        (0, data_validators_1.checkSeriesValuesType)(this._series.seriesType(), [bar]);
        this._dataUpdatesConsumer.updateData(this._series, bar);
        this._onDataChanged('update');
    }
    dataByIndex(logicalIndex, mismatchDirection) {
        const data = this._series.bars().search(logicalIndex, mismatchDirection);
        if (data === null) {
            // actually it can be a whitespace
            return null;
        }
        const creator = (0, get_series_data_creator_1.getSeriesDataCreator)(this.seriesType());
        return creator(data);
    }
    data() {
        const seriesCreator = (0, get_series_data_creator_1.getSeriesDataCreator)(this.seriesType());
        const rows = this._series.bars().rows();
        return rows.map((row) => seriesCreator(row));
    }
    subscribeDataChanged(handler) {
        this._dataChangedDelegate.subscribe(handler);
    }
    unsubscribeDataChanged(handler) {
        this._dataChangedDelegate.unsubscribe(handler);
    }
    setMarkers(data) {
        (0, data_validators_1.checkItemsAreOrdered)(data, this._horzScaleBehavior, true);
        const convertedMarkers = data.map((marker) => (0, series_markers_1.convertSeriesMarker)(marker, this._horzScaleBehavior.convertHorzItemToInternal(marker.time), marker.time));
        this._series.setMarkers(convertedMarkers);
    }
    markers() {
        return this._series.markers().map((internalItem) => {
            return (0, series_markers_1.convertSeriesMarker)(internalItem, internalItem.originalTime, undefined);
        });
    }
    applyOptions(options) {
        this._series.applyOptions(options);
    }
    options() {
        return (0, strict_type_checks_1.clone)(this._series.options());
    }
    priceScale() {
        return this._priceScaleApiProvider.priceScale(this._series.priceScale().id());
    }
    createPriceLine(options) {
        (0, data_validators_1.checkPriceLineOptions)(options);
        const strictOptions = (0, strict_type_checks_1.merge)((0, strict_type_checks_1.clone)(price_line_options_defaults_1.priceLineOptionsDefaults), options);
        const priceLine = this._series.createPriceLine(strictOptions);
        return new price_line_api_1.PriceLine(priceLine);
    }
    removePriceLine(line) {
        this._series.removePriceLine(line.priceLine());
    }
    seriesType() {
        return this._series.seriesType();
    }
    attachPrimitive(primitive) {
        // at this point we cast the generic to unknown because we
        // don't want the model to know the types of the API (◑_◑)
        this._series.attachPrimitive(primitive);
        if (primitive.attached) {
            primitive.attached({
                chart: this._chartApi,
                series: this,
                requestUpdate: () => this._series.model().fullUpdate(),
            });
        }
    }
    detachPrimitive(primitive) {
        this._series.detachPrimitive(primitive);
        if (primitive.detached) {
            primitive.detached();
        }
    }
    _onDataChanged(scope) {
        if (this._dataChangedDelegate.hasListeners()) {
            this._dataChangedDelegate.fire(scope);
        }
    }
}
exports.SeriesApi = SeriesApi;
