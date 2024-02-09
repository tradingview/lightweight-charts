"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDefaultPriceScale = exports.DefaultPriceScaleId = void 0;
var DefaultPriceScaleId;
(function (DefaultPriceScaleId) {
    DefaultPriceScaleId["Left"] = "left";
    DefaultPriceScaleId["Right"] = "right";
})(DefaultPriceScaleId = exports.DefaultPriceScaleId || (exports.DefaultPriceScaleId = {}));
function isDefaultPriceScale(priceScaleId) {
    return priceScaleId === "left" /* DefaultPriceScaleId.Left */ || priceScaleId === "right" /* DefaultPriceScaleId.Right */;
}
exports.isDefaultPriceScale = isDefaultPriceScale;
