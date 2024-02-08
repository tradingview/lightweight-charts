import { PercentageFormatter } from '../formatters/percentage-formatter';
import { PriceFormatter } from '../formatters/price-formatter';
import { ensureDefined, ensureNotNull } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { merge } from '../helpers/strict-type-checks';
import { PriceRangeImpl } from './price-range-impl';
import { canConvertPriceRangeFromLog, convertPriceRangeFromLog, convertPriceRangeToLog, fromIndexedTo100, fromLog, fromPercent, logFormulaForPriceRange, logFormulasAreSame, toIndexedTo100, toIndexedTo100Range, toLog, toPercent, toPercentRange, } from './price-scale-conversions';
import { PriceTickMarkBuilder } from './price-tick-mark-builder';
import { sortSources } from './sort-sources';
/**
 * Represents the price scale mode.
 */
export var PriceScaleMode;
(function (PriceScaleMode) {
    /**
     * Price scale shows prices. Price range changes linearly.
     */
    PriceScaleMode[PriceScaleMode["Normal"] = 0] = "Normal";
    /**
     * Price scale shows prices. Price range changes logarithmically.
     */
    PriceScaleMode[PriceScaleMode["Logarithmic"] = 1] = "Logarithmic";
    /**
     * Price scale shows percentage values according the first visible value of the price scale.
     * The first visible value is 0% in this mode.
     */
    PriceScaleMode[PriceScaleMode["Percentage"] = 2] = "Percentage";
    /**
     * The same as percentage mode, but the first value is moved to 100.
     */
    PriceScaleMode[PriceScaleMode["IndexedTo100"] = 3] = "IndexedTo100";
})(PriceScaleMode || (PriceScaleMode = {}));
const percentageFormatter = new PercentageFormatter();
const defaultPriceFormatter = new PriceFormatter(100, 1);
export class PriceScale {
    constructor(id, options, layoutOptions, localizationOptions) {
        this._private__height = 0;
        this._private__internalHeightCache = null;
        this._private__priceRange = null;
        this._private__priceRangeSnapshot = null;
        this._private__invalidatedForRange = { _internal_isValid: false, _internal_visibleBars: null };
        this._private__marginAbove = 0;
        this._private__marginBelow = 0;
        this._private__onMarksChanged = new Delegate();
        this._private__modeChanged = new Delegate();
        this._private__dataSources = [];
        this._private__cachedOrderedSources = null;
        this._private__marksCache = null;
        this._private__scaleStartPoint = null;
        this._private__scrollStartPoint = null;
        this._private__formatter = defaultPriceFormatter;
        this._private__logFormula = logFormulaForPriceRange(null);
        this._private__id = id;
        this._private__options = options;
        this._private__layoutOptions = layoutOptions;
        this._private__localizationOptions = localizationOptions;
        this._private__markBuilder = new PriceTickMarkBuilder(this, 100, this._private__coordinateToLogical.bind(this), this._private__logicalToCoordinate.bind(this));
    }
    _internal_id() {
        return this._private__id;
    }
    _internal_options() {
        return this._private__options;
    }
    _internal_applyOptions(options) {
        merge(this._private__options, options);
        this._internal_updateFormatter();
        if (options.mode !== undefined) {
            this._internal_setMode({ _internal_mode: options.mode });
        }
        if (options.scaleMargins !== undefined) {
            const top = ensureDefined(options.scaleMargins.top);
            const bottom = ensureDefined(options.scaleMargins.bottom);
            if (top < 0 || top > 1) {
                throw new Error(`Invalid top margin - expect value between 0 and 1, given=${top}`);
            }
            if (bottom < 0 || bottom > 1) {
                throw new Error(`Invalid bottom margin - expect value between 0 and 1, given=${bottom}`);
            }
            if (top + bottom > 1) {
                throw new Error(`Invalid margins - sum of margins must be less than 1, given=${top + bottom}`);
            }
            this._private__invalidateInternalHeightCache();
            this._private__marksCache = null;
        }
    }
    _internal_isAutoScale() {
        return this._private__options.autoScale;
    }
    _internal_isLog() {
        return this._private__options.mode === 1 /* PriceScaleMode.Logarithmic */;
    }
    _internal_isPercentage() {
        return this._private__options.mode === 2 /* PriceScaleMode.Percentage */;
    }
    _internal_isIndexedTo100() {
        return this._private__options.mode === 3 /* PriceScaleMode.IndexedTo100 */;
    }
    _internal_mode() {
        return {
            _internal_autoScale: this._private__options.autoScale,
            _internal_isInverted: this._private__options.invertScale,
            _internal_mode: this._private__options.mode,
        };
    }
    // eslint-disable-next-line complexity
    _internal_setMode(newMode) {
        const oldMode = this._internal_mode();
        let priceRange = null;
        if (newMode._internal_autoScale !== undefined) {
            this._private__options.autoScale = newMode._internal_autoScale;
        }
        if (newMode._internal_mode !== undefined) {
            this._private__options.mode = newMode._internal_mode;
            if (newMode._internal_mode === 2 /* PriceScaleMode.Percentage */ || newMode._internal_mode === 3 /* PriceScaleMode.IndexedTo100 */) {
                this._private__options.autoScale = true;
            }
            // TODO: Remove after making rebuildTickMarks lazy
            this._private__invalidatedForRange._internal_isValid = false;
        }
        // define which scale converted from
        if (oldMode._internal_mode === 1 /* PriceScaleMode.Logarithmic */ && newMode._internal_mode !== oldMode._internal_mode) {
            if (canConvertPriceRangeFromLog(this._private__priceRange, this._private__logFormula)) {
                priceRange = convertPriceRangeFromLog(this._private__priceRange, this._private__logFormula);
                if (priceRange !== null) {
                    this._internal_setPriceRange(priceRange);
                }
            }
            else {
                this._private__options.autoScale = true;
            }
        }
        // define which scale converted to
        if (newMode._internal_mode === 1 /* PriceScaleMode.Logarithmic */ && newMode._internal_mode !== oldMode._internal_mode) {
            priceRange = convertPriceRangeToLog(this._private__priceRange, this._private__logFormula);
            if (priceRange !== null) {
                this._internal_setPriceRange(priceRange);
            }
        }
        const modeChanged = oldMode._internal_mode !== this._private__options.mode;
        if (modeChanged && (oldMode._internal_mode === 2 /* PriceScaleMode.Percentage */ || this._internal_isPercentage())) {
            this._internal_updateFormatter();
        }
        if (modeChanged && (oldMode._internal_mode === 3 /* PriceScaleMode.IndexedTo100 */ || this._internal_isIndexedTo100())) {
            this._internal_updateFormatter();
        }
        if (newMode._internal_isInverted !== undefined && oldMode._internal_isInverted !== newMode._internal_isInverted) {
            this._private__options.invertScale = newMode._internal_isInverted;
            this._private__onIsInvertedChanged();
        }
        this._private__modeChanged._internal_fire(oldMode, this._internal_mode());
    }
    _internal_modeChanged() {
        return this._private__modeChanged;
    }
    _internal_fontSize() {
        return this._private__layoutOptions.fontSize;
    }
    _internal_height() {
        return this._private__height;
    }
    _internal_setHeight(value) {
        if (this._private__height === value) {
            return;
        }
        this._private__height = value;
        this._private__invalidateInternalHeightCache();
        this._private__marksCache = null;
    }
    _internal_internalHeight() {
        if (this._private__internalHeightCache) {
            return this._private__internalHeightCache;
        }
        const res = this._internal_height() - this._private__topMarginPx() - this._private__bottomMarginPx();
        this._private__internalHeightCache = res;
        return res;
    }
    _internal_priceRange() {
        this._private__makeSureItIsValid();
        return this._private__priceRange;
    }
    _internal_setPriceRange(newPriceRange, isForceSetValue) {
        const oldPriceRange = this._private__priceRange;
        if (!isForceSetValue &&
            !(oldPriceRange === null && newPriceRange !== null) &&
            (oldPriceRange === null || oldPriceRange._internal_equals(newPriceRange))) {
            return;
        }
        this._private__marksCache = null;
        this._private__priceRange = newPriceRange;
    }
    _internal_isEmpty() {
        this._private__makeSureItIsValid();
        return this._private__height === 0 || !this._private__priceRange || this._private__priceRange._internal_isEmpty();
    }
    _internal_invertedCoordinate(coordinate) {
        return this._internal_isInverted() ? coordinate : this._internal_height() - 1 - coordinate;
    }
    _internal_priceToCoordinate(price, baseValue) {
        if (this._internal_isPercentage()) {
            price = toPercent(price, baseValue);
        }
        else if (this._internal_isIndexedTo100()) {
            price = toIndexedTo100(price, baseValue);
        }
        return this._private__logicalToCoordinate(price, baseValue);
    }
    _internal_pointsArrayToCoordinates(points, baseValue, visibleRange) {
        this._private__makeSureItIsValid();
        const bh = this._private__bottomMarginPx();
        const range = ensureNotNull(this._internal_priceRange());
        const min = range._internal_minValue();
        const max = range._internal_maxValue();
        const ih = (this._internal_internalHeight() - 1);
        const isInverted = this._internal_isInverted();
        const hmm = ih / (max - min);
        const fromIndex = (visibleRange === undefined) ? 0 : visibleRange.from;
        const toIndex = (visibleRange === undefined) ? points.length : visibleRange.to;
        const transformFn = this._private__getCoordinateTransformer();
        for (let i = fromIndex; i < toIndex; i++) {
            const point = points[i];
            const price = point._internal_price;
            if (isNaN(price)) {
                continue;
            }
            let logical = price;
            if (transformFn !== null) {
                logical = transformFn(point._internal_price, baseValue);
            }
            const invCoordinate = bh + hmm * (logical - min);
            const coordinate = isInverted ? invCoordinate : this._private__height - 1 - invCoordinate;
            point._internal_y = coordinate;
        }
    }
    _internal_barPricesToCoordinates(pricesList, baseValue, visibleRange) {
        this._private__makeSureItIsValid();
        const bh = this._private__bottomMarginPx();
        const range = ensureNotNull(this._internal_priceRange());
        const min = range._internal_minValue();
        const max = range._internal_maxValue();
        const ih = (this._internal_internalHeight() - 1);
        const isInverted = this._internal_isInverted();
        const hmm = ih / (max - min);
        const fromIndex = (visibleRange === undefined) ? 0 : visibleRange.from;
        const toIndex = (visibleRange === undefined) ? pricesList.length : visibleRange.to;
        const transformFn = this._private__getCoordinateTransformer();
        for (let i = fromIndex; i < toIndex; i++) {
            const bar = pricesList[i];
            let openLogical = bar._internal_open;
            let highLogical = bar._internal_high;
            let lowLogical = bar._internal_low;
            let closeLogical = bar._internal_close;
            if (transformFn !== null) {
                openLogical = transformFn(bar._internal_open, baseValue);
                highLogical = transformFn(bar._internal_high, baseValue);
                lowLogical = transformFn(bar._internal_low, baseValue);
                closeLogical = transformFn(bar._internal_close, baseValue);
            }
            let invCoordinate = bh + hmm * (openLogical - min);
            let coordinate = isInverted ? invCoordinate : this._private__height - 1 - invCoordinate;
            bar._internal_openY = coordinate;
            invCoordinate = bh + hmm * (highLogical - min);
            coordinate = isInverted ? invCoordinate : this._private__height - 1 - invCoordinate;
            bar._internal_highY = coordinate;
            invCoordinate = bh + hmm * (lowLogical - min);
            coordinate = isInverted ? invCoordinate : this._private__height - 1 - invCoordinate;
            bar._internal_lowY = coordinate;
            invCoordinate = bh + hmm * (closeLogical - min);
            coordinate = isInverted ? invCoordinate : this._private__height - 1 - invCoordinate;
            bar._internal_closeY = coordinate;
        }
    }
    _internal_coordinateToPrice(coordinate, baseValue) {
        const logical = this._private__coordinateToLogical(coordinate, baseValue);
        return this._internal_logicalToPrice(logical, baseValue);
    }
    _internal_logicalToPrice(logical, baseValue) {
        let value = logical;
        if (this._internal_isPercentage()) {
            value = fromPercent(value, baseValue);
        }
        else if (this._internal_isIndexedTo100()) {
            value = fromIndexedTo100(value, baseValue);
        }
        return value;
    }
    _internal_dataSources() {
        return this._private__dataSources;
    }
    _internal_orderedSources() {
        if (this._private__cachedOrderedSources) {
            return this._private__cachedOrderedSources;
        }
        let sources = [];
        for (let i = 0; i < this._private__dataSources.length; i++) {
            const ds = this._private__dataSources[i];
            if (ds._internal_zorder() === null) {
                ds._internal_setZorder(i + 1);
            }
            sources.push(ds);
        }
        sources = sortSources(sources);
        this._private__cachedOrderedSources = sources;
        return this._private__cachedOrderedSources;
    }
    _internal_addDataSource(source) {
        if (this._private__dataSources.indexOf(source) !== -1) {
            return;
        }
        this._private__dataSources.push(source);
        this._internal_updateFormatter();
        this._internal_invalidateSourcesCache();
    }
    _internal_removeDataSource(source) {
        const index = this._private__dataSources.indexOf(source);
        if (index === -1) {
            throw new Error('source is not attached to scale');
        }
        this._private__dataSources.splice(index, 1);
        if (this._private__dataSources.length === 0) {
            this._internal_setMode({
                _internal_autoScale: true,
            });
            // if no sources on price scale let's clear price range cache as well as enabling auto scale
            this._internal_setPriceRange(null);
        }
        this._internal_updateFormatter();
        this._internal_invalidateSourcesCache();
    }
    _internal_firstValue() {
        // TODO: cache the result
        let result = null;
        for (const source of this._private__dataSources) {
            const firstValue = source._internal_firstValue();
            if (firstValue === null) {
                continue;
            }
            if (result === null || firstValue._internal_timePoint < result._internal_timePoint) {
                result = firstValue;
            }
        }
        return result === null ? null : result._internal_value;
    }
    _internal_isInverted() {
        return this._private__options.invertScale;
    }
    _internal_marks() {
        const firstValueIsNull = this._internal_firstValue() === null;
        // do not recalculate marks if firstValueIsNull is true because in this case we'll always get empty result
        // this could happen in case when a series had some data and then you set empty data to it (in a simplified case)
        // we could display an empty price scale, but this is not good from UX
        // so in this case we need to keep an previous marks to display them on the scale
        // as one of possible examples for this situation could be the following:
        // let's say you have a study/indicator attached to a price scale and then you decide to stop it, i.e. remove its data because of its visibility
        // a user will see the previous marks on the scale until you turn on your study back or remove it from the chart completely
        if (this._private__marksCache !== null && (firstValueIsNull || this._private__marksCache._internal_firstValueIsNull === firstValueIsNull)) {
            return this._private__marksCache._internal_marks;
        }
        this._private__markBuilder._internal_rebuildTickMarks();
        const marks = this._private__markBuilder._internal_marks();
        this._private__marksCache = { _internal_marks: marks, _internal_firstValueIsNull: firstValueIsNull };
        this._private__onMarksChanged._internal_fire();
        return marks;
    }
    _internal_onMarksChanged() {
        return this._private__onMarksChanged;
    }
    _internal_startScale(x) {
        if (this._internal_isPercentage() || this._internal_isIndexedTo100()) {
            return;
        }
        if (this._private__scaleStartPoint !== null || this._private__priceRangeSnapshot !== null) {
            return;
        }
        if (this._internal_isEmpty()) {
            return;
        }
        // invert x
        this._private__scaleStartPoint = this._private__height - x;
        this._private__priceRangeSnapshot = ensureNotNull(this._internal_priceRange())._internal_clone();
    }
    _internal_scaleTo(x) {
        if (this._internal_isPercentage() || this._internal_isIndexedTo100()) {
            return;
        }
        if (this._private__scaleStartPoint === null) {
            return;
        }
        this._internal_setMode({
            _internal_autoScale: false,
        });
        // invert x
        x = this._private__height - x;
        if (x < 0) {
            x = 0;
        }
        let scaleCoeff = (this._private__scaleStartPoint + (this._private__height - 1) * 0.2) / (x + (this._private__height - 1) * 0.2);
        const newPriceRange = ensureNotNull(this._private__priceRangeSnapshot)._internal_clone();
        scaleCoeff = Math.max(scaleCoeff, 0.1);
        newPriceRange._internal_scaleAroundCenter(scaleCoeff);
        this._internal_setPriceRange(newPriceRange);
    }
    _internal_endScale() {
        if (this._internal_isPercentage() || this._internal_isIndexedTo100()) {
            return;
        }
        this._private__scaleStartPoint = null;
        this._private__priceRangeSnapshot = null;
    }
    _internal_startScroll(x) {
        if (this._internal_isAutoScale()) {
            return;
        }
        if (this._private__scrollStartPoint !== null || this._private__priceRangeSnapshot !== null) {
            return;
        }
        if (this._internal_isEmpty()) {
            return;
        }
        this._private__scrollStartPoint = x;
        this._private__priceRangeSnapshot = ensureNotNull(this._internal_priceRange())._internal_clone();
    }
    _internal_scrollTo(x) {
        if (this._internal_isAutoScale()) {
            return;
        }
        if (this._private__scrollStartPoint === null) {
            return;
        }
        const priceUnitsPerPixel = ensureNotNull(this._internal_priceRange())._internal_length() / (this._internal_internalHeight() - 1);
        let pixelDelta = x - this._private__scrollStartPoint;
        if (this._internal_isInverted()) {
            pixelDelta *= -1;
        }
        const priceDelta = pixelDelta * priceUnitsPerPixel;
        const newPriceRange = ensureNotNull(this._private__priceRangeSnapshot)._internal_clone();
        newPriceRange._internal_shift(priceDelta);
        this._internal_setPriceRange(newPriceRange, true);
        this._private__marksCache = null;
    }
    _internal_endScroll() {
        if (this._internal_isAutoScale()) {
            return;
        }
        if (this._private__scrollStartPoint === null) {
            return;
        }
        this._private__scrollStartPoint = null;
        this._private__priceRangeSnapshot = null;
    }
    _internal_formatter() {
        if (!this._private__formatter) {
            this._internal_updateFormatter();
        }
        return this._private__formatter;
    }
    _internal_formatPrice(price, firstValue) {
        switch (this._private__options.mode) {
            case 2 /* PriceScaleMode.Percentage */:
                return this._private__formatPercentage(toPercent(price, firstValue));
            case 3 /* PriceScaleMode.IndexedTo100 */:
                return this._internal_formatter().format(toIndexedTo100(price, firstValue));
            default:
                return this._private__formatPrice(price);
        }
    }
    _internal_formatLogical(logical) {
        switch (this._private__options.mode) {
            case 2 /* PriceScaleMode.Percentage */:
                return this._private__formatPercentage(logical);
            case 3 /* PriceScaleMode.IndexedTo100 */:
                return this._internal_formatter().format(logical);
            default:
                return this._private__formatPrice(logical);
        }
    }
    _internal_formatPriceAbsolute(price) {
        return this._private__formatPrice(price, ensureNotNull(this._private__formatterSource())._internal_formatter());
    }
    _internal_formatPricePercentage(price, baseValue) {
        price = toPercent(price, baseValue);
        return this._private__formatPercentage(price, percentageFormatter);
    }
    _internal_sourcesForAutoScale() {
        return this._private__dataSources;
    }
    _internal_recalculatePriceRange(visibleBars) {
        this._private__invalidatedForRange = {
            _internal_visibleBars: visibleBars,
            _internal_isValid: false,
        };
    }
    _internal_updateAllViews() {
        this._private__dataSources.forEach((s) => s._internal_updateAllViews());
    }
    _internal_updateFormatter() {
        this._private__marksCache = null;
        const formatterSource = this._private__formatterSource();
        let base = 100;
        if (formatterSource !== null) {
            base = Math.round(1 / formatterSource._internal_minMove());
        }
        this._private__formatter = defaultPriceFormatter;
        if (this._internal_isPercentage()) {
            this._private__formatter = percentageFormatter;
            base = 100;
        }
        else if (this._internal_isIndexedTo100()) {
            this._private__formatter = new PriceFormatter(100, 1);
            base = 100;
        }
        else {
            if (formatterSource !== null) {
                // user
                this._private__formatter = formatterSource._internal_formatter();
            }
        }
        this._private__markBuilder = new PriceTickMarkBuilder(this, base, this._private__coordinateToLogical.bind(this), this._private__logicalToCoordinate.bind(this));
        this._private__markBuilder._internal_rebuildTickMarks();
    }
    _internal_invalidateSourcesCache() {
        this._private__cachedOrderedSources = null;
    }
    /**
     * @returns The {@link IPriceDataSource} that will be used as the "formatter source" (take minMove for formatter).
     */
    _private__formatterSource() {
        return this._private__dataSources[0] || null;
    }
    _private__topMarginPx() {
        return this._internal_isInverted()
            ? this._private__options.scaleMargins.bottom * this._internal_height() + this._private__marginBelow
            : this._private__options.scaleMargins.top * this._internal_height() + this._private__marginAbove;
    }
    _private__bottomMarginPx() {
        return this._internal_isInverted()
            ? this._private__options.scaleMargins.top * this._internal_height() + this._private__marginAbove
            : this._private__options.scaleMargins.bottom * this._internal_height() + this._private__marginBelow;
    }
    _private__makeSureItIsValid() {
        if (!this._private__invalidatedForRange._internal_isValid) {
            this._private__invalidatedForRange._internal_isValid = true;
            this._private__recalculatePriceRangeImpl();
        }
    }
    _private__invalidateInternalHeightCache() {
        this._private__internalHeightCache = null;
    }
    _private__logicalToCoordinate(logical, baseValue) {
        this._private__makeSureItIsValid();
        if (this._internal_isEmpty()) {
            return 0;
        }
        logical = this._internal_isLog() && logical ? toLog(logical, this._private__logFormula) : logical;
        const range = ensureNotNull(this._internal_priceRange());
        const invCoordinate = this._private__bottomMarginPx() +
            (this._internal_internalHeight() - 1) * (logical - range._internal_minValue()) / range._internal_length();
        const coordinate = this._internal_invertedCoordinate(invCoordinate);
        return coordinate;
    }
    _private__coordinateToLogical(coordinate, baseValue) {
        this._private__makeSureItIsValid();
        if (this._internal_isEmpty()) {
            return 0;
        }
        const invCoordinate = this._internal_invertedCoordinate(coordinate);
        const range = ensureNotNull(this._internal_priceRange());
        const logical = range._internal_minValue() + range._internal_length() *
            ((invCoordinate - this._private__bottomMarginPx()) / (this._internal_internalHeight() - 1));
        return this._internal_isLog() ? fromLog(logical, this._private__logFormula) : logical;
    }
    _private__onIsInvertedChanged() {
        this._private__marksCache = null;
        this._private__markBuilder._internal_rebuildTickMarks();
    }
    // eslint-disable-next-line complexity
    _private__recalculatePriceRangeImpl() {
        const visibleBars = this._private__invalidatedForRange._internal_visibleBars;
        if (visibleBars === null) {
            return;
        }
        let priceRange = null;
        const sources = this._internal_sourcesForAutoScale();
        let marginAbove = 0;
        let marginBelow = 0;
        for (const source of sources) {
            if (!source._internal_visible()) {
                continue;
            }
            const firstValue = source._internal_firstValue();
            if (firstValue === null) {
                continue;
            }
            const autoScaleInfo = source._internal_autoscaleInfo(visibleBars._internal_left(), visibleBars._internal_right());
            let sourceRange = autoScaleInfo && autoScaleInfo._internal_priceRange();
            if (sourceRange !== null) {
                switch (this._private__options.mode) {
                    case 1 /* PriceScaleMode.Logarithmic */:
                        sourceRange = convertPriceRangeToLog(sourceRange, this._private__logFormula);
                        break;
                    case 2 /* PriceScaleMode.Percentage */:
                        sourceRange = toPercentRange(sourceRange, firstValue._internal_value);
                        break;
                    case 3 /* PriceScaleMode.IndexedTo100 */:
                        sourceRange = toIndexedTo100Range(sourceRange, firstValue._internal_value);
                        break;
                }
                if (priceRange === null) {
                    priceRange = sourceRange;
                }
                else {
                    priceRange = priceRange._internal_merge(ensureNotNull(sourceRange));
                }
                if (autoScaleInfo !== null) {
                    const margins = autoScaleInfo._internal_margins();
                    if (margins !== null) {
                        marginAbove = Math.max(marginAbove, margins.above);
                        marginBelow = Math.max(marginAbove, margins.below);
                    }
                }
            }
        }
        if (marginAbove !== this._private__marginAbove || marginBelow !== this._private__marginBelow) {
            this._private__marginAbove = marginAbove;
            this._private__marginBelow = marginBelow;
            this._private__marksCache = null;
            this._private__invalidateInternalHeightCache();
        }
        if (priceRange !== null) {
            // keep current range is new is empty
            if (priceRange._internal_minValue() === priceRange._internal_maxValue()) {
                const formatterSource = this._private__formatterSource();
                const minMove = formatterSource === null || this._internal_isPercentage() || this._internal_isIndexedTo100() ? 1 : formatterSource._internal_minMove();
                // if price range is degenerated to 1 point let's extend it by 10 min move values
                // to avoid incorrect range and empty (blank) scale (in case of min tick much greater than 1)
                const extendValue = 5 * minMove;
                if (this._internal_isLog()) {
                    priceRange = convertPriceRangeFromLog(priceRange, this._private__logFormula);
                }
                priceRange = new PriceRangeImpl(priceRange._internal_minValue() - extendValue, priceRange._internal_maxValue() + extendValue);
                if (this._internal_isLog()) {
                    priceRange = convertPriceRangeToLog(priceRange, this._private__logFormula);
                }
            }
            if (this._internal_isLog()) {
                const rawRange = convertPriceRangeFromLog(priceRange, this._private__logFormula);
                const newLogFormula = logFormulaForPriceRange(rawRange);
                if (!logFormulasAreSame(newLogFormula, this._private__logFormula)) {
                    const rawSnapshot = this._private__priceRangeSnapshot !== null ? convertPriceRangeFromLog(this._private__priceRangeSnapshot, this._private__logFormula) : null;
                    this._private__logFormula = newLogFormula;
                    priceRange = convertPriceRangeToLog(rawRange, newLogFormula);
                    if (rawSnapshot !== null) {
                        this._private__priceRangeSnapshot = convertPriceRangeToLog(rawSnapshot, newLogFormula);
                    }
                }
            }
            this._internal_setPriceRange(priceRange);
        }
        else {
            // reset empty to default
            if (this._private__priceRange === null) {
                this._internal_setPriceRange(new PriceRangeImpl(-0.5, 0.5));
                this._private__logFormula = logFormulaForPriceRange(null);
            }
        }
        this._private__invalidatedForRange._internal_isValid = true;
    }
    _private__getCoordinateTransformer() {
        if (this._internal_isPercentage()) {
            return toPercent;
        }
        else if (this._internal_isIndexedTo100()) {
            return toIndexedTo100;
        }
        else if (this._internal_isLog()) {
            return (price) => toLog(price, this._private__logFormula);
        }
        return null;
    }
    _private__formatValue(value, formatter, fallbackFormatter) {
        if (formatter === undefined) {
            if (fallbackFormatter === undefined) {
                fallbackFormatter = this._internal_formatter();
            }
            return fallbackFormatter.format(value);
        }
        return formatter(value);
    }
    _private__formatPrice(price, fallbackFormatter) {
        return this._private__formatValue(price, this._private__localizationOptions.priceFormatter, fallbackFormatter);
    }
    _private__formatPercentage(percentage, fallbackFormatter) {
        return this._private__formatValue(percentage, this._private__localizationOptions.percentageFormatter, fallbackFormatter);
    }
}
