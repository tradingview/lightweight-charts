import { PriceRangeImpl } from './price-range-impl';
export class AutoscaleInfoImpl {
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
        return (raw === null) ? null : new AutoscaleInfoImpl(PriceRangeImpl.fromRaw(raw.priceRange), raw.margins);
    }
}
