"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pane = exports.DEFAULT_STRETCH_FACTOR = void 0;
const assertions_1 = require("../helpers/assertions");
const delegate_1 = require("../helpers/delegate");
const strict_type_checks_1 = require("../helpers/strict-type-checks");
const default_price_scale_1 = require("./default-price-scale");
const grid_1 = require("./grid");
const price_scale_1 = require("./price-scale");
const sort_sources_1 = require("./sort-sources");
exports.DEFAULT_STRETCH_FACTOR = 1000;
class Pane {
    constructor(timeScale, model) {
        this._dataSources = [];
        this._overlaySourcesByScaleId = new Map();
        this._height = 0;
        this._width = 0;
        this._stretchFactor = exports.DEFAULT_STRETCH_FACTOR;
        this._cachedOrderedSources = null;
        this._destroyed = new delegate_1.Delegate();
        this._timeScale = timeScale;
        this._model = model;
        this._grid = new grid_1.Grid(this);
        const options = model.options();
        this._leftPriceScale = this._createPriceScale("left" /* DefaultPriceScaleId.Left */, options.leftPriceScale);
        this._rightPriceScale = this._createPriceScale("right" /* DefaultPriceScaleId.Right */, options.rightPriceScale);
        this._leftPriceScale.modeChanged().subscribe(this._onPriceScaleModeChanged.bind(this, this._leftPriceScale), this);
        this._rightPriceScale.modeChanged().subscribe(this._onPriceScaleModeChanged.bind(this, this._rightPriceScale), this);
        this.applyScaleOptions(options);
    }
    applyScaleOptions(options) {
        if (options.leftPriceScale) {
            this._leftPriceScale.applyOptions(options.leftPriceScale);
        }
        if (options.rightPriceScale) {
            this._rightPriceScale.applyOptions(options.rightPriceScale);
        }
        if (options.localization) {
            this._leftPriceScale.updateFormatter();
            this._rightPriceScale.updateFormatter();
        }
        if (options.overlayPriceScales) {
            const sourceArrays = Array.from(this._overlaySourcesByScaleId.values());
            for (const arr of sourceArrays) {
                const priceScale = (0, assertions_1.ensureNotNull)(arr[0].priceScale());
                priceScale.applyOptions(options.overlayPriceScales);
                if (options.localization) {
                    priceScale.updateFormatter();
                }
            }
        }
    }
    priceScaleById(id) {
        switch (id) {
            case "left" /* DefaultPriceScaleId.Left */: {
                return this._leftPriceScale;
            }
            case "right" /* DefaultPriceScaleId.Right */: {
                return this._rightPriceScale;
            }
        }
        if (this._overlaySourcesByScaleId.has(id)) {
            return (0, assertions_1.ensureDefined)(this._overlaySourcesByScaleId.get(id))[0].priceScale();
        }
        return null;
    }
    destroy() {
        this.model().priceScalesOptionsChanged().unsubscribeAll(this);
        this._leftPriceScale.modeChanged().unsubscribeAll(this);
        this._rightPriceScale.modeChanged().unsubscribeAll(this);
        this._dataSources.forEach((source) => {
            if (source.destroy) {
                source.destroy();
            }
        });
        this._destroyed.fire();
    }
    stretchFactor() {
        return this._stretchFactor;
    }
    setStretchFactor(factor) {
        this._stretchFactor = factor;
    }
    model() {
        return this._model;
    }
    width() {
        return this._width;
    }
    height() {
        return this._height;
    }
    setWidth(width) {
        this._width = width;
        this.updateAllSources();
    }
    setHeight(height) {
        this._height = height;
        this._leftPriceScale.setHeight(height);
        this._rightPriceScale.setHeight(height);
        // process overlays
        this._dataSources.forEach((ds) => {
            if (this.isOverlay(ds)) {
                const priceScale = ds.priceScale();
                if (priceScale !== null) {
                    priceScale.setHeight(height);
                }
            }
        });
        this.updateAllSources();
    }
    dataSources() {
        return this._dataSources;
    }
    isOverlay(source) {
        const priceScale = source.priceScale();
        if (priceScale === null) {
            return true;
        }
        return this._leftPriceScale !== priceScale && this._rightPriceScale !== priceScale;
    }
    addDataSource(source, targetScaleId, zOrder) {
        const targetZOrder = (zOrder !== undefined) ? zOrder : this._getZOrderMinMax().maxZOrder + 1;
        this._insertDataSource(source, targetScaleId, targetZOrder);
    }
    removeDataSource(source) {
        const index = this._dataSources.indexOf(source);
        (0, assertions_1.assert)(index !== -1, 'removeDataSource: invalid data source');
        this._dataSources.splice(index, 1);
        const priceScaleId = (0, assertions_1.ensureNotNull)(source.priceScale()).id();
        if (this._overlaySourcesByScaleId.has(priceScaleId)) {
            const overlaySources = (0, assertions_1.ensureDefined)(this._overlaySourcesByScaleId.get(priceScaleId));
            const overlayIndex = overlaySources.indexOf(source);
            if (overlayIndex !== -1) {
                overlaySources.splice(overlayIndex, 1);
                if (overlaySources.length === 0) {
                    this._overlaySourcesByScaleId.delete(priceScaleId);
                }
            }
        }
        const priceScale = source.priceScale();
        // if source has owner, it returns owner's price scale
        // and it does not have source in their list
        if (priceScale && priceScale.dataSources().indexOf(source) >= 0) {
            priceScale.removeDataSource(source);
        }
        if (priceScale !== null) {
            priceScale.invalidateSourcesCache();
            this.recalculatePriceScale(priceScale);
        }
        this._cachedOrderedSources = null;
    }
    priceScalePosition(priceScale) {
        if (priceScale === this._leftPriceScale) {
            return 'left';
        }
        if (priceScale === this._rightPriceScale) {
            return 'right';
        }
        return 'overlay';
    }
    leftPriceScale() {
        return this._leftPriceScale;
    }
    rightPriceScale() {
        return this._rightPriceScale;
    }
    startScalePrice(priceScale, x) {
        priceScale.startScale(x);
    }
    scalePriceTo(priceScale, x) {
        priceScale.scaleTo(x);
        // TODO: be more smart and update only affected views
        this.updateAllSources();
    }
    endScalePrice(priceScale) {
        priceScale.endScale();
    }
    startScrollPrice(priceScale, x) {
        priceScale.startScroll(x);
    }
    scrollPriceTo(priceScale, x) {
        priceScale.scrollTo(x);
        this.updateAllSources();
    }
    endScrollPrice(priceScale) {
        priceScale.endScroll();
    }
    updateAllSources() {
        this._dataSources.forEach((source) => {
            source.updateAllViews();
        });
    }
    defaultPriceScale() {
        let priceScale = null;
        if (this._model.options().rightPriceScale.visible && this._rightPriceScale.dataSources().length !== 0) {
            priceScale = this._rightPriceScale;
        }
        else if (this._model.options().leftPriceScale.visible && this._leftPriceScale.dataSources().length !== 0) {
            priceScale = this._leftPriceScale;
        }
        else if (this._dataSources.length !== 0) {
            priceScale = this._dataSources[0].priceScale();
        }
        if (priceScale === null) {
            priceScale = this._rightPriceScale;
        }
        return priceScale;
    }
    defaultVisiblePriceScale() {
        let priceScale = null;
        if (this._model.options().rightPriceScale.visible) {
            priceScale = this._rightPriceScale;
        }
        else if (this._model.options().leftPriceScale.visible) {
            priceScale = this._leftPriceScale;
        }
        return priceScale;
    }
    recalculatePriceScale(priceScale) {
        if (priceScale === null || !priceScale.isAutoScale()) {
            return;
        }
        this._recalculatePriceScaleImpl(priceScale);
    }
    resetPriceScale(priceScale) {
        const visibleBars = this._timeScale.visibleStrictRange();
        priceScale.setMode({ autoScale: true });
        if (visibleBars !== null) {
            priceScale.recalculatePriceRange(visibleBars);
        }
        this.updateAllSources();
    }
    momentaryAutoScale() {
        this._recalculatePriceScaleImpl(this._leftPriceScale);
        this._recalculatePriceScaleImpl(this._rightPriceScale);
    }
    recalculate() {
        this.recalculatePriceScale(this._leftPriceScale);
        this.recalculatePriceScale(this._rightPriceScale);
        this._dataSources.forEach((ds) => {
            if (this.isOverlay(ds)) {
                this.recalculatePriceScale(ds.priceScale());
            }
        });
        this.updateAllSources();
        this._model.lightUpdate();
    }
    orderedSources() {
        if (this._cachedOrderedSources === null) {
            this._cachedOrderedSources = (0, sort_sources_1.sortSources)(this._dataSources);
        }
        return this._cachedOrderedSources;
    }
    onDestroyed() {
        return this._destroyed;
    }
    grid() {
        return this._grid;
    }
    _recalculatePriceScaleImpl(priceScale) {
        // TODO: can use this checks
        const sourceForAutoScale = priceScale.sourcesForAutoScale();
        if (sourceForAutoScale && sourceForAutoScale.length > 0 && !this._timeScale.isEmpty()) {
            const visibleBars = this._timeScale.visibleStrictRange();
            if (visibleBars !== null) {
                priceScale.recalculatePriceRange(visibleBars);
            }
        }
        priceScale.updateAllViews();
    }
    _getZOrderMinMax() {
        const sources = this.orderedSources();
        if (sources.length === 0) {
            return { minZOrder: 0, maxZOrder: 0 };
        }
        let minZOrder = 0;
        let maxZOrder = 0;
        for (let j = 0; j < sources.length; j++) {
            const ds = sources[j];
            const zOrder = ds.zorder();
            if (zOrder !== null) {
                if (zOrder < minZOrder) {
                    minZOrder = zOrder;
                }
                if (zOrder > maxZOrder) {
                    maxZOrder = zOrder;
                }
            }
        }
        return { minZOrder: minZOrder, maxZOrder: maxZOrder };
    }
    _insertDataSource(source, priceScaleId, zOrder) {
        let priceScale = this.priceScaleById(priceScaleId);
        if (priceScale === null) {
            priceScale = this._createPriceScale(priceScaleId, this._model.options().overlayPriceScales);
        }
        this._dataSources.push(source);
        if (!(0, default_price_scale_1.isDefaultPriceScale)(priceScaleId)) {
            const overlaySources = this._overlaySourcesByScaleId.get(priceScaleId) || [];
            overlaySources.push(source);
            this._overlaySourcesByScaleId.set(priceScaleId, overlaySources);
        }
        priceScale.addDataSource(source);
        source.setPriceScale(priceScale);
        source.setZorder(zOrder);
        this.recalculatePriceScale(priceScale);
        this._cachedOrderedSources = null;
    }
    _onPriceScaleModeChanged(priceScale, oldMode, newMode) {
        if (oldMode.mode === newMode.mode) {
            return;
        }
        // momentary auto scale if we toggle percentage/indexedTo100 mode
        this._recalculatePriceScaleImpl(priceScale);
    }
    _createPriceScale(id, options) {
        const actualOptions = Object.assign({ visible: true, autoScale: true }, (0, strict_type_checks_1.clone)(options));
        const priceScale = new price_scale_1.PriceScale(id, actualOptions, this._model.options().layout, this._model.options().localization);
        priceScale.setHeight(this.height());
        return priceScale;
    }
}
exports.Pane = Pane;
