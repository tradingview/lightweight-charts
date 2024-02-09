"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doMouseScrolls = exports.doMouseScroll = exports.centerMouseOnElement = void 0;
const tslib_1 = require("tslib");
function centerMouseOnElement(page, element) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const boundingBox = yield element.boundingBox();
        if (!boundingBox) {
            throw new Error('Unable to get boundingBox for element.');
        }
        // move mouse to center of element
        yield page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
    });
}
exports.centerMouseOnElement = centerMouseOnElement;
function doMouseScroll(deltas, page) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield page.mouse.wheel({ deltaX: deltas.x || 0, deltaY: deltas.y || 0 });
    });
}
exports.doMouseScroll = doMouseScroll;
function doMouseScrolls(page, element) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield centerMouseOnElement(page, element);
        yield doMouseScroll({ x: 10.0 }, page);
        yield doMouseScroll({ y: 10.0 }, page);
        yield doMouseScroll({ x: -10.0 }, page);
        yield doMouseScroll({ y: -10.0 }, page);
        yield doMouseScroll({ x: 10.0, y: 10.0 }, page);
        yield doMouseScroll({ x: -10.0, y: -10.0 }, page);
    });
}
exports.doMouseScrolls = doMouseScrolls;
