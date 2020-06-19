export type CanvasCtxLike = Pick<CanvasRenderingContext2D, 'measureText'>;

const defaultReplacementRe = /[2-9]/g;

export class TextWidthCache {
	private _cache: Map<string, number> = new Map();
	/** A "cyclic buffer" of cache keys */
	private _keys: (string | undefined)[];
	/** Current index in the "cyclic buffer" */
	private _keysIndex: number = 0;

	public constructor(size: number = 50) {
		// A trick to keep array PACKED_ELEMENTS
		this._keys = Array.from(new Array(size));
	}

	public reset(): void {
		this._cache.clear();
		this._keys.fill(undefined);
		// We don't care where exactly the _keysIndex points,
		// so there's no point in resetting it
	}

	public measureText(ctx: CanvasCtxLike, text: string, optimizationReplacementRe?: RegExp): number {
		const re = optimizationReplacementRe || defaultReplacementRe;
		const cacheString = String(text).replace(re, '0');

		let width = this._cache.get(cacheString);

		if (width === undefined) {
			width = ctx.measureText(cacheString).width;

			if (width === 0 && text.length !== 0) {
				// measureText can return 0 in FF depending on a canvas size, don't cache it
				return 0;
			}

			// A cyclic buffer is used to keep track of the cache keys and to delete
			// the oldest one before a new one is inserted.
			// ├──────┬──────┬──────┬──────┤
			// │ foo  │ bar  │      │      │
			// ├──────┴──────┴──────┴──────┤
			//                 ↑ index

			// Eventually, the index reach the end of an array and roll-over to 0.
			// ├──────┬──────┬──────┬──────┤
			// │ foo  │ bar  │ baz  │ quux │
			// ├──────┴──────┴──────┴──────┤
			//   ↑ index = 0

			// After that the oldest value will be overwritten.
			// ├──────┬──────┬──────┬──────┤
			// │ WOOT │ bar  │ baz  │ quux │
			// ├──────┴──────┴──────┴──────┤
			//          ↑ index = 1

			const oldestKey = this._keys[this._keysIndex];
			if (oldestKey !== undefined) {
				this._cache.delete(oldestKey);
			}
			// Set a newest key in place of the just deleted one
			this._keys[this._keysIndex] = cacheString;
			// Advance the index so it always points the oldest value
			this._keysIndex = (this._keysIndex + 1) % this._keys.length;

			this._cache.set(cacheString, width);
		}

		return width;
	}
}
