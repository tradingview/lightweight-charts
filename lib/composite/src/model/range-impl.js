"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.areRangesEqual = exports.RangeImpl = void 0;
const assertions_1 = require("../helpers/assertions");
class RangeImpl {
    constructor(left, right) {
        (0, assertions_1.assert)(left <= right, 'right should be >= left');
        this._left = left;
        this._right = right;
    }
    left() {
        return this._left;
    }
    right() {
        return this._right;
    }
    count() {
        return this._right - this._left + 1;
    }
    contains(index) {
        return this._left <= index && index <= this._right;
    }
    equals(other) {
        return this._left === other.left() && this._right === other.right();
    }
}
exports.RangeImpl = RangeImpl;
function areRangesEqual(first, second) {
    if (first === null || second === null) {
        return first === second;
    }
    return first.equals(second);
}
exports.areRangesEqual = areRangesEqual;
