/**
 * Checks an assertion. Throws if the assertion is failed.
 *
 * @param condition - Result of the assertion evaluation
 * @param message - Text to include in the exception message
 */
export function assert(condition, message) {
    if (!condition) {
        throw new Error('Assertion failed' + (message ? ': ' + message : ''));
    }
}
export function ensureDefined(value) {
    if (value === undefined) {
        throw new Error('Value is undefined');
    }
    return value;
}
export function ensureNotNull(value) {
    if (value === null) {
        throw new Error('Value is null');
    }
    return value;
}
export function ensure(value) {
    return ensureNotNull(ensureDefined(value));
}
/**
 * Compile time check for never
 */
export function ensureNever(value) { }
