import { assert } from '../helpers/assertions';
export class RangeImpl {
    constructor(left, right) {
        assert(left <= right, 'right should be >= left');
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
export function areRangesEqual(first, second) {
    if (first === null || second === null) {
        return first === second;
    }
    return first.equals(second);
}
