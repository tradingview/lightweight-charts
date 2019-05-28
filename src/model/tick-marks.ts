import { ensureDefined } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';

import { TickMark, TimePoint } from './time-data';

function sortByIndexAsc(a: TickMark, b: TickMark): number {
	return a.index - b.index;
}

export class TickMarks {
	private _minIndex: number = Infinity;
	private _maxIndex: number = -Infinity;

	// Hash of tick marks
	private _marksByIndex: Map<number, TickMark> = new Map();
	// Sparse array with ordered arrays of tick marks
	private _marksBySpan: (TickMark[] | undefined) [] = [];
	private _changed: Delegate = new Delegate();
	private _cache: TickMark[] | null = null;
	private _maxBar: number = NaN;

	public reset(): void {
		this._marksByIndex.clear();
		this._marksBySpan = [];
		this._minIndex = Infinity;
		this._maxIndex = -Infinity;
		this._cache = null;
		this._changed.fire();
	}

	// tslint:disable-next-line:cyclomatic-complexity
	public merge(tickMarks: TickMark[]): void {
		const marksBySpan = this._marksBySpan;
		const unsortedSpans: Record<number, boolean> = {};

		for (const tickMark of tickMarks) {
			const index = tickMark.index;
			const span = tickMark.span;

			const existingTickMark = this._marksByIndex.get(tickMark.index);
			if (existingTickMark) {
				if (existingTickMark.index === tickMark.index && existingTickMark.span === tickMark.span) {
					// We don't need to do anything, just update time (if it differs)
					existingTickMark.time = tickMark.time;
					continue;
				}

				// TickMark exists, but it differs. We need to remove it first
				this._removeTickMark(existingTickMark);
			}

			// Set into hash
			this._marksByIndex.set(index, tickMark);
			if (this._minIndex > index) { // It's not the same as `this.minIndex > index`, mind the NaN
				this._minIndex = index;
			}

			if (this._maxIndex < index) {
				this._maxIndex = index;
			}

			// Store it in span arrays
			let marks = marksBySpan[span];
			if (marks === undefined) {
				marks = [];
				marksBySpan[span] = marks;
			}

			marks.push(tickMark);
			unsortedSpans[span] = true;
		}

		// Clean up and sort arrays
		for (let span = marksBySpan.length; span--;) {
			const marks = marksBySpan[span];
			if (marks === undefined) {
				continue;
			}

			if (marks.length === 0) {
				delete marksBySpan[span];
			}

			if (unsortedSpans[span]) {
				marks.sort(sortByIndexAsc);
			}
		}

		this._cache = null;
		this._changed.fire();
	}

	public indexToTime(index: number): TimePoint | null {
		const tickMark = this._marksByIndex.get(index);
		if (tickMark === undefined) {
			return null;
		}

		return tickMark.time;
	}

	public nearestIndex(time: number): number {
		let left = this._minIndex;
		let right = this._maxIndex;
		while (right - left > 2) {
			if (ensureDefined(this._marksByIndex.get(left)).time.timestamp * 1000 === time) {
				return left;
			}

			if (ensureDefined(this._marksByIndex.get(right)).time.timestamp * 1000 === time) {
				return right;
			}

			const center = Math.round((left + right) / 2);
			if (ensureDefined(this._marksByIndex.get(center)).time.timestamp * 1000 > time) {
				right = center;
			} else {
				left = center;
			}
		}

		return left;
	}

	public build(spacing: number, maxWidth: number): TickMark[] {
		const maxBar = Math.ceil(maxWidth / spacing);
		if (this._maxBar === maxBar && this._cache) {
			return this._cache;
		}

		this._maxBar = maxBar;
		let marks: TickMark[] = [];
		for (let span = this._marksBySpan.length; span--;) {
			if (!this._marksBySpan[span]) {
				continue;
			}

			// Built tickMarks are now prevMarks, and marks it as new array
			const prevMarks = marks;
			marks = [];

			const prevMarksLength = prevMarks.length;
			let prevMarksPointer = 0;
			const currentSpan = ensureDefined(this._marksBySpan[span]);
			const currentSpanLength = currentSpan.length;

			let rightIndex = Infinity;
			let leftIndex = -Infinity;
			for (let i = 0; i < currentSpanLength; i++) {
				const mark = currentSpan[i];
				const currentIndex = mark.index;

				// Determine indexes with which current index will be compared
				// All marks to the right is moved to new array
				while (prevMarksPointer < prevMarksLength) {
					const lastMark = prevMarks[prevMarksPointer];
					const lastIndex = lastMark.index;
					if (lastIndex < currentIndex) {
						prevMarksPointer++;
						marks.push(lastMark);
						leftIndex = lastIndex;
						rightIndex = Infinity;
					} else {
						rightIndex = lastIndex;
						break;
					}
				}

				if (rightIndex - currentIndex >= maxBar && currentIndex - leftIndex >= maxBar) {
					// TickMark fits. Place it into new array
					marks.push(mark);
					leftIndex = currentIndex;
				}
			}

			// Place all unused tickMarks into new array;
			for (; prevMarksPointer < prevMarksLength; prevMarksPointer++) {
				marks.push(prevMarks[prevMarksPointer]);
			}
		}

		this._cache = marks;
		return this._cache;
	}

	private _removeTickMark(tickMark: TickMark): void {
		const index = tickMark.index;
		if (this._marksByIndex.get(index) !== tickMark) {
			return;
		}

		this._marksByIndex.delete(index);
		if (index <= this._minIndex) {
			this._minIndex++;
		}

		if (index >= this._maxIndex) {
			this._maxIndex--;
		}

		if (this._maxIndex < this._minIndex) {
			this._minIndex = Infinity;
			this._maxIndex = -Infinity;
		}

		const spanArray = ensureDefined(this._marksBySpan[tickMark.span]);
		const position = spanArray.indexOf(tickMark);
		if (position !== -1) {
			// Keeps array sorted
			spanArray.splice(position, 1);
		}
	}
}
