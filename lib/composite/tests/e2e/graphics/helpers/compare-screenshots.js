"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareScreenshots = void 0;
const tslib_1 = require("tslib");
const pixelmatch_1 = tslib_1.__importDefault(require("pixelmatch"));
const pngjs_1 = require("pngjs");
function compareScreenshots(leftImg, rightImg) {
    if (leftImg.width !== rightImg.width) {
        throw new Error('image widths should be the same');
    }
    if (leftImg.height !== rightImg.height) {
        throw new Error('image widths should be the same');
    }
    const diffImg = new pngjs_1.PNG({
        width: leftImg.width,
        height: rightImg.height,
    });
    const diffPixelsCount = (0, pixelmatch_1.default)(leftImg.data, rightImg.data, diffImg.data, leftImg.width, leftImg.height, { threshold: 0.1 });
    return { diffPixelsCount, diffImg };
}
exports.compareScreenshots = compareScreenshots;
