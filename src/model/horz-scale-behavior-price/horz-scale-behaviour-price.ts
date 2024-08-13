import { Mutable } from '../../helpers/mutable';

import { ChartOptionsImpl } from '../chart-model';
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
import { PriceChartLocalizationOptions } from './options';
import { HorzScalePriceItem } from './types';

function markWithGreaterWeight(a: TimeMark, b: TimeMark): TimeMark {
	return a.weight > b.weight ? a : b;
}

export class HorzScaleBehaviorPrice implements IHorzScaleBehavior<HorzScalePriceItem> {
	private _options!: ChartOptionsImpl<HorzScalePriceItem>;

	public options(): ChartOptionsImpl<HorzScalePriceItem> {
		return this._options;
	}

	public setOptions(options: ChartOptionsImpl<HorzScalePriceItem>): void {
		this._options = options;
	}

	public preprocessData(
		data: DataItem<HorzScalePriceItem> | DataItem<HorzScalePriceItem>[]
	): void {}

	public updateFormatter(options: PriceChartLocalizationOptions): void {
		if (!this._options) {
			return;
		}
		this._options.localization = options;
	}

	public createConverterToInternalObj(
		data: SeriesDataItemTypeMap<HorzScalePriceItem>[SeriesType][]
	): HorzScaleItemConverterToInternalObj<HorzScalePriceItem> {
		return (price: number) => price as unknown as InternalHorzScaleItem;
	}

	public key(
		internalItem: InternalHorzScaleItem | HorzScalePriceItem
	): InternalHorzScaleItemKey {
		return internalItem as InternalHorzScaleItemKey;
	}

	public cacheKey(internalItem: InternalHorzScaleItem): number {
		return internalItem as unknown as number;
	}

	public convertHorzItemToInternal(
		item: HorzScalePriceItem
	): InternalHorzScaleItem {
		return item as unknown as InternalHorzScaleItem;
	}

	public formatHorzItem(item: InternalHorzScaleItem): string {
		return (item as unknown as number).toFixed(this._precision());
	}

	public formatTickmark(
		item: TickMark,
		localizationOptions: LocalizationOptions<HorzScalePriceItem>
	): string {
		return (item.time as unknown as number).toFixed(this._precision());
	}

	public maxTickMarkWeight(marks: TimeMark[]): TickMarkWeightValue {
		return marks.reduce(markWithGreaterWeight, marks[0]).weight;
	}

	public fillWeightsForPoints(
		sortedTimePoints: readonly Mutable<TimeScalePoint>[],
		startIndex: number
	): void {
		const priceWeight = (price: number) => {
			if (price === Math.ceil(price / 100) * 100) {
				return 8;
			}
			if (price === Math.ceil(price / 50) * 50) {
				return 7;
			}
			if (price === Math.ceil(price / 25) * 25) {
				return 6;
			}
			if (price === Math.ceil(price / 10) * 10) {
				return 5;
			}
			if (price === Math.ceil(price / 5) * 5) {
				return 4;
			}
			if (price === Math.ceil(price)) {
				return 3;
			}
			if (price * 2 === Math.ceil(price * 2)) {
				return 1;
			}
			return 0;
		};
		for (let index = startIndex; index < sortedTimePoints.length; ++index) {
			sortedTimePoints[index].timeWeight = priceWeight(
				sortedTimePoints[index].time as unknown as number
			) as TickMarkWeightValue;
		}
	}

	private _precision(): number {
		return (this._options.localization as PriceChartLocalizationOptions)
			.precision;
	}
}
