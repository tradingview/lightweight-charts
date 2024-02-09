"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFulfilledData = exports.isWhitespaceData = void 0;
function isWhitespaceData(data) {
    return data.open === undefined && data.value === undefined;
}
exports.isWhitespaceData = isWhitespaceData;
function isFulfilledData(data) {
    return (data.open !== undefined ||
        data.value !== undefined);
}
exports.isFulfilledData = isFulfilledData;
