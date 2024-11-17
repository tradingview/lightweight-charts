import { PercentageFormatter } from '../formatters/percentage-formatter';
import { PriceFormatter } from '../formatters/price-formatter';
import { ensureDefined, ensureNotNull } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { merge } from '../helpers/strict-type-checks';
import { PriceRangeImpl } from './price-range-impl';
import { canConvertPriceRangeFromLog, convertPriceRangeFromLog, convertPriceRangeToLog, fromIndexedTo100, fromLog, fromPercent, logFormulaForPriceRange, logFormulasAreSame, toIndexedTo100, toIndexedTo100Range, toLog, toPercent, toPercentRange, } from './price-scale-conversions';
import { PriceTickMarkBuilder } from './price-tick-mark-builder';
import { sortSources } from './sort-sources';
const percentageFormatter = new PercentageFormatter();
const defaultPriceFormatter = new PriceFormatter(100, 1);
export class PriceScale {
    constructor(id, options, layoutOptions, localizationOptions) {
        this._height = 0;
        this._internalHeightCache = null;
        this._priceRange = null;
        this._priceRangeSnapshot = null;
        this._invalidatedForRange = { isValid: false, visibleBars: null };
        this._marginAbove = 0;
        this._marginBelow = 0;
        this._onMarksChanged = new Delegate();
        this._modeChanged = new Delegate();
        this._dataSources = [];
        this._cachedOrderedSources = null;
        this._marksCache = null;
        this._scaleStartPoint = null;
        this._scrollStartPoint = null;
        this._formatter = defaultPriceFormatter;
        this._logFormula = logFormulaForPriceRange(null);
        this._id = id;
        this._options = options;
        this._layoutOptions = layoutOptions;
        this._localizationOptions = localizationOptions;
        this._markBuilder = new PriceTickMarkBuilder(this, 100, this._coordinateToLogical.bind(this), this._logicalToCoordinate.bind(this));
    }
    id() {
        return this._id;
    }
    options() {
        return this._options;
    }
    applyOptions(options) {
        merge(this._options, options);
        this.updateFormatter();
        if (options.mode !== undefined) {
            this.setMode({ mode: options.mode });
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
            this._invalidateInternalHeightCache();
            this._marksCache = null;
        }
    }
    isAutoScale() {
        return this._options.autoScale;
    }
    isLog() {
        return this._options.mode === 1 /* PriceScaleMode.Logarithmic */;
    }
    isPercentage() {
        return this._options.mode === 2 /* PriceScaleMode.Percentage */;
    }
    isIndexedTo100() {
        return this._options.mode === 3 /* PriceScaleMode.IndexedTo100 */;
    }
    mode() {
        return {
            autoScale: this._options.autoScale,
            isInverted: this._options.invertScale,
            mode: this._options.mode,
        };
    }
    // eslint-disable-next-line complexity
    setMode(newMode) {
        const oldMode = this.mode();
        let priceRange = null;
        if (newMode.autoScale !== undefined) {
            this._options.autoScale = newMode.autoScale;
        }
        if (newMode.mode !== undefined) {
            this._options.mode = newMode.mode;
            if (newMode.mode === 2 /* PriceScaleMode.Percentage */ || newMode.mode === 3 /* PriceScaleMode.IndexedTo100 */) {
                this._options.autoScale = true;
            }
            // TODO: Remove after making rebuildTickMarks lazy
            this._invalidatedForRange.isValid = false;
        }
        // define which scale converted from
        if (oldMode.mode === 1 /* PriceScaleMode.Logarithmic */ && newMode.mode !== oldMode.mode) {
            if (canConvertPriceRangeFromLog(this._priceRange, this._logFormula)) {
                priceRange = convertPriceRangeFromLog(this._priceRange, this._logFormula);
                if (priceRange !== null) {
                    this.setPriceRange(priceRange);
                }
            }
            else {
                this._options.autoScale = true;
            }
        }
        // define which scale converted to
        if (newMode.mode === 1 /* PriceScaleMode.Logarithmic */ && newMode.mode !== oldMode.mode) {
            priceRange = convertPriceRangeToLog(this._priceRange, this._logFormula);
            if (priceRange !== null) {
                this.setPriceRange(priceRange);
            }
        }
        const modeChanged = oldMode.mode !== this._options.mode;
        if (modeChanged && (oldMode.mode === 2 /* PriceScaleMode.Percentage */ || this.isPercentage())) {
            this.updateFormatter();
        }
        if (modeChanged && (oldMode.mode === 3 /* PriceScaleMode.IndexedTo100 */ || this.isIndexedTo100())) {
            this.updateFormatter();
        }
        if (newMode.isInverted !== undefined && oldMode.isInverted !== newMode.isInverted) {
            this._options.invertScale = newMode.isInverted;
            this._onIsInvertedChanged();
        }
        this._modeChanged.fire(oldMode, this.mode());
    }
    modeChanged() {
        return this._modeChanged;
    }
    fontSize() {
        return this._layoutOptions.fontSize;
    }
    height() {
        return this._height;
    }
    setHeight(value) {
        if (this._height === value) {
            return;
        }
        this._height = value;
        this._invalidateInternalHeightCache();
        this._marksCache = null;
    }
    internalHeight() {
        if (this._internalHeightCache) {
            return this._internalHeightCache;
        }
        const res = this.height() - this._topMarginPx() - this._bottomMarginPx();
        this._internalHeightCache = res;
        return res;
    }
    priceRange() {
        this._makeSureItIsValid();
        return this._priceRange;
    }
    setPriceRange(newPriceRange, isForceSetValue) {
        const oldPriceRange = this._priceRange;
        if (!isForceSetValue &&
            !(oldPriceRange === null && newPriceRange !== null) &&
            (oldPriceRange === null || oldPriceRange.equals(newPriceRange))) {
            return;
        }
        this._marksCache = null;
        this._priceRange = newPriceRange;
    }
    isEmpty() {
        this._makeSureItIsValid();
        return this._height === 0 || !this._priceRange || this._priceRange.isEmpty();
    }
    invertedCoordinate(coordinate) {
        return this.isInverted() ? coordinate : this.height() - 1 - coordinate;
    }
    priceToCoordinate(price, baseValue) {
        if (this.isPercentage()) {
            price = toPercent(price, baseValue);
        }
        else if (this.isIndexedTo100()) {
            price = toIndexedTo100(price, baseValue);
        }
        return this._logicalToCoordinate(price, baseValue);
    }
    pointsArrayToCoordinates(points, baseValue, visibleRange) {
        this._makeSureItIsValid();
        const bh = this._bottomMarginPx();
        const range = ensureNotNull(this.priceRange());
        const min = range.minValue();
        const max = range.maxValue();
        const ih = (this.internalHeight() - 1);
        const isInverted = this.isInverted();
        const hmm = ih / (max - min);
        const fromIndex = (visibleRange === undefined) ? 0 : visibleRange.from;
        const toIndex = (visibleRange === undefined) ? points.length : visibleRange.to;
        const transformFn = this._getCoordinateTransformer();
        for (let i = fromIndex; i < toIndex; i++) {
            const point = points[i];
            const price = point.price;
            if (isNaN(price)) {
                continue;
            }
            let logical = price;
            if (transformFn !== null) {
                logical = transformFn(point.price, baseValue);
            }
            const invCoordinate = bh + hmm * (logical - min);
            const coordinate = isInverted ? invCoordinate : this._height - 1 - invCoordinate;
            point.y = coordinate;
        }
    }
    barPricesToCoordinates(pricesList, baseValue, visibleRange) {
        this._makeSureItIsValid();
        const bh = this._bottomMarginPx();
        const range = ensureNotNull(this.priceRange());
        const min = range.minValue();
        const max = range.maxValue();
        const ih = (this.internalHeight() - 1);
        const isInverted = this.isInverted();
        const hmm = ih / (max - min);
        const fromIndex = (visibleRange === undefined) ? 0 : visibleRange.from;
        const toIndex = (visibleRange === undefined) ? pricesList.length : visibleRange.to;
        const transformFn = this._getCoordinateTransformer();
        for (let i = fromIndex; i < toIndex; i++) {
            const bar = pricesList[i];
            let openLogical = bar.open;
            let highLogical = bar.high;
            let lowLogical = bar.low;
            let closeLogical = bar.close;
            if (transformFn !== null) {
                openLogical = transformFn(bar.open, baseValue);
                highLogical = transformFn(bar.high, baseValue);
                lowLogical = transformFn(bar.low, baseValue);
                closeLogical = transformFn(bar.close, baseValue);
            }
            let invCoordinate = bh + hmm * (openLogical - min);
            let coordinate = isInverted ? invCoordinate : this._height - 1 - invCoordinate;
            bar.openY = coordinate;
            invCoordinate = bh + hmm * (highLogical - min);
            coordinate = isInverted ? invCoordinate : this._height - 1 - invCoordinate;
            bar.highY = coordinate;
            invCoordinate = bh + hmm * (lowLogical - min);
            coordinate = isInverted ? invCoordinate : this._height - 1 - invCoordinate;
            bar.lowY = coordinate;
            invCoordinate = bh + hmm * (closeLogical - min);
            coordinate = isInverted ? invCoordinate : this._height - 1 - invCoordinate;
            bar.closeY = coordinate;
        }
    }
    coordinateToPrice(coordinate, baseValue) {
        const logical = this._coordinateToLogical(coordinate, baseValue);
        return this.logicalToPrice(logical, baseValue);
    }
    logicalToPrice(logical, baseValue) {
        let value = logical;
        if (this.isPercentage()) {
            value = fromPercent(value, baseValue);
        }
        else if (this.isIndexedTo100()) {
            value = fromIndexedTo100(value, baseValue);
        }
        return value;
    }
    dataSources() {
        return this._dataSources;
    }
    orderedSources() {
        if (this._cachedOrderedSources) {
            return this._cachedOrderedSources;
        }
        let sources = [];
        for (let i = 0; i < this._dataSources.length; i++) {
            const ds = this._dataSources[i];
            if (ds.zorder() === null) {
                ds.setZorder(i + 1);
            }
            sources.push(ds);
        }
        sources = sortSources(sources);
        this._cachedOrderedSources = sources;
        return this._cachedOrderedSources;
    }
    addDataSource(source) {
        if (this._dataSources.indexOf(source) !== -1) {
            return;
        }
        this._dataSources.push(source);
        this.updateFormatter();
        this.invalidateSourcesCache();
    }
    removeDataSource(source) {
        const index = this._dataSources.indexOf(source);
        if (index === -1) {
            throw new Error('source is not attached to scale');
        }
        this._dataSources.splice(index, 1);
        if (this._dataSources.length === 0) {
            this.setMode({
                autoScale: true,
            });
            // if no sources on price scale let's clear price range cache as well as enabling auto scale
            this.setPriceRange(null);
        }
        this.updateFormatter();
        this.invalidateSourcesCache();
    }
    firstValue() {
        // TODO: cache the result
        let result = null;
        for (const source of this._dataSources) {
            const firstValue = source.firstValue();
            if (firstValue === null) {
                continue;
            }
            if (result === null || firstValue.timePoint < result.timePoint) {
                result = firstValue;
            }
        }
        return result === null ? null : result.value;
    }
    isInverted() {
        return this._options.invertScale;
    }
    marks() {
        const firstValueIsNull = this.firstValue() === null;
        // do not recalculate marks if firstValueIsNull is true because in this case we'll always get empty result
        // this could happen in case when a series had some data and then you set empty data to it (in a simplified case)
        // we could display an empty price scale, but this is not good from UX
        // so in this case we need to keep an previous marks to display them on the scale
        // as one of possible examples for this situation could be the following:
        // let's say you have a study/indicator attached to a price scale and then you decide to stop it, i.e. remove its data because of its visibility
        // a user will see the previous marks on the scale until you turn on your study back or remove it from the chart completely
        if (this._marksCache !== null && (firstValueIsNull || this._marksCache.firstValueIsNull === firstValueIsNull)) {
            return this._marksCache.marks;
        }
        this._markBuilder.rebuildTickMarks();
        const marks = this._markBuilder.marks();
        this._marksCache = { marks, firstValueIsNull };
        this._onMarksChanged.fire();
        return marks;
    }
    onMarksChanged() {
        return this._onMarksChanged;
    }
    startScale(x) {
        if (this.isPercentage() || this.isIndexedTo100()) {
            return;
        }
        if (this._scaleStartPoint !== null || this._priceRangeSnapshot !== null) {
            return;
        }
        if (this.isEmpty()) {
            return;
        }
        // invert x
        this._scaleStartPoint = this._height - x;
        this._priceRangeSnapshot = ensureNotNull(this.priceRange()).clone();
    }
    scaleTo(x) {
        if (this.isPercentage() || this.isIndexedTo100()) {
            return;
        }
        if (this._scaleStartPoint === null) {
            return;
        }
        this.setMode({
            autoScale: false,
        });
        // invert x
        x = this._height - x;
        if (x < 0) {
            x = 0;
        }
        let scaleCoeff = (this._scaleStartPoint + (this._height - 1) * 0.2) / (x + (this._height - 1) * 0.2);
        const newPriceRange = ensureNotNull(this._priceRangeSnapshot).clone();
        scaleCoeff = Math.max(scaleCoeff, 0.1);
        newPriceRange.scaleAroundCenter(scaleCoeff);
        this.setPriceRange(newPriceRange);
    }
    endScale() {
        if (this.isPercentage() || this.isIndexedTo100()) {
            return;
        }
        this._scaleStartPoint = null;
        this._priceRangeSnapshot = null;
    }
    startScroll(x) {
        if (this.isAutoScale()) {
            return;
        }
        if (this._scrollStartPoint !== null || this._priceRangeSnapshot !== null) {
            return;
        }
        if (this.isEmpty()) {
            return;
        }
        this._scrollStartPoint = x;
        this._priceRangeSnapshot = ensureNotNull(this.priceRange()).clone();
    }
    scrollTo(x) {
        if (this.isAutoScale()) {
            return;
        }
        if (this._scrollStartPoint === null) {
            return;
        }
        const priceUnitsPerPixel = ensureNotNull(this.priceRange()).length() / (this.internalHeight() - 1);
        let pixelDelta = x - this._scrollStartPoint;
        if (this.isInverted()) {
            pixelDelta *= -1;
        }
        const priceDelta = pixelDelta * priceUnitsPerPixel;
        const newPriceRange = ensureNotNull(this._priceRangeSnapshot).clone();
        newPriceRange.shift(priceDelta);
        this.setPriceRange(newPriceRange, true);
        this._marksCache = null;
    }
    endScroll() {
        if (this.isAutoScale()) {
            return;
        }
        if (this._scrollStartPoint === null) {
            return;
        }
        this._scrollStartPoint = null;
        this._priceRangeSnapshot = null;
    }
    formatter() {
        if (!this._formatter) {
            this.updateFormatter();
        }
        return this._formatter;
    }
    formatPrice(price, firstValue) {
        switch (this._options.mode) {
            case 2 /* PriceScaleMode.Percentage */:
                return this._formatPercentage(toPercent(price, firstValue));
            case 3 /* PriceScaleMode.IndexedTo100 */:
                return this.formatter().format(toIndexedTo100(price, firstValue));
            default:
                return this._formatPrice(price);
        }
    }
    formatLogical(logical) {
        switch (this._options.mode) {
            case 2 /* PriceScaleMode.Percentage */:
                return this._formatPercentage(logical);
            case 3 /* PriceScaleMode.IndexedTo100 */:
                return this.formatter().format(logical);
            default:
                return this._formatPrice(logical);
        }
    }
    formatPriceAbsolute(price) {
        return this._formatPrice(price, ensureNotNull(this._formatterSource()).formatter());
    }
    formatPricePercentage(price, baseValue) {
        price = toPercent(price, baseValue);
        return this._formatPercentage(price, percentageFormatter);
    }
    sourcesForAutoScale() {
        return this._dataSources;
    }
    recalculatePriceRange(visibleBars) {
        this._invalidatedForRange = {
            visibleBars: visibleBars,
            isValid: false,
        };
    }
    updateAllViews() {
        this._dataSources.forEach((s) => s.updateAllViews());
    }
    updateFormatter() {
        this._marksCache = null;
        const formatterSource = this._formatterSource();
        let base = 100;
        if (formatterSource !== null) {
            base = Math.round(1 / formatterSource.minMove());
        }
        this._formatter = defaultPriceFormatter;
        if (this.isPercentage()) {
            this._formatter = percentageFormatter;
            base = 100;
        }
        else if (this.isIndexedTo100()) {
            this._formatter = new PriceFormatter(100, 1);
            base = 100;
        }
        else {
            if (formatterSource !== null) {
                // user
                this._formatter = formatterSource.formatter();
            }
        }
        this._markBuilder = new PriceTickMarkBuilder(this, base, this._coordinateToLogical.bind(this), this._logicalToCoordinate.bind(this));
        this._markBuilder.rebuildTickMarks();
    }
    invalidateSourcesCache() {
        this._cachedOrderedSources = null;
    }
    /**
     * @returns The {@link IPriceDataSource} that will be used as the "formatter source" (take minMove for formatter).
     */
    _formatterSource() {
        return this._dataSources[0] || null;
    }
    _topMarginPx() {
        return this.isInverted()
            ? this._options.scaleMargins.bottom * this.height() + this._marginBelow
            : this._options.scaleMargins.top * this.height() + this._marginAbove;
    }
    _bottomMarginPx() {
        return this.isInverted()
            ? this._options.scaleMargins.top * this.height() + this._marginAbove
            : this._options.scaleMargins.bottom * this.height() + this._marginBelow;
    }
    _makeSureItIsValid() {
        if (!this._invalidatedForRange.isValid) {
            this._invalidatedForRange.isValid = true;
            this._recalculatePriceRangeImpl();
        }
    }
    _invalidateInternalHeightCache() {
        this._internalHeightCache = null;
    }
    _logicalToCoordinate(logical, baseValue) {
        this._makeSureItIsValid();
        if (this.isEmpty()) {
            return 0;
        }
        logical = this.isLog() && logical ? toLog(logical, this._logFormula) : logical;
        const range = ensureNotNull(this.priceRange());
        const invCoordinate = this._bottomMarginPx() +
            (this.internalHeight() - 1) * (logical - range.minValue()) / range.length();
        const coordinate = this.invertedCoordinate(invCoordinate);
        return coordinate;
    }
    _coordinateToLogical(coordinate, baseValue) {
        this._makeSureItIsValid();
        if (this.isEmpty()) {
            return 0;
        }
        const invCoordinate = this.invertedCoordinate(coordinate);
        const range = ensureNotNull(this.priceRange());
        const logical = range.minValue() + range.length() *
            ((invCoordinate - this._bottomMarginPx()) / (this.internalHeight() - 1));
        return this.isLog() ? fromLog(logical, this._logFormula) : logical;
    }
    _onIsInvertedChanged() {
        this._marksCache = null;
        this._markBuilder.rebuildTickMarks();
    }
    // eslint-disable-next-line complexity
    _recalculatePriceRangeImpl() {
        const visibleBars = this._invalidatedForRange.visibleBars;
        if (visibleBars === null) {
            return;
        }
        let priceRange = null;
        const sources = this.sourcesForAutoScale();
        let marginAbove = 0;
        let marginBelow = 0;
        for (const source of sources) {
            if (!source.visible()) {
                continue;
            }
            const firstValue = source.firstValue();
            if (firstValue === null) {
                continue;
            }
            const autoScaleInfo = source.autoscaleInfo(visibleBars.left(), visibleBars.right());
            let sourceRange = autoScaleInfo && autoScaleInfo.priceRange();
            if (sourceRange !== null) {
                switch (this._options.mode) {
                    case 1 /* PriceScaleMode.Logarithmic */:
                        sourceRange = convertPriceRangeToLog(sourceRange, this._logFormula);
                        break;
                    case 2 /* PriceScaleMode.Percentage */:
                        sourceRange = toPercentRange(sourceRange, firstValue.value);
                        break;
                    case 3 /* PriceScaleMode.IndexedTo100 */:
                        sourceRange = toIndexedTo100Range(sourceRange, firstValue.value);
                        break;
                }
                if (priceRange === null) {
                    priceRange = sourceRange;
                }
                else {
                    priceRange = priceRange.merge(ensureNotNull(sourceRange));
                }
                if (autoScaleInfo !== null) {
                    const margins = autoScaleInfo.margins();
                    if (margins !== null) {
                        marginAbove = Math.max(marginAbove, margins.above);
                        marginBelow = Math.max(marginBelow, margins.below);
                    }
                }
            }
        }
        if (marginAbove !== this._marginAbove || marginBelow !== this._marginBelow) {
            this._marginAbove = marginAbove;
            this._marginBelow = marginBelow;
            this._marksCache = null;
            this._invalidateInternalHeightCache();
        }
        if (priceRange !== null) {
            // keep current range is new is empty
            if (priceRange.minValue() === priceRange.maxValue()) {
                const formatterSource = this._formatterSource();
                const minMove = formatterSource === null || this.isPercentage() || this.isIndexedTo100() ? 1 : formatterSource.minMove();
                // if price range is degenerated to 1 point let's extend it by 10 min move values
                // to avoid incorrect range and empty (blank) scale (in case of min tick much greater than 1)
                const extendValue = 5 * minMove;
                if (this.isLog()) {
                    priceRange = convertPriceRangeFromLog(priceRange, this._logFormula);
                }
                priceRange = new PriceRangeImpl(priceRange.minValue() - extendValue, priceRange.maxValue() + extendValue);
                if (this.isLog()) {
                    priceRange = convertPriceRangeToLog(priceRange, this._logFormula);
                }
            }
            if (this.isLog()) {
                const rawRange = convertPriceRangeFromLog(priceRange, this._logFormula);
                const newLogFormula = logFormulaForPriceRange(rawRange);
                if (!logFormulasAreSame(newLogFormula, this._logFormula)) {
                    const rawSnapshot = this._priceRangeSnapshot !== null ? convertPriceRangeFromLog(this._priceRangeSnapshot, this._logFormula) : null;
                    this._logFormula = newLogFormula;
                    priceRange = convertPriceRangeToLog(rawRange, newLogFormula);
                    if (rawSnapshot !== null) {
                        this._priceRangeSnapshot = convertPriceRangeToLog(rawSnapshot, newLogFormula);
                    }
                }
            }
            this.setPriceRange(priceRange);
        }
        else {
            // reset empty to default
            if (this._priceRange === null) {
                this.setPriceRange(new PriceRangeImpl(-0.5, 0.5));
                this._logFormula = logFormulaForPriceRange(null);
            }
        }
        this._invalidatedForRange.isValid = true;
    }
    _getCoordinateTransformer() {
        if (this.isPercentage()) {
            return toPercent;
        }
        else if (this.isIndexedTo100()) {
            return toIndexedTo100;
        }
        else if (this.isLog()) {
            return (price) => toLog(price, this._logFormula);
        }
        return null;
    }
    _formatValue(value, formatter, fallbackFormatter) {
        if (formatter === undefined) {
            if (fallbackFormatter === undefined) {
                fallbackFormatter = this.formatter();
            }
            return fallbackFormatter.format(value);
        }
        return formatter(value);
    }
    _formatPrice(price, fallbackFormatter) {
        return this._formatValue(price, this._localizationOptions.priceFormatter, fallbackFormatter);
    }
    _formatPercentage(percentage, fallbackFormatter) {
        return this._formatValue(percentage, this._localizationOptions.percentageFormatter, fallbackFormatter);
    }
}
