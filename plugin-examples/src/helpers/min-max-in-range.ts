interface UpperLowerData {
	upper: number;
	lower: number;
}
export class UpperLowerInRange<T extends UpperLowerData> {
	private _arr: T[];
	private _chunkSize: number;
	private _cache: Map<string, UpperLowerData>;

	constructor(arr: T[], chunkSize = 10) {
		this._arr = arr;
		this._chunkSize = chunkSize;
		this._cache = new Map();
	}

	public getMinMax(startIndex: number, endIndex: number): UpperLowerData {
		const cacheKey = `${startIndex}:${endIndex}`;
		if (cacheKey in this._cache) {
			return this._cache.get(cacheKey) as T;
		}

		const result: UpperLowerData = {
			lower: Infinity,
			upper: -Infinity,
		};
		// Check if we have precalculated min and max values for any of the chunks.
		const startChunkIndex = Math.floor(startIndex / this._chunkSize);
		const endChunkIndex = Math.floor(endIndex / this._chunkSize);
		for (
			let chunkIndex = startChunkIndex;
			chunkIndex <= endChunkIndex;
			chunkIndex++
		) {
			const chunkStart = chunkIndex * this._chunkSize;
			const chunkEnd = Math.min(
				(chunkIndex + 1) * this._chunkSize - 1,
				this._arr.length - 1
			);
			const chunkCacheKey = `${chunkStart}:${chunkEnd}`;

			if (chunkCacheKey in this._cache.keys()) {
				const item = this._cache.get(cacheKey) as T;
				this._check(item, result);
			} else {
				const chunkResult: UpperLowerData = {
					lower: Infinity,
					upper: -Infinity,
				};
				for (let i = chunkStart; i <= chunkEnd; i++) {
					this._check(this._arr[i], chunkResult);
				}
				this._cache.set(chunkCacheKey, chunkResult);
				this._check(chunkResult, result);
			}
		}

		this._cache.set(cacheKey, result);
		return result;
	}

	private _check(item: UpperLowerData, state: UpperLowerData) {
		if (item.lower < state.lower) {
			state.lower = item.lower;
		}
		if (item.upper > state.upper) {
			state.upper = item.upper;
		}
	}
}
