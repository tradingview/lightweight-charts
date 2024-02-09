"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PercentageFormatter = void 0;
const price_formatter_1 = require("./price-formatter");
class PercentageFormatter extends price_formatter_1.PriceFormatter {
    constructor(priceScale = 100) {
        super(priceScale);
    }
    format(price) {
        return `${super.format(price)}%`;
    }
}
exports.PercentageFormatter = PercentageFormatter;
