const defaultReplacementRe = /[2-9]/g;

export class TextWidthCache {
	private readonly _maxSize: number;
	private _cache: Record<string, number> = Object.create(null);
	/** A "cyclic buffer" of cache keys */
	private _keys: string[] = [];
	/** Current index in the "cyclic buffer" */
	private _keysIndex: number = 0;

	public constructor(size: number = 50) {
		this._maxSize = size;
	}

	public reset(): void {
		this._cache = Object.create(null);
		this._keys = [];
		this._keysIndex = 0;
	}

	public measureText(ctx: CanvasRenderingContext2D, text: string, optimizationReplacementRe?: RegExp): number {
		const re = optimizationReplacementRe || defaultReplacementRe;
		const cacheString = String(text).replace(re, '0');

		if (cacheString in this._cache) {
			return this._cache[cacheString];
		}

		const width = ctx.measureText(cacheString).width;

		if (width === 0 && text.length !== 0) {
			// measureText can return 0 in FF depending on a canvas size, don't cache it
			return 0;
		}

		if (this._keysIndex < this._keys.length) {
			// Cleanup the oldest value
			delete this._cache[this._keys[this._keysIndex]];
		}

		this._keys[this._keysIndex] = cacheString;
		// Advance the index so it always points the oldest value
		this._keysIndex = (this._keysIndex + 1) % this._maxSize;
		return this._cache[cacheString] = width;
	}
}
