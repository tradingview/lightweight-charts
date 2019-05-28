const defaultReplacementRe = /[2-9]/g;

export class TextWidthCache {
	private readonly _maxSize: number;
	private _actualSize: number = 0;
	private _usageTick: number = 1;
	private _oldestTick: number = 1;
	private _tick2Labels: Record<number, string> = {};
	private _cache: Record<string, { width: number; tick: number }> = {};

	public constructor(size: number = 50) {
		this._maxSize = size;
	}

	public reset(): void {
		this._actualSize = 0;
		this._cache = {};
		this._usageTick = 1;
		this._oldestTick = 1;
		this._tick2Labels = {};
	}

	public measureText(ctx: CanvasRenderingContext2D, text: string, optimizationReplacementRe?: RegExp): number {
		const re = optimizationReplacementRe || defaultReplacementRe;
		const cacheString = String(text).replace(re, '0');

		if (this._cache[cacheString]) {
			return this._cache[cacheString].width;
		}

		if (this._actualSize === this._maxSize) {
			const oldestValue = this._tick2Labels[this._oldestTick];
			delete this._tick2Labels[this._oldestTick];
			delete this._cache[oldestValue];
			this._oldestTick++;
			this._actualSize--;
		}

		const width = ctx.measureText(cacheString).width;

		if (width === 0 && !!text.length) {
			// measureText can return 0 in FF depending on a canvas size, don't cache it
			return 0;
		}

		this._cache[cacheString] = { width: width, tick: this._usageTick };
		this._tick2Labels[this._usageTick] = cacheString;
		this._actualSize++;
		this._usageTick++;
		return width;
	}
}
