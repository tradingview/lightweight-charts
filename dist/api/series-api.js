import { ensureNotNull } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { clone, merge } from '../helpers/strict-type-checks';
import { checkBoxOptions, checkItemsAreOrdered, checkPriceLineOptions, checkSeriesValuesType } from '../model/data-validators';
import { RangeImpl } from '../model/range-impl';
import { convertSeriesMarker } from '../model/series-markers';
import { TimeScaleVisibleRange } from '../model/time-scale-visible-range';
import { Box } from './box-api';
import { getSeriesDataCreator } from './get-series-data-creator';
import { boxOptionsDefaults } from './options/box-options-default';
import { priceLineOptionsDefaults } from './options/price-line-options-defaults';
import { PriceLine } from './price-line-api';
export class SeriesApi {
    constructor(series, dataUpdatesConsumer, priceScaleApiProvider, chartApi, horzScaleBehavior) {
        this._dataChangedDelegate = new Delegate();
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
        const correctedRange = new TimeScaleVisibleRange(new RangeImpl(range.from, range.to)).strictRange();
        const bars = this._series.bars();
        if (bars.isEmpty()) {
            return null;
        }
        const dataFirstBarInRange = bars.search(correctedRange.left(), 1 /* MismatchDirection.NearestRight */);
        const dataLastBarInRange = bars.search(correctedRange.right(), -1 /* MismatchDirection.NearestLeft */);
        const dataFirstIndex = ensureNotNull(bars.firstIndex());
        const dataLastIndex = ensureNotNull(bars.lastIndex());
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
        checkItemsAreOrdered(data, this._horzScaleBehavior);
        checkSeriesValuesType(this._series.seriesType(), data);
        this._dataUpdatesConsumer.applyNewData(this._series, data);
        this._onDataChanged('full');
    }
    update(bar) {
        checkSeriesValuesType(this._series.seriesType(), [bar]);
        this._dataUpdatesConsumer.updateData(this._series, bar);
        this._onDataChanged('update');
    }
    dataByIndex(logicalIndex, mismatchDirection) {
        const data = this._series.bars().search(logicalIndex, mismatchDirection);
        if (data === null) {
            // actually it can be a whitespace
            return null;
        }
        const creator = getSeriesDataCreator(this.seriesType());
        return creator(data);
    }
    data() {
        const seriesCreator = getSeriesDataCreator(this.seriesType());
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
        checkItemsAreOrdered(data, this._horzScaleBehavior, true);
        const convertedMarkers = data.map((marker) => convertSeriesMarker(marker, this._horzScaleBehavior.convertHorzItemToInternal(marker.time), marker.time));
        this._series.setMarkers(convertedMarkers);
    }
    markers() {
        return this._series.markers().map((internalItem) => {
            return convertSeriesMarker(internalItem, internalItem.originalTime, undefined);
        });
    }
    applyOptions(options) {
        this._series.applyOptions(options);
    }
    options() {
        return clone(this._series.options());
    }
    priceScale() {
        return this._priceScaleApiProvider.priceScale(this._series.priceScale().id());
    }
    createPriceLine(options) {
        checkPriceLineOptions(options);
        const strictOptions = merge(clone(priceLineOptionsDefaults), options);
        const priceLine = this._series.createPriceLine(strictOptions);
        return new PriceLine(priceLine);
    }
    removePriceLine(line) {
        this._series.removePriceLine(line.priceLine());
    }
    createBox(options) {
        const strictOptions = merge(clone(boxOptionsDefaults), options);
        checkBoxOptions(strictOptions);
        const box = this._series.createBox(strictOptions);
        return new Box(box);
    }
    removeBox(box) {
        this._series.removeBox(box.box());
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
