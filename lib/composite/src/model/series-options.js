"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceLineSource = exports.PriceAxisLastValueMode = exports.precisionByMinMove = exports.LastPriceAnimationMode = exports.fillUpDownCandlesticksColors = void 0;
function fillUpDownCandlesticksColors(options) {
    if (options.borderColor !== undefined) {
        options.borderUpColor = options.borderColor;
        options.borderDownColor = options.borderColor;
    }
    if (options.wickColor !== undefined) {
        options.wickUpColor = options.wickColor;
        options.wickDownColor = options.wickColor;
    }
}
exports.fillUpDownCandlesticksColors = fillUpDownCandlesticksColors;
/**
 * Represents the type of the last price animation for series such as area or line.
 */
var LastPriceAnimationMode;
(function (LastPriceAnimationMode) {
    /**
     * Animation is always disabled
     */
    LastPriceAnimationMode[LastPriceAnimationMode["Disabled"] = 0] = "Disabled";
    /**
     * Animation is always enabled.
     */
    LastPriceAnimationMode[LastPriceAnimationMode["Continuous"] = 1] = "Continuous";
    /**
     * Animation is active after new data.
     */
    LastPriceAnimationMode[LastPriceAnimationMode["OnDataUpdate"] = 2] = "OnDataUpdate";
})(LastPriceAnimationMode = exports.LastPriceAnimationMode || (exports.LastPriceAnimationMode = {}));
function precisionByMinMove(minMove) {
    if (minMove >= 1) {
        return 0;
    }
    let i = 0;
    for (; i < 8; i++) {
        const intPart = Math.round(minMove);
        const fractPart = Math.abs(intPart - minMove);
        if (fractPart < 1e-8) {
            return i;
        }
        minMove = minMove * 10;
    }
    return i;
}
exports.precisionByMinMove = precisionByMinMove;
var PriceAxisLastValueMode;
(function (PriceAxisLastValueMode) {
    PriceAxisLastValueMode[PriceAxisLastValueMode["LastPriceAndPercentageValue"] = 0] = "LastPriceAndPercentageValue";
    PriceAxisLastValueMode[PriceAxisLastValueMode["LastValueAccordingToScale"] = 1] = "LastValueAccordingToScale";
})(PriceAxisLastValueMode = exports.PriceAxisLastValueMode || (exports.PriceAxisLastValueMode = {}));
/**
 * Represents the source of data to be used for the horizontal price line.
 */
var PriceLineSource;
(function (PriceLineSource) {
    /**
     * Use the last bar data.
     */
    PriceLineSource[PriceLineSource["LastBar"] = 0] = "LastBar";
    /**
     * Use the last visible data of the chart viewport.
     */
    PriceLineSource[PriceLineSource["LastVisible"] = 1] = "LastVisible";
})(PriceLineSource = exports.PriceLineSource || (exports.PriceLineSource = {}));
