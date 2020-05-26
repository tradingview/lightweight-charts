import { ensureDefined } from '../helpers/assertions';

import { TimePoint } from './time-data';

interface CachedTick {
	string: string;
	tick: number;
}

export type FormatFunction = (timePoint: TimePoint) => string;

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

	public format(value: TimePoint): string {
		const cacheKey = value.businessDay === undefined
			? new Date(value.timestamp * 1000).getTime()
			: new Date(Date.UTC(value.businessDay.year, value.businessDay.month - 1, value.businessDay.day)).getTime();

		const tick = this._cache.get(cacheKey);
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
		this._cache.set(cacheKey, { string: str, tick: this._usageTick });
		this._tick2Labels.set(this._usageTick, cacheKey);
		this._actualSize++;
		this._usageTick++;
		return str;
	}
}
