import { Delegate } from '../../helpers/delegate';
import { ISubscription } from '../../helpers/isubscription';
import { Mutable } from '../../helpers/mutable';

import { SeriesDataItemTypeMap } from '../data-consumer';
import {
	DataItem,
	HorzScaleItemConverterToInternalObj,
	IHorzScaleBehavior,
	InternalHorzScaleItem,
	InternalHorzScaleItemKey,
} from '../ihorz-scale-behavior';
import { LocalizationOptions } from '../localization-options';
import { SeriesType } from '../series-options';
import { TickMark } from '../tick-marks';
import { TickMarkWeightValue, TimeScalePoint } from '../time-data';
import { TimeMark } from '../time-scale';
import { YieldCurveChartOptions } from './yield-curve-chart-options';

type EventHandler = (...args: unknown[]) => void;
function createDebouncedMicroTaskHandler(callback: EventHandler): EventHandler {
	let scheduled = false;

	return function(...args: unknown[]): void {
		if (!scheduled) {
			scheduled = true;

			queueMicrotask((): void => {
				callback(...args);
				scheduled = false;
			});
		}
	};
}

function markWithGreaterWeight(a: TimeMark, b: TimeMark): TimeMark {
	return a.weight > b.weight ? a : b;
}

function toInternalHorzScaleItem(
	item: number | InternalHorzScaleItem
): InternalHorzScaleItem {
	return item as unknown as InternalHorzScaleItem;
}

function fromInternalHorzScaleItem(
	item: InternalHorzScaleItem | number
): number {
	return item as unknown as number;
}

export class YieldCurveHorzScaleBehavior implements IHorzScaleBehavior<number> {
	private _options!: YieldCurveChartOptions;
	private readonly _pointsChangedDelegate: Delegate<number> = new Delegate();
	private _invalidateWhitespace: EventHandler = createDebouncedMicroTaskHandler(() => this._pointsChangedDelegate.fire(this._largestIndex));
	private _largestIndex: number = 0;

	/** Data changes might require that the whitespace be generated again */
	public whitespaceInvalidated(): ISubscription<number> {
		return this._pointsChangedDelegate;
	}

	public destroy(): void {
		this._pointsChangedDelegate.destroy();
	}

	public options(): YieldCurveChartOptions {
		return this._options;
	}

	public setOptions(options: YieldCurveChartOptions): void {
		this._options = options;
	}

	public preprocessData(data: DataItem<number> | DataItem<number>[]): void {
		// No preprocessing needed for yield curve data
	}

	public updateFormatter(options: LocalizationOptions<number>): void {
		if (!this._options) {
			return;
		}
		this._options.localization = options;
	}

	public createConverterToInternalObj(
		data: SeriesDataItemTypeMap<number>[SeriesType][]
	): HorzScaleItemConverterToInternalObj<number> {
		this._invalidateWhitespace();
		return (time: number) => {
			if (time > this._largestIndex) {
				this._largestIndex = time;
			}
			return toInternalHorzScaleItem(time);
		};
	}

	public key(
		internalItem: InternalHorzScaleItem | number
	): InternalHorzScaleItemKey {
		return internalItem as unknown as InternalHorzScaleItemKey;
	}

	public cacheKey(internalItem: InternalHorzScaleItem): number {
		return fromInternalHorzScaleItem(internalItem);
	}

	public convertHorzItemToInternal(item: number): InternalHorzScaleItem {
		return toInternalHorzScaleItem(item);
	}

	public formatHorzItem(item: InternalHorzScaleItem): string {
		return this._formatTime(item as unknown as number);
	}

	public formatTickmark(item: TickMark): string {
		return this._formatTime(item.time as unknown as number);
	}

	public maxTickMarkWeight(marks: TimeMark[]): TickMarkWeightValue {
		return marks.reduce(markWithGreaterWeight, marks[0]).weight;
	}

	public fillWeightsForPoints(
		sortedTimePoints: readonly Mutable<TimeScalePoint>[],
		startIndex: number
	): void {
		const timeWeight = (time: number) => {
			if (time % 120 === 0) {
				return 10;
			}
			if (time % 60 === 0) {
				return 9;
			}
			if (time % 36 === 0) {
				return 8;
			}
			if (time % 12 === 0) {
				return 7;
			}
			if (time % 6 === 0) {
				return 6;
			}
			if (time % 3 === 0) {
				return 5;
			}
			if (time % 1 === 0) {
				return 4;
			}
			return 0;
		};

		for (let index = startIndex; index < sortedTimePoints.length; ++index) {
			sortedTimePoints[index].timeWeight = timeWeight(
				fromInternalHorzScaleItem(sortedTimePoints[index].time)
			) as TickMarkWeightValue;
		}
		this._largestIndex = fromInternalHorzScaleItem(sortedTimePoints[sortedTimePoints.length - 1].time);
		this._invalidateWhitespace();
	}

	private _formatTime(months: number): string {
		if (this._options.localization?.timeFormatter) {
			return this._options.localization.timeFormatter(months);
		}

		if (months < 12) {
			return `${months}M`;
		}
		const years = Math.floor(months / 12);
		const remainingMonths = months % 12;
		if (remainingMonths === 0) {
			return `${years}Y`;
		}
		return `${years}Y${remainingMonths}M`;
	}
}
