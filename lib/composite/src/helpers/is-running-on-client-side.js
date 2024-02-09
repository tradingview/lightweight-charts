"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRunningOnClientSide = void 0;
/**
 * When you're trying to use the library in server-side context (for instance in SSR)
 * you don't have some browser-specific variables like navigator or window
 * and if the library will use them on the top level of the library
 * the import will fail due ReferenceError
 * thus, this allows use the navigator on the top level and being imported in server-side context as well
 * See issue #446
 */
// eslint-disable-next-line @typescript-eslint/tslint/config
exports.isRunningOnClientSide = typeof window !== 'undefined';
