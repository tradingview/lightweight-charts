import { assert } from '../helpers/assertions';
import { Nominal } from '../helpers/nominal';
import { DeepPartial, isString, merge } from '../helpers/strict-type-checks';

import { ChartOptions } from '../model/chart-model';
import { SeriesDataItemTypeMap } from '../model/data-consumer';
import { HorzScaleBehaviorTime } from '../model/horz-scale-behavior-time/horz-scale-behavior-time';
import { Time } from '../model/horz-scale-behavior-time/types';
import { DataItem, HorzScaleItemConverterToInternalObj, IHorzScaleBehavior, InternalHorzScaleItem, InternalHorzScaleItemKey } from '../model/ihorz-scale-behavior';
import { LocalizationOptions } from '../model/localization-options';
import { SeriesType } from '../model/series-options';
import { TickMark } from '../model/tick-marks';
import { TickMarkWeightValue, TimeScalePoint } from '../model/time-data';
import { markWithGreaterWeight, TimeMark } from '../model/time-scale';

import { ChartApi } from './chart-api';
import { IChartApi } from './ichart-api';

/**
 * This function is the main entry point of the Lightweight Charting Library.
 *
 * @param container - ID of HTML element or element itself
 * @param options - Any subset of options to be applied at start.
 * @returns An interface to the created chart
 */
export function createChartEx<HorzScaleItem = Time>(container: string | HTMLElement, horzScaleBehavior: IHorzScaleBehavior<HorzScaleItem>, options?: DeepPartial<ChartOptions<HorzScaleItem>>): IChartApi<HorzScaleItem> {
	let htmlElement: HTMLElement;
	if (isString(container)) {
		const element = document.getElementById(container);
		assert(element !== null, `Cannot find element in DOM with id=${container}`);
		htmlElement = element;
	} else {
		htmlElement = container;
	}

	const res = new ChartApi<HorzScaleItem>(htmlElement, horzScaleBehavior, options);
	horzScaleBehavior.setOptions(res.options());
	return res;
}

export function createChart(container: string | HTMLElement, options?: DeepPartial<ChartOptions<Time>>): IChartApi<Time> {
	return createChartEx<Time>(container, new HorzScaleBehaviorTime(), merge({ localization: { dateFormat: 'dd MMM \'yy' } }, options ?? {}));
}

/**
 * Nominal for numbers used as values in the horizontal scale
 */
type Price = Nominal<number, 'Price'>;

class HorzScaleBehaviorPrice implements IHorzScaleBehavior<Price> {
	public setOptions(options: ChartOptions<Price>): void {}

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
}

export function createOptionsChart(container: string | HTMLElement, options?: DeepPartial<ChartOptions<Price>>): IChartApi<Price> {
	return createChartEx<Price>(container, new HorzScaleBehaviorPrice(), merge({ timeScale: { uniformDistribution: true } }, options ?? {}));
}
