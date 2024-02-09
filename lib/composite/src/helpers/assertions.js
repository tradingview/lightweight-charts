"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureNever = exports.ensure = exports.ensureNotNull = exports.ensureDefined = exports.assert = void 0;
/**
 * Checks an assertion. Throws if the assertion is failed.
 *
 * @param condition - Result of the assertion evaluation
 * @param message - Text to include in the exception message
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error('Assertion failed' + (message ? ': ' + message : ''));
    }
}
exports.assert = assert;
function ensureDefined(value) {
    if (value === undefined) {
        throw new Error('Value is undefined');
    }
    return value;
}
exports.ensureDefined = ensureDefined;
function ensureNotNull(value) {
    if (value === null) {
        throw new Error('Value is null');
    }
    return value;
}
exports.ensureNotNull = ensureNotNull;
function ensure(value) {
    return ensureNotNull(ensureDefined(value));
}
exports.ensure = ensure;
/**
 * Compile time check for never
 */
function ensureNever(value) { }
exports.ensureNever = ensureNever;
