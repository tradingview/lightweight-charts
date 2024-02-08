import { PriceRangeImpl } from './price-range-impl';
export class AutoscaleInfoImpl {
    constructor(priceRange, margins) {
        this._private__priceRange = priceRange;
        this._private__margins = margins || null;
    }
    _internal_priceRange() {
        return this._private__priceRange;
    }
    _internal_margins() {
        return this._private__margins;
    }
    _internal_toRaw() {
        if (this._private__priceRange === null) {
            return null;
        }
        return {
            priceRange: this._private__priceRange._internal_toRaw(),
            margins: this._private__margins || undefined,
        };
    }
    static _internal_fromRaw(raw) {
        return (raw === null) ? null : new AutoscaleInfoImpl(PriceRangeImpl._internal_fromRaw(raw.priceRange), raw.margins);
    }
}
