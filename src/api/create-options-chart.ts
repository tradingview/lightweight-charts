import { DeepPartial } from '../helpers/strict-type-checks';

import { HorzScaleBehaviorPrice } from '../model/horz-scale-behavior-price/horz-scale-behaviour-price';
import { PriceChartOptions } from '../model/horz-scale-behavior-price/options';

import { createChartEx } from './create-chart';
import { IChartApiBase } from './ichart-api';

/**
 * Creates an 'options' chart with price values on the horizontal scale.
 *
 * This function is used to create a specialized chart type where the horizontal scale
 * represents price values instead of time. It's particularly useful for visualizing
 * option chains, price distributions, or any data where price is the primary x-axis metric.
 *
 * @param container - The DOM element or its id where the chart will be rendered.
 * @param options - Optional configuration options for the price chart.
 * @returns An instance of IChartApiBase configured for price-based horizontal scaling.
 */
export function createOptionsChart(
	container: string | HTMLElement,
	options?: DeepPartial<PriceChartOptions>
): IChartApiBase<number> {
	return createChartEx(container, new HorzScaleBehaviorPrice(), options);
}
