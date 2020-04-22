import { assert } from '../helpers/assertions';

export class Range<T extends number> {
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

	public equals(other: Range<T>): boolean {
		return this._left === other.left() && this._right === other.right();
	}
}
