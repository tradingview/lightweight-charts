"use strict";
/// <reference types="_build-time-constants" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.warn = void 0;
function warn(msg) {
    if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn(msg);
    }
}
exports.warn = warn;
