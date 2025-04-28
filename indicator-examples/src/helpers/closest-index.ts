export type SearchDirection = 'left' | 'right';
export class ClosestTimeIndexFinder<T extends { time: number }> {
	private numbers: T[];
	private cache: Map<string, number>;

	constructor(sortedNumbers: T[]) {
		this.numbers = sortedNumbers;
		this.cache = new Map();
	}

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
