"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.undefinedIfNull = exports.notNull = exports.clone = exports.isBoolean = exports.isString = exports.isInteger = exports.isNumber = exports.merge = void 0;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function merge(dst, ...sources) {
    for (const src of sources) {
        // eslint-disable-next-line no-restricted-syntax
        for (const i in src) {
            if (src[i] === undefined) {
                continue;
            }
            if ('object' !== typeof src[i] || dst[i] === undefined || Array.isArray(src[i])) {
                dst[i] = src[i];
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                merge(dst[i], src[i]);
            }
        }
    }
    return dst;
}
exports.merge = merge;
function isNumber(value) {
    return (typeof value === 'number') && (isFinite(value));
}
exports.isNumber = isNumber;
function isInteger(value) {
    return (typeof value === 'number') && ((value % 1) === 0);
}
exports.isInteger = isInteger;
function isString(value) {
    return typeof value === 'string';
}
exports.isString = isString;
function isBoolean(value) {
    return typeof value === 'boolean';
}
exports.isBoolean = isBoolean;
function clone(object) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = object;
    if (!o || 'object' !== typeof o) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return o;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let c;
    if (Array.isArray(o)) {
        c = [];
    }
    else {
        c = {};
    }
    let p;
    let v;
    // eslint-disable-next-line no-restricted-syntax
    for (p in o) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,no-prototype-builtins
        if (o.hasOwnProperty(p)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            v = o[p];
            if (v && 'object' === typeof v) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                c[p] = clone(v);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                c[p] = v;
            }
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return c;
}
exports.clone = clone;
function notNull(t) {
    return t !== null;
}
exports.notNull = notNull;
function undefinedIfNull(t) {
    return (t === null) ? undefined : t;
}
exports.undefinedIfNull = undefinedIfNull;
