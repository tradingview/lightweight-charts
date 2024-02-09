"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doZoomInZoomOut = void 0;
const tslib_1 = require("tslib");
function doZoomInZoomOut(page) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const prevViewport = page.viewport();
        yield page.setViewport(Object.assign(Object.assign({}, prevViewport), { deviceScaleFactor: 2 }));
        yield page.setViewport(prevViewport);
    });
}
exports.doZoomInZoomOut = doZoomInZoomOut;
