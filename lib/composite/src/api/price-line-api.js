"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceLine = void 0;
class PriceLine {
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
exports.PriceLine = PriceLine;
