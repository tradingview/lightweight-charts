export type SearchDirection = 'left' | 'right';
export class ExactTimeIndexFinder<T extends { time: number }> {
	private numbers: T[];
	private cache: Map<number, number | unknown>;

	constructor(sortedNumbers: T[]) {
		this.numbers = sortedNumbers;
		this.cache = new Map();
	}

	public findExactIndex<T extends unknown>(
		target: number,
		fallback: T
	): number | T {
		if (this.cache.has(target)) {
			return this.cache.get(target) as number;
		}

		const match = this._performSearch(target, fallback);

		this.cache.set(target, match);
		return match;
	}

	private _performSearch<T extends unknown>(
		target: number,
		fallback: T
	): number | T {
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
		return fallback;
	}
}
