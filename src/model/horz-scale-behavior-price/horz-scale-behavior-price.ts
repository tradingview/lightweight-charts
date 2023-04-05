import { Nominal } from '../../helpers/nominal';
import { DeepPartial, merge } from '../../helpers/strict-type-checks';

import { ChartOptions } from '../chart-model';
import { SeriesDataItemTypeMap } from '../data-consumer';
import { DataItem, HorzScaleItemConverterToInternalObj, IHorzScaleBehavior, InternalHorzScaleItem, InternalHorzScaleItemKey } from '../ihorz-scale-behavior';
import { LocalizationOptions } from '../localization-options';
import { SeriesType } from '../series-options';
import { TickMark } from '../tick-marks';
import { TickMarkWeightValue, TimeScalePoint } from '../time-data';
import { markWithGreaterWeight, TimeMark } from '../time-scale';

/**
 * Nominal for numbers used as values in the horizontal scale
 */
export type Price = Nominal<number, 'Price'>;

export class HorzScaleBehaviorPrice implements IHorzScaleBehavior<Price> {
	private _options!: ChartOptions<Price>;

	public options(): ChartOptions<Price> {
		return this._options;
	}

	public setOptions(options: ChartOptions<Price>): void {
		this._options = options;
	}

	public preprocessData(data: DataItem<Price> | DataItem<Price>[]): void {}

	public createConverterToInternalObj(data: SeriesDataItemTypeMap<Price>[SeriesType][]): HorzScaleItemConverterToInternalObj<Price> {
		return (price: Price) => price as unknown as InternalHorzScaleItem;
	}

	public convertInternalToHorzItem(item: InternalHorzScaleItem): Price {
		return item as unknown as Price;
	}

	public key(item: InternalHorzScaleItem | Price): InternalHorzScaleItemKey {
		return item as unknown as InternalHorzScaleItemKey;
	}

	public cacheKey(item: InternalHorzScaleItem): number {
		return item as unknown as number;
	}

	public convertHorzItemToInternal(item: Price): InternalHorzScaleItem {
		return item as unknown as InternalHorzScaleItem;
	}

	public updateFormatter(options: LocalizationOptions<Price>): void {}

	public formatHorzItem(item: InternalHorzScaleItem): string {
		const tp = item as unknown as Price;
		return tp.toFixed(2);
	}

	public formatTickmark(tickMark: TickMark<Price>, localizationOptions: LocalizationOptions<Price>): string {
		return (tickMark.time as unknown as Price).toFixed(2);
	}

	public maxTickMarkWeight(tickMarks: TimeMark[]): TickMarkWeightValue {
		return tickMarks.reduce(markWithGreaterWeight, tickMarks[0]).weight;
	}

	public fillWeightsForPoints(sortedTimePoints: readonly Mutable<TimeScalePoint<Price>>[], startIndex: number): void {
		const priceWeight = (price: Price) => {
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
			sortedTimePoints[index].timeWeight = priceWeight(sortedTimePoints[index].time as unknown as Price) as TickMarkWeightValue;
		}
	}

	public static applyDefaults(options?: DeepPartial<ChartOptions<Price>>): DeepPartial<ChartOptions<Price>> {
		return merge({ timeScale: { uniformDistribution: true } }, options ?? {});
	}
}
