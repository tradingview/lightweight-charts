import { TimePoint, TimePointIndex, UTCTimestamp } from './time-data';

/**
 * This is the collection of time points, that allows to store and find the every time point using it's index.
 */
export class TimePoints {
	private _items: TimePoint[] = [];

	public clear(): void {
		this._items = [];
	}

	public size(): number {
		return this._items.length;
	}

	public firstIndex(): TimePointIndex | null {
		return this._offsetToIndex(0);
	}

	public lastIndex(): TimePointIndex | null {
		return this._offsetToIndex(this._items.length - 1);
	}

	public merge(sinceIndex: TimePointIndex, values: TimePoint[]): void {
		if (values.length === 0) {
			return;
		}

		// assume that 'values' contains at least one TimePoint
		if (this._items.length === 0) {
			this._items = values;
			return;
		}

		let i = sinceIndex;
		for (; i < this._items.length && (i - sinceIndex) < values.length; ++i) {
			this._items[i] = values[i - sinceIndex];
		}

		const end = sinceIndex + values.length;
		if (end > this._items.length) {
			const n = end - this._items.length;
			for (let j = i; j < i + n; ++j) {
				this._items.push(values[j - sinceIndex]);
			}
		}
	}

	public valueAt(index: TimePointIndex): TimePoint | null {
		const offset = this._indexToOffset(index);
		if (offset !== null) {
			return this._items[offset];
		}

		return null;
	}

	public indexOf(time: UTCTimestamp, findNearest: boolean): TimePointIndex | null {
		if (this._items.length < 1) {
			// no time points available
			return null;
		}

		if (time > this._items[this._items.length - 1].timestamp) {
			// special case
			return findNearest ? this._items.length - 1 as TimePointIndex : null;
		}

		for (let i = 0; i < this._items.length; ++i) {
			if (time === this._items[i].timestamp) {
				return i as TimePointIndex;
			}

			if (time < this._items[i].timestamp) {
				return findNearest ? i as TimePointIndex : null;
			}
		}

		// in fact, this code is unreachable because we already
		// have special case for time > this._items[this._items.length - 1]
		return null;
	}

	private _offsetToIndex(offset: number): TimePointIndex | null {
		if (0 <= offset && offset < this.size()) {
			return offset as TimePointIndex;
		}

		return null;
	}

	private _indexToOffset(index: TimePointIndex): number | null {
		if (0 <= index && index < this.size()) {
			return index;
		}

		return null;
	}
}
