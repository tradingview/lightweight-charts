/**
 * Checks an assertion. Throws if the assertion is failed.
 *
 * @param condition - Result of the assertion evaluation
 * @param message - Text to include in the exception message
 */
export declare function assert(condition: boolean, message?: string): asserts condition;
/**
 * Ensures that value is defined.
 * Throws if the value is undefined, returns the original value otherwise.
 *
 * @param value - The value, or undefined.
 * @returns The passed value, if it is not undefined
 */
export declare function ensureDefined(value: undefined): never;
export declare function ensureDefined<T>(value: T | undefined): T;
/**
 * Ensures that value is not null.
 * Throws if the value is null, returns the original value otherwise.
 *
 * @param value - The value, or null.
 * @returns The passed value, if it is not null
 */
export declare function ensureNotNull(value: null): never;
export declare function ensureNotNull<T>(value: T | null): T;
/**
 * Ensures that value is defined and not null.
 * Throws if the value is undefined or null, returns the original value otherwise.
 *
 * @param value - The value, or undefined, or null.
 * @returns The passed value, if it is not undefined and not null
 */
export declare function ensure(value: undefined | null): never;
export declare function ensure<T>(value: T | undefined | null): T;
/**
 * Compile time check for never
 */
export declare function ensureNever(value: never): void;
