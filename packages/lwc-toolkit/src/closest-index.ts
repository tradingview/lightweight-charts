/**
 * Which of the two entries bracketing the target is wanted when the target
 * itself is not in the array. It names the side the search continues towards,
 * not the side the answer lies on:
 *
 * - `'left'` keeps moving right until it is past the target, and so returns the
 *   first entry at or *after* it (the right-hand bracket);
 * - `'right'` returns the last entry at or *before* the target (the left-hand
 *   bracket).
 */
export type SearchDirection = 'left' | 'right';

/**
 * Binary search over a time-sorted array, returning the index of the entry
 * bracketing a target time on the requested side.
 *
 * It never picks the numerically nearest entry: the side always wins, so a
 * target one millisecond past an entry still resolves to that entry for
 * `'right'` and to the next one for `'left'`. Results are memoised per target
 * and direction, so the array must not be mutated after construction.
 */
export class ClosestTimeIndexFinder<T extends { time: number }> {
	private numbers: T[];
	private cache: Map<string, number>;

	constructor(sortedNumbers: T[]) {
		this.numbers = sortedNumbers;
		this.cache = new Map();
	}

	/**
	 * @param target - the time to look for.
	 * @param direction - which bracketing entry to return, see {@link SearchDirection}.
	 * @returns the index of the bracketing entry, clamped to the ends of the array.
	 */
	public findClosestIndex(target: number, direction: SearchDirection): number {
		const cacheKey = `${target}:${direction}`;
		if (this.cache.has(cacheKey)) {
			return this.cache.get(cacheKey) as number;
		}

		const closestIndex = this._performSearch(target, direction);

		this.cache.set(cacheKey, closestIndex);
		return closestIndex;
	}

	private _performSearch(target: number, direction: SearchDirection): number {
		let low = 0;
		let high = this.numbers.length - 1;

		if (target <= this.numbers[0].time) return 0;
		if (target >= this.numbers[high].time) return high;

		while (low <= high) {
			const mid = Math.floor((low + high) / 2);
			const num = this.numbers[mid].time;

			if (num === target) {
				return mid;
			} else if (num > target) {
				high = mid - 1;
			} else {
				low = mid + 1;
			}
		}
		return direction === 'left' ? low : high;
	}
}
