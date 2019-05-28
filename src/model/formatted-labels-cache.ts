import { ensureDefined } from '../helpers/assertions';

interface CachedTick {
	string: string;
	tick: number;
}

export type FormatFunction = (value: Date) => string;

export class FormattedLabelsCache {
	private readonly _format: FormatFunction;
	private readonly _maxSize: number;
	private _actualSize: number = 0;
	private _usageTick: number = 1;
	private _oldestTick: number = 1;
	private _cache: Map<number, CachedTick> = new Map();
	private _tick2Labels: Map<number, number> = new Map();

	public constructor(format: FormatFunction, size: number = 50) {
		this._format = format;
		this._maxSize = size;
	}

	public format(value: Date): string {
		const tick = this._cache.get(value.valueOf());
		if (tick !== undefined) {
			return tick.string;
		}

		if (this._actualSize === this._maxSize) {
			const oldestValue = this._tick2Labels.get(this._oldestTick);
			this._tick2Labels.delete(this._oldestTick);
			this._cache.delete(ensureDefined(oldestValue));
			this._oldestTick++;
			this._actualSize--;
		}

		const str = this._format(value);
		this._cache.set(value.valueOf(), { string: str, tick: this._usageTick });
		this._tick2Labels.set(this._usageTick, value.valueOf());
		this._actualSize++;
		this._usageTick++;
		return str;
	}
}
