export class PriceLine {
    constructor(priceLine) {
        this._priceLine = priceLine;
    }
    applyOptions(options) {
        this._priceLine.applyOptions(options);
    }
    options() {
        return this._priceLine.options();
    }
    priceLine() {
        return this._priceLine;
    }
}
