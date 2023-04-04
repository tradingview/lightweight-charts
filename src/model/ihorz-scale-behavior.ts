import { Nominal } from '../helpers/nominal';

import { ChartOptions } from './chart-model';
import { SeriesDataItemTypeMap } from './data-consumer';
import { LocalizationOptions } from './localization-options';
import { SeriesType } from './series-options';
import { TickMark } from './tick-marks';
import { TickMarkWeightValue, TimeScalePoint } from './time-data';
import { TimeMark } from './time-scale';

export type InternalHorzScaleItem = Nominal<unknown, 'InternalHorzScaleItem'>;

export type HorzScaleItemConverterToInternalObj<HorzScaleItem> = (time: HorzScaleItem) => InternalHorzScaleItem;

export type DataItem<HorzScaleItem> = SeriesDataItemTypeMap<HorzScaleItem>[SeriesType];

export type InternalHorzScaleItemKey = Nominal<number, 'InternalHorzScaleItemKey'>;

export interface IHorzScaleBehavior<HorzScaleItem> {
	setOptions(options: ChartOptions<HorzScaleItem>): void;
	preprocessData(data: DataItem<HorzScaleItem> | DataItem<HorzScaleItem>[]): void;
	convertHorzItemToInternal(item: HorzScaleItem): InternalHorzScaleItem;
	convertInternalToHorzItem(item: InternalHorzScaleItem): HorzScaleItem;
	createConverterToInternalObj(data: SeriesDataItemTypeMap<HorzScaleItem>[SeriesType][]): HorzScaleItemConverterToInternalObj<HorzScaleItem>;
	key(internalItem: InternalHorzScaleItem | HorzScaleItem): InternalHorzScaleItemKey;
	cacheKey(internalItem: InternalHorzScaleItem): number;
	updateFormatter(options: LocalizationOptions<HorzScaleItem>): void;
	formatHorzItem(item: InternalHorzScaleItem): string;
	formatTickmark(item: TickMark<HorzScaleItem>, localizationOptions: LocalizationOptions<HorzScaleItem>): string;
	maxTickMarkWeight(marks: TimeMark[]): TickMarkWeightValue;
	fillWeightsForPoints(sortedTimePoints: readonly Mutable<TimeScalePoint<HorzScaleItem>>[], startIndex: number): void;
}
