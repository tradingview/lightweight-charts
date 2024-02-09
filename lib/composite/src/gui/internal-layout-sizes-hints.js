"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestPriceScaleWidth = exports.suggestTimeScaleHeight = exports.suggestChartSize = void 0;
const fancy_canvas_1 = require("fancy-canvas");
// on Hi-DPI CSS size * Device Pixel Ratio should be integer to avoid smoothing
// For chart widget we decrease the size because we must be inside container.
// For time axis this is not important, since it just affects space for pane widgets
function suggestChartSize(originalSize) {
    const integerWidth = Math.floor(originalSize.width);
    const integerHeight = Math.floor(originalSize.height);
    const width = integerWidth - (integerWidth % 2);
    const height = integerHeight - (integerHeight % 2);
    return (0, fancy_canvas_1.size)({ width, height });
}
exports.suggestChartSize = suggestChartSize;
function suggestTimeScaleHeight(originalHeight) {
    return originalHeight + (originalHeight % 2);
}
exports.suggestTimeScaleHeight = suggestTimeScaleHeight;
function suggestPriceScaleWidth(originalWidth) {
    return originalWidth + (originalWidth % 2);
}
exports.suggestPriceScaleWidth = suggestPriceScaleWidth;
