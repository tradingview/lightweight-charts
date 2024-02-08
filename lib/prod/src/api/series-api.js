import { ensureNotNull } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { clone, merge } from '../helpers/strict-type-checks';
import { checkItemsAreOrdered, checkPriceLineOptions, checkSeriesValuesType } from '../model/data-validators';
import { RangeImpl } from '../model/range-impl';
import { convertSeriesMarker } from '../model/series-markers';
import { TimeScaleVisibleRange } from '../model/time-scale-visible-range';
import { getSeriesDataCreator } from './get-series-data-creator';
import { priceLineOptionsDefaults } from './options/price-line-options-defaults';
import { PriceLine } from './price-line-api';
export class SeriesApi {
    constructor(series, dataUpdatesConsumer, priceScaleApiProvider, chartApi, horzScaleBehavior) {
        this._private__dataChangedDelegate = new Delegate();
        this._internal__series = series;
        this._internal__dataUpdatesConsumer = dataUpdatesConsumer;
        this._private__priceScaleApiProvider = priceScaleApiProvider;
        this._private__horzScaleBehavior = horzScaleBehavior;
        this._internal__chartApi = chartApi;
    }
    _internal_destroy() {
        this._private__dataChangedDelegate._internal_destroy();
    }
    priceFormatter() {
        return this._internal__series._internal_formatter();
    }
    priceToCoordinate(price) {
        const firstValue = this._internal__series._internal_firstValue();
        if (firstValue === null) {
            return null;
        }
        return this._internal__series._internal_priceScale()._internal_priceToCoordinate(price, firstValue._internal_value);
    }
    coordinateToPrice(coordinate) {
        const firstValue = this._internal__series._internal_firstValue();
        if (firstValue === null) {
            return null;
        }
        return this._internal__series._internal_priceScale()._internal_coordinateToPrice(coordinate, firstValue._internal_value);
    }
    barsInLogicalRange(range) {
        if (range === null) {
            return null;
        }
        // we use TimeScaleVisibleRange here to convert LogicalRange to strict range properly
        const correctedRange = new TimeScaleVisibleRange(new RangeImpl(range.from, range.to))._internal_strictRange();
        const bars = this._internal__series._internal_bars();
        if (bars._internal_isEmpty()) {
            return null;
        }
        const dataFirstBarInRange = bars._internal_search(correctedRange._internal_left(), 1 /* MismatchDirection.NearestRight */);
        const dataLastBarInRange = bars._internal_search(correctedRange._internal_right(), -1 /* MismatchDirection.NearestLeft */);
        const dataFirstIndex = ensureNotNull(bars._internal_firstIndex());
        const dataLastIndex = ensureNotNull(bars._internal_lastIndex());
        // this means that we request data in the data gap
        // e.g. let's say we have series with data [0..10, 30..60]
        // and we request bars info in range [15, 25]
        // thus, dataFirstBarInRange will be with index 30 and dataLastBarInRange with 10
        if (dataFirstBarInRange !== null && dataLastBarInRange !== null && dataFirstBarInRange._internal_index > dataLastBarInRange._internal_index) {
            return {
                barsBefore: range.from - dataFirstIndex,
                barsAfter: dataLastIndex - range.to,
            };
        }
        const barsBefore = (dataFirstBarInRange === null || dataFirstBarInRange._internal_index === dataFirstIndex)
            ? range.from - dataFirstIndex
            : dataFirstBarInRange._internal_index - dataFirstIndex;
        const barsAfter = (dataLastBarInRange === null || dataLastBarInRange._internal_index === dataLastIndex)
            ? dataLastIndex - range.to
            : dataLastIndex - dataLastBarInRange._internal_index;
        const result = { barsBefore, barsAfter };
        // actually they can't exist separately
        if (dataFirstBarInRange !== null && dataLastBarInRange !== null) {
            result.from = dataFirstBarInRange._internal_originalTime;
            result.to = dataLastBarInRange._internal_originalTime;
        }
        return result;
    }
    setData(data) {
        checkItemsAreOrdered(data, this._private__horzScaleBehavior);
        checkSeriesValuesType(this._internal__series._internal_seriesType(), data);
        this._internal__dataUpdatesConsumer._internal_applyNewData(this._internal__series, data);
        this._private__onDataChanged('full');
    }
    update(bar) {
        checkSeriesValuesType(this._internal__series._internal_seriesType(), [bar]);
        this._internal__dataUpdatesConsumer._internal_updateData(this._internal__series, bar);
        this._private__onDataChanged('update');
    }
    dataByIndex(logicalIndex, mismatchDirection) {
        const data = this._internal__series._internal_bars()._internal_search(logicalIndex, mismatchDirection);
        if (data === null) {
            // actually it can be a whitespace
            return null;
        }
        const creator = getSeriesDataCreator(this.seriesType());
        return creator(data);
    }
    data() {
        const seriesCreator = getSeriesDataCreator(this.seriesType());
        const rows = this._internal__series._internal_bars()._internal_rows();
        return rows.map((row) => seriesCreator(row));
    }
    subscribeDataChanged(handler) {
        this._private__dataChangedDelegate._internal_subscribe(handler);
    }
    unsubscribeDataChanged(handler) {
        this._private__dataChangedDelegate._internal_unsubscribe(handler);
    }
    setMarkers(data) {
        checkItemsAreOrdered(data, this._private__horzScaleBehavior, true);
        const convertedMarkers = data.map((marker) => convertSeriesMarker(marker, this._private__horzScaleBehavior.convertHorzItemToInternal(marker.time), marker.time));
        this._internal__series._internal_setMarkers(convertedMarkers);
    }
    markers() {
        return this._internal__series._internal_markers().map((internalItem) => {
            return convertSeriesMarker(internalItem, internalItem.originalTime, undefined);
        });
    }
    applyOptions(options) {
        this._internal__series._internal_applyOptions(options);
    }
    options() {
        return clone(this._internal__series._internal_options());
    }
    priceScale() {
        return this._private__priceScaleApiProvider.priceScale(this._internal__series._internal_priceScale()._internal_id());
    }
    createPriceLine(options) {
        checkPriceLineOptions(options);
        const strictOptions = merge(clone(priceLineOptionsDefaults), options);
        const priceLine = this._internal__series._internal_createPriceLine(strictOptions);
        return new PriceLine(priceLine);
    }
    removePriceLine(line) {
        this._internal__series._internal_removePriceLine(line._internal_priceLine());
    }
    seriesType() {
        return this._internal__series._internal_seriesType();
    }
    attachPrimitive(primitive) {
        // at this point we cast the generic to unknown because we
        // don't want the model to know the types of the API (◑_◑)
        this._internal__series._internal_attachPrimitive(primitive);
        if (primitive.attached) {
            primitive.attached({
                chart: this._internal__chartApi,
                series: this,
                requestUpdate: () => this._internal__series._internal_model()._internal_fullUpdate(),
            });
        }
    }
    detachPrimitive(primitive) {
        this._internal__series._internal_detachPrimitive(primitive);
        if (primitive.detached) {
            primitive.detached();
        }
    }
    _private__onDataChanged(scope) {
        if (this._private__dataChangedDelegate._internal_hasListeners()) {
            this._private__dataChangedDelegate._internal_fire(scope);
        }
    }
}
