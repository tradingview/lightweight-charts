"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoscaleInfoImpl = void 0;
const price_range_impl_1 = require("./price-range-impl");
class AutoscaleInfoImpl {
    constructor(priceRange, margins) {
        this._priceRange = priceRange;
        this._margins = margins || null;
    }
    priceRange() {
        return this._priceRange;
    }
    margins() {
        return this._margins;
    }
    toRaw() {
        if (this._priceRange === null) {
            return null;
        }
        return {
            priceRange: this._priceRange.toRaw(),
            margins: this._margins || undefined,
        };
    }
    static fromRaw(raw) {
        return (raw === null) ? null : new AutoscaleInfoImpl(price_range_impl_1.PriceRangeImpl.fromRaw(raw.priceRange), raw.margins);
    }
}
exports.AutoscaleInfoImpl = AutoscaleInfoImpl;
