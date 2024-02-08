export class PriceLine {
    constructor(priceLine) {
        this._private__priceLine = priceLine;
    }
    applyOptions(options) {
        this._private__priceLine._internal_applyOptions(options);
    }
    options() {
        return this._private__priceLine._internal_options();
    }
    _internal_priceLine() {
        return this._private__priceLine;
    }
}
