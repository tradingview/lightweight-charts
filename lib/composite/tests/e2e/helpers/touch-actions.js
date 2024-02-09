"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doPinchZoomTouch = exports.doSwipeTouch = exports.doLongTouch = void 0;
const tslib_1 = require("tslib");
const page_timeout_1 = require("./page-timeout");
// Simulate a long touch action in a single position
function doLongTouch(page, element, duration) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const elBox = (yield element.boundingBox());
        const elCenterX = elBox.x + elBox.width / 2;
        const elCenterY = elBox.y + elBox.height / 2;
        const client = yield page.target().createCDPSession();
        yield client.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [
                { x: elCenterX, y: elCenterY },
            ],
        });
        yield (0, page_timeout_1.pageTimeout)(page, duration);
        return client.send('Input.dispatchTouchEvent', {
            type: 'touchEnd',
            touchPoints: [
                { x: elCenterX, y: elCenterY },
            ],
        });
    });
}
exports.doLongTouch = doLongTouch;
// Simulate a touch swipe gesture
function doSwipeTouch(devToolsSession, element, { horizontal = false, vertical = false, }) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const elBox = (yield element.boundingBox());
        const elCenterX = elBox.x + elBox.width / 2;
        const elCenterY = elBox.y + elBox.height / 2;
        const xStep = horizontal ? elBox.width / 8 : 0;
        const yStep = vertical ? elBox.height / 8 : 0;
        for (let i = 2; i > 0; i--) {
            const type = i === 2 ? 'touchStart' : 'touchMove';
            yield devToolsSession.send('Input.dispatchTouchEvent', {
                type,
                touchPoints: [{ x: elCenterX - i * xStep, y: elCenterY - i * yStep }],
            });
        }
        return devToolsSession.send('Input.dispatchTouchEvent', {
            type: 'touchEnd',
            touchPoints: [{ x: elCenterX - xStep, y: elCenterY - yStep }],
        });
    });
}
exports.doSwipeTouch = doSwipeTouch;
// Perform a pinch or zoom touch gesture within the specified element.
function doPinchZoomTouch(devToolsSession, element, zoom) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const elBox = (yield element.boundingBox());
        const sign = zoom ? -1 : 1;
        const elCenterX = elBox.x + elBox.width / 2;
        const elCenterY = elBox.y + elBox.height / 2;
        const xStep = (sign * elBox.width) / 8;
        const yStep = (sign * elBox.height) / 8;
        for (let i = 2; i > 0; i--) {
            const type = i === 2 ? 'touchStart' : 'touchMove';
            yield devToolsSession.send('Input.dispatchTouchEvent', {
                type,
                touchPoints: [
                    { x: elCenterX - i * xStep, y: elCenterY - i * yStep },
                    { x: elCenterX + i * xStep, y: elCenterY + i * xStep },
                ],
            });
        }
        return devToolsSession.send('Input.dispatchTouchEvent', {
            type: 'touchEnd',
            touchPoints: [
                { x: elCenterX - xStep, y: elCenterY - yStep },
                { x: elCenterX + xStep, y: elCenterY + xStep },
            ],
        });
    });
}
exports.doPinchZoomTouch = doPinchZoomTouch;
