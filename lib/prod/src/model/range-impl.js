import { assert } from '../helpers/assertions';
export class RangeImpl {
    constructor(left, right) {
        assert(left <= right, 'right should be >= left');
        this._private__left = left;
        this._private__right = right;
    }
    _internal_left() {
        return this._private__left;
    }
    _internal_right() {
        return this._private__right;
    }
    _internal_count() {
        return this._private__right - this._private__left + 1;
    }
    _internal_contains(index) {
        return this._private__left <= index && index <= this._private__right;
    }
    _internal_equals(other) {
        return this._private__left === other._internal_left() && this._private__right === other._internal_right();
    }
}
export function areRangesEqual(first, second) {
    if (first === null || second === null) {
        return first === second;
    }
    return first._internal_equals(second);
}
