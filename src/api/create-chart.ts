import { assert } from '../helpers/assertions';
import { DeepPartial, isString } from '../helpers/strict-type-checks';

import { ChartOptions } from '../model/chart-model';
import { HorzScaleBehaviorPrice, Price } from '../model/horz-scale-behavior-price/horz-scale-behavior-price';
import { HorzScaleBehaviorTime } from '../model/horz-scale-behavior-time/horz-scale-behavior-time';
import { TimeChartOptions } from '../model/horz-scale-behavior-time/time-based-chart-options';
import { Time } from '../model/horz-scale-behavior-time/types';
import { IHorzScaleBehavior } from '../model/ihorz-scale-behavior';

import { ChartApi } from './chart-api';
import { IChartApi } from './ichart-api';

/**
 * This function is the main entry point of the Lightweight Charting Library.
 *
 * @param container - ID of HTML element or element itself
 * @param options - Any subset of options to be applied at start.
 * @returns An interface to the created chart
 */
export function createChartEx<HorzScaleItem, THorzScaleBehavior extends IHorzScaleBehavior<HorzScaleItem>>(
	container: string | HTMLElement,
	horzScaleBehavior: THorzScaleBehavior,
	options?: DeepPartial<ReturnType<THorzScaleBehavior['options']>>
): IChartApi<HorzScaleItem> {
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

export function createChart(container: string | HTMLElement, options?: DeepPartial<TimeChartOptions>): IChartApi<Time> {
	return createChartEx<Time, HorzScaleBehaviorTime>(
		container,
		new HorzScaleBehaviorTime(),
		HorzScaleBehaviorTime.applyDefaults(options)
	);
}

export function createChartWithPricesAtHorzScale(container: string | HTMLElement, options?: DeepPartial<ChartOptions<Price>>): IChartApi<Price> {
	return createChartEx<Price, HorzScaleBehaviorPrice>(container, new HorzScaleBehaviorPrice(), HorzScaleBehaviorPrice.applyDefaults(options));
}
