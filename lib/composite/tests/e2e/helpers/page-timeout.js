"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pageTimeout = void 0;
const tslib_1 = require("tslib");
// await a setTimeout delay evaluated within page context
function pageTimeout(page, delay) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return page.evaluate((ms) => new Promise((resolve) => setTimeout(resolve, ms)), delay);
    });
}
exports.pageTimeout = pageTimeout;
