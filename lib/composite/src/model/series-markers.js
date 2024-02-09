"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertSeriesMarker = void 0;
const tslib_1 = require("tslib");
function convertSeriesMarker(sm, newTime, originalTime) {
    const { time: inTime, originalTime: inOriginalTime } = sm, values = tslib_1.__rest(sm, ["time", "originalTime"]);
    /* eslint-disable @typescript-eslint/consistent-type-assertions */
    const res = Object.assign({ time: newTime }, values);
    /* eslint-enable @typescript-eslint/consistent-type-assertions */
    if (originalTime !== undefined) {
        res.originalTime = originalTime;
    }
    return res;
}
exports.convertSeriesMarker = convertSeriesMarker;
