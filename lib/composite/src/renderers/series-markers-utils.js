"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shapeMargin = exports.calculateShapeHeight = exports.shapeSize = void 0;
const mathex_1 = require("../helpers/mathex");
var Constants;
(function (Constants) {
    Constants[Constants["MinShapeSize"] = 12] = "MinShapeSize";
    Constants[Constants["MaxShapeSize"] = 30] = "MaxShapeSize";
    Constants[Constants["MinShapeMargin"] = 3] = "MinShapeMargin";
})(Constants || (Constants = {}));
function size(barSpacing, coeff) {
    const result = Math.min(Math.max(barSpacing, 12 /* Constants.MinShapeSize */), 30 /* Constants.MaxShapeSize */) * coeff;
    return (0, mathex_1.ceiledOdd)(result);
}
function shapeSize(shape, originalSize) {
    switch (shape) {
        case 'arrowDown':
        case 'arrowUp':
            return size(originalSize, 1);
        case 'circle':
            return size(originalSize, 0.8);
        case 'square':
            return size(originalSize, 0.7);
    }
}
exports.shapeSize = shapeSize;
function calculateShapeHeight(barSpacing) {
    return (0, mathex_1.ceiledEven)(size(barSpacing, 1));
}
exports.calculateShapeHeight = calculateShapeHeight;
function shapeMargin(barSpacing) {
    return Math.max(size(barSpacing, 0.1), 3 /* Constants.MinShapeMargin */);
}
exports.shapeMargin = shapeMargin;
