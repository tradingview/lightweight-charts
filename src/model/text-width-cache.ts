const defaultReplacementRe = /[2-9]/g;

export class TextWidthCache {
	private readonly _maxSize: number;
	private _cache: Map<string, number> = new Map();
	/** A "cyclic buffer" of cache keys */
	private _keys: string[] = [];
	/** Current index in the "cyclic buffer" */
	private _keysIndex: number = 0;

	public constructor(size: number = 50) {
		this._maxSize = size;
	}

	public reset(): void {
		this._cache = new Map();
		this._keys = [];
		this._keysIndex = 0;
	}

	public measureText(ctx: CanvasRenderingContext2D, text: string, optimizationReplacementRe?: RegExp): number {
		const re = optimizationReplacementRe || defaultReplacementRe;
		const cacheString = String(text).replace(re, '0');

		let width = this._cache.get(cacheString);

		if (width === undefined) {
			width = ctx.measureText(cacheString).width;

			if (width === 0 && text.length !== 0) {
				// measureText can return 0 in FF depending on a canvas size, don't cache it
				return 0;
			}

			// A cyclic buffer like structure is used to keep track of all the cache keys
			// and remove them when their time has come.
			// This contents of an array cannot be pre-allocated with out-of-band empty values
			// because this would deoptimize the array internal stucture.
			// We will grow this array as we're writing values.

			// The _keysIndex always points to an oldest value.
			// The array is inititalized in "growing" phase when this index equals array length.
			//                .length = N ↓      ↓ maxSize
			// ├──────┬──────┬     ┬──────┐      ┊
			// │ foo  │ bar  │ ... │ baz  │      ┊
			// ├──────┴──────┴     ┴──────┘      ┊
			//                  index = N ↑

			// Eventually the array length reaches _maxSize and the index rolls over to the start.
			//                                   ↓ length = maxSize
			// ├──────┬──────┬     ┬──────┬──────┤
			// │ foo  │ bar  │ ... │ baz  │ quux │
			// ├──────┴──────┴     ┴──────┴──────┤
			// ↑ index = 0

			// From on now we're in the "cyclic" phase when a newest key overwrites the oldest one.
			//                                   ↓ length = maxSize
			// ├──────┬──────┬     ┬──────┬──────┤
			// │ WOOT │ bar  │ ... │ baz  │ quux │
			// ├──────┴──────┴     ┴──────┴──────┤
			//        ↑ index = 1

			// Are we in the "cyclic" phase?
			if (this._keysIndex < this._keys.length) {
				// Cleanup the oldest value
				this._cache.delete(this._keys[this._keysIndex]);
			}

			// Overwrite or create the array element
			this._keys[this._keysIndex] = cacheString;
			// Advance the index so it always points the oldest value
			this._keysIndex = (this._keysIndex + 1) % this._maxSize;

			this._cache.set(cacheString, width);
		}

		return width;
	}
}
