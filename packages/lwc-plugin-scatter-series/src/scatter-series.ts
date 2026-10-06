import type { IChartApiBase } from 'lightweight-charts';

import type { ScatterPoint } from './data';
import type { ScatterSeriesPartialOptions } from './options';
import { ScatterSeriesApi, ScatterSeriesApiImpl } from './scatter-series-api';

export type { ScatterGroupInfo, ScatterPoint, ScatterPointInfo, ScatterSizeMapping, ScatterSlotData } from './data';
export type {
	ScatterBaseline,
	ScatterGroup,
	ScatterPlotBorder,
	ScatterRange,
	ScatterReplacedOptionKeys,
	ScatterSeriesOptions,
	ScatterSeriesPartialOptions,
	ScatterShape,
	ScatterSizeLimits,
	ScatterSizeRange,
	ScatterSizeScale,
} from './options';
export { DEFAULT_SCATTER_PALETTE, defaultOptions } from './options';
export { SCATTER_MAX_POINT_SIZE, SCATTER_MIN_POINT_SIZE } from './size';
export type {
	ScatterHoveredPointHandler,
	ScatterSeriesApi,
	ScatterUnderlyingSeries,
	ScatterXDomain,
} from './scatter-series-api';
export { ScatterHorzScaleBehavior } from './horz-scale-behavior';
export { createScatterChart, scatterChartDefaults } from './chart';
export type { ScatterChartOptions } from './chart';

/**
 * Adds a scatter series to a chart created with `createScatterChart` (or with
 * `createChartEx` and a `ScatterHorzScaleBehavior`). One scatter series holds
 * the whole dataset, every group included; a chart takes one, and adding a
 * second throws until the first is removed.
 *
 * @param chart - The scatter chart.
 * @param options - Series options, merged over {@link defaultOptions}.
 * @param paneIndex - Pane to add the series to.
 * @returns The scatter series API.
 */
export function createScatterSeries<TPoint extends ScatterPoint = ScatterPoint>(
	chart: IChartApiBase<number>,
	options: ScatterSeriesPartialOptions = {},
	paneIndex: number = 0
): ScatterSeriesApi<TPoint> {
	return new ScatterSeriesApiImpl<TPoint>(chart, options, paneIndex);
}
