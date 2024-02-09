import { Mutable } from '../../helpers/mutable';
import { DeepPartial } from '../../helpers/strict-type-checks';
import { SeriesDataItemTypeMap } from '../data-consumer';
import { DataItem, HorzScaleItemConverterToInternalObj, IHorzScaleBehavior, InternalHorzScaleItem, InternalHorzScaleItemKey } from '../ihorz-scale-behavior';
import { LocalizationOptions } from '../localization-options';
import { SeriesType } from '../series-options';
import { TickMark } from '../tick-marks';
import { TickMarkWeightValue, TimeScalePoint } from '../time-data';
import { TimeMark } from '../time-scale';
import { TimeChartOptions } from './time-based-chart-options';
import { BusinessDay, TickMarkType, Time } from './types';
export declare function convertTime(time: Time): InternalHorzScaleItem;
export declare function stringToBusinessDay(value: string): BusinessDay;
interface TimeLocalizationOptions extends LocalizationOptions<Time> {
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
export declare class HorzScaleBehaviorTime implements IHorzScaleBehavior<Time> {
    private _dateTimeFormatter;
    private _options;
    options(): TimeChartOptions;
    setOptions(options: TimeChartOptions): void;
    preprocessData(data: DataItem<Time> | DataItem<Time>[]): void;
    createConverterToInternalObj(data: SeriesDataItemTypeMap<Time>[SeriesType][]): HorzScaleItemConverterToInternalObj<Time>;
    key(item: InternalHorzScaleItem | Time): InternalHorzScaleItemKey;
    cacheKey(item: InternalHorzScaleItem): number;
    convertHorzItemToInternal(item: Time): InternalHorzScaleItem;
    updateFormatter(options: TimeLocalizationOptions): void;
    formatHorzItem(item: InternalHorzScaleItem): string;
    formatTickmark(tickMark: TickMark, localizationOptions: LocalizationOptions<Time>): string;
    maxTickMarkWeight(tickMarks: TimeMark[]): TickMarkWeightValue;
    fillWeightsForPoints(sortedTimePoints: readonly Mutable<TimeScalePoint>[], startIndex: number): void;
    static applyDefaults(options?: DeepPartial<TimeChartOptions>): DeepPartial<TimeChartOptions>;
}
export {};
