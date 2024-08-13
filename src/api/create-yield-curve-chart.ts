import { DeepPartial } from '../helpers/strict-type-checks';

import {
	YieldCurveChartOptions,
} from '../model/yield-curve-horz-scale-behavior/yield-curve-chart-options';

import { fetchHtmlElement } from './create-chart';
import { IYieldCurveChartApi } from './iyield-chart-api';
import { YieldChartApi } from './yield-chart-api';

/**
 * Creates a yield curve chart with the specified options.
 *
 * A yield curve chart differs from the default chart type
 * in the following ways:
 * - Horizontal scale is linearly spaced, and defined in monthly
 * time duration units
 * - Whitespace is ignored for the crosshair and grid lines
 *
 * @param container - ID of HTML element or element itself
 * @param options - The yield chart options.
 * @returns An interface to the created chart
 */
export function createYieldCurveChart(
	container: string | HTMLElement,
	options?: DeepPartial<YieldCurveChartOptions>
): IYieldCurveChartApi {
	const htmlElement = fetchHtmlElement(container);
	const chartApi = new YieldChartApi(htmlElement, options);
	return chartApi;
}
