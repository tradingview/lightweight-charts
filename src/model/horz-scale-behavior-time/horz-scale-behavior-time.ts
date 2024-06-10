import { DateFormatter } from '../../formatters/date-formatter';
import { DateTimeFormatter } from '../../formatters/date-time-formatter';

import { ensureNotNull } from '../../helpers/assertions';
import { Mutable } from '../../helpers/mutable';
import { DeepPartial, merge } from '../../helpers/strict-type-checks';

import { SeriesDataItemTypeMap } from '../data-consumer';
import { DataItem, HorzScaleItemConverterToInternalObj, IHorzScaleBehavior, InternalHorzScaleItem, InternalHorzScaleItemKey } from '../ihorz-scale-behavior';
import { LocalizationOptions } from '../localization-options';
import { SeriesType } from '../series-options';
import { TickMark } from '../tick-marks';
import { TickMarkWeightValue, TimeScalePoint } from '../time-data';
import { markWithGreaterWeight, TimeMark } from '../time-scale';
import { defaultTickMarkFormatter } from './default-tick-mark-formatter';
import { TimeChartOptions } from './time-based-chart-options';
import { fillWeightsForPoints } from './time-scale-point-weight-generator';
import { convertStringsToBusinessDays, convertStringToBusinessDay, convertTime, selectTimeConverter } from './time-utils';
import { TickMarkType, TickMarkWeight, Time, TimePoint } from './types';

/**
 * Represents options for formatting dates, times, and prices according to a locale.
 */
interface TimeLocalizationOptions extends LocalizationOptions<Time> {
	/**
	 * Date formatting string.
	 *
	 */
	dateFormat: string;
}

/**
 * The `TickMarkFormatter` is used to customize tick mark labels on the time scale.
 *
 * This function should return `time` as a string formatted according to `tickMarkType` type (year, month, etc) and `locale`.
 *
 * Note that the returned string should be the shortest possible value and should have no more than 8 characters.
 * Otherwise, the tick marks will overlap each other.
 *
 * If the formatter function returns `null` then the default tick mark formatter will be used as a fallback.
 *
 * @example
 * ```js
 * const customFormatter = (time, tickMarkType, locale) => {
 *     // your code here
 * };
 * ```
 */
export type TickMarkFormatter = (time: Time, tickMarkType: TickMarkType, locale: string) => string | null;

// eslint-disable-next-line complexity
function weightToTickMarkType(weight: TickMarkWeight, timeVisible: boolean, secondsVisible: boolean): TickMarkType {
	switch (weight) {
		case TickMarkWeight.LessThanSecond:
		case TickMarkWeight.Second:
			return timeVisible
				? (secondsVisible ? TickMarkType.TimeWithSeconds : TickMarkType.Time)
				: TickMarkType.DayOfMonth;

		case TickMarkWeight.Minute1:
		case TickMarkWeight.Minute5:
		case TickMarkWeight.Minute30:
		case TickMarkWeight.Hour1:
		case TickMarkWeight.Hour3:
		case TickMarkWeight.Hour6:
		case TickMarkWeight.Hour12:
			return timeVisible ? TickMarkType.Time : TickMarkType.DayOfMonth;

		case TickMarkWeight.Day:
			return TickMarkType.DayOfMonth;

		case TickMarkWeight.Month:
			return TickMarkType.Month;

		case TickMarkWeight.Year:
			return TickMarkType.Year;
	}
}

export class HorzScaleBehaviorTime implements IHorzScaleBehavior<Time> {
	private _dateTimeFormatter!: DateFormatter | DateTimeFormatter;
	private _options!: TimeChartOptions;

	public options(): TimeChartOptions {
		return this._options;
	}

	public setOptions(options: TimeChartOptions): void {
		this._options = options;
		this.updateFormatter(options.localization as TimeLocalizationOptions);
	}

	public preprocessData(data: DataItem<Time> | DataItem<Time>[]): void {
		if (Array.isArray(data)) {
			convertStringsToBusinessDays(data);
		} else {
			convertStringToBusinessDay(data);
		}
	}

	public createConverterToInternalObj(data: SeriesDataItemTypeMap<Time>[SeriesType][]): HorzScaleItemConverterToInternalObj<Time> {
		return ensureNotNull(selectTimeConverter(data));
	}

	public key(item: InternalHorzScaleItem | Time): InternalHorzScaleItemKey {
		// eslint-disable-next-line no-restricted-syntax
		if (typeof item === 'object' && 'timestamp' in item) {
			return (item as unknown as TimePoint).timestamp as unknown as InternalHorzScaleItemKey;
		} else {
			return this.key(this.convertHorzItemToInternal(item as Time));
		}
	}

	public cacheKey(item: InternalHorzScaleItem): number {
		const time = item as unknown as TimePoint;
		return time.businessDay === undefined
			? new Date(time.timestamp * 1000).getTime()
			: new Date(Date.UTC(time.businessDay.year, time.businessDay.month - 1, time.businessDay.day)).getTime();
	}

	public convertHorzItemToInternal(item: Time): InternalHorzScaleItem {
		return convertTime(item);
	}

	public updateFormatter(options: TimeLocalizationOptions): void {
		if (!this._options) {
			return;
		}
		const dateFormat = options.dateFormat;

		if (this._options.timeScale.timeVisible) {
			this._dateTimeFormatter = new DateTimeFormatter({
				dateFormat: dateFormat,
				timeFormat: this._options.timeScale.secondsVisible ? '%h:%m:%s' : '%h:%m',
				dateTimeSeparator: '   ',
				locale: options.locale,
			});
		} else {
			this._dateTimeFormatter = new DateFormatter(dateFormat, options.locale);
		}
	}

	public formatHorzItem(item: InternalHorzScaleItem): string {
		const tp = item as unknown as TimePoint;
		return this._dateTimeFormatter.format(new Date(tp.timestamp * 1000));
	}

	public formatTickmark(tickMark: TickMark, localizationOptions: LocalizationOptions<Time>): string {
		const tickMarkType = weightToTickMarkType(tickMark.weight, this._options.timeScale.timeVisible, this._options.timeScale.secondsVisible);

		const options = this._options.timeScale;

		if (options.tickMarkFormatter !== undefined) {
			const tickMarkString = options.tickMarkFormatter(
				tickMark.originalTime as Time,
				tickMarkType,
				localizationOptions.locale
			);
			if (tickMarkString !== null) {
				return tickMarkString;
			}
		}

		return defaultTickMarkFormatter(tickMark.time as unknown as TimePoint, tickMarkType, localizationOptions.locale);
	}

	public maxTickMarkWeight(tickMarks: TimeMark[]): TickMarkWeightValue {
		let maxWeight = tickMarks.reduce(markWithGreaterWeight, tickMarks[0]).weight;

		// special case: it looks strange if 15:00 is bold but 14:00 is not
		// so if maxWeight > TickMarkWeight.Hour1 and < TickMarkWeight.Day reduce it to TickMarkWeight.Hour1
		if (maxWeight > TickMarkWeight.Hour1 && maxWeight < TickMarkWeight.Day) {
			maxWeight = TickMarkWeight.Hour1 as TickMarkWeightValue;
		}
		return maxWeight;
	}

	public fillWeightsForPoints(sortedTimePoints: readonly Mutable<TimeScalePoint>[], startIndex: number): void {
		fillWeightsForPoints(sortedTimePoints, startIndex);
	}

	public static applyDefaults(options?: DeepPartial<TimeChartOptions>): DeepPartial<TimeChartOptions> {
		return merge({ localization: { dateFormat: 'dd MMM \'yy' } }, options ?? {});
	}
}
