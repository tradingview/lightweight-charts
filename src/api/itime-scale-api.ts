import { DeepPartial } from '../helpers/strict-type-checks';

import { TimeScaleOptions } from '../model/time-scale';

import { Time } from './data-layer';

export interface TimeRange {
	from: Time;
	to: Time;
}

export interface ITimeScaleApi {
	scrollPosition(): number;
	scrollToPosition(position: number, animated: boolean): void;
	scrollToRealtime(): void;

	getVisibleRange(): TimeRange | null;
	setVisibleRange(range: TimeRange): void;

	resetTimeScale(): void;
	fitContent(): void;

	applyOptions(options: DeepPartial<TimeScaleOptions>): void;
	options(): TimeScaleOptions;
}
