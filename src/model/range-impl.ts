import { assert } from '../helpers/assertions';

export class RangeImpl<T extends number> {
	private readonly _left: T;
	private readonly _right: T;

	public constructor(left: T, right: T) {
		assert(left <= right, 'right should be >= left');

		this._left = left;
		this._right = right;
	}

	public left(): T {
		return this._left;
	}

	public right(): T {
		return this._right;
	}

	public count(): number {
		return this._right - this._left + 1;
	}

	public contains(index: T): boolean {
		return this._left <= index && index <= this._right;
	}

	public equals(other: RangeImpl<T>): boolean {
		return this._left === other.left() && this._right === other.right();
	}
}

export function areRangesEqual<T extends number>(first: RangeImpl<T> | null, second: RangeImpl<T> | null): boolean {
	if (first === null || second === null) {
		return first === second;
	}

	return first.equals(second);
}
