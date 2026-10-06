import {
	ChartOptionsImpl,
	CrosshairMode,
	DeepPartial,
	IChartApiBase,
	LineStyle,
	createChartEx,
} from 'lightweight-charts';

import { ScatterHorzScaleBehavior } from './horz-scale-behavior';
import { mergeOptions } from './merge';

/** Options of a scatter chart: the chart options with numbers on the horizontal scale. */
export type ScatterChartOptions = ChartOptionsImpl<number>;

/**
 * The defaults `createScatterChart` applies on top of the library's:
 *
 * - no scrolling or zooming, so the X axis always spans the domain edge to
 *   edge (both can be switched back on);
 * - the crosshair hidden (`CrosshairMode.Hidden`). Hover and hit testing keep
 *   working: the mode only stops the crosshair from being drawn;
 * - dotted grid lines, no axis borders, no bold axis labels;
 * - `timeScale.uniformDistribution`, which keeps the X labels evenly spaced at
 *   every width, and `lockVisibleTimeRangeOnResize`, which keeps the domain in
 *   view while the series refits it after a resize;
 * - fixed edges (`timeScale.fixLeftEdge` and `fixRightEdge`). With scrolling or
 *   zooming switched on they stop the user from panning or zooming out past the
 *   X domain, and they are what makes the chart keep the first and last X
 *   labels inside the plot: at a free edge it centres them on the edge, half
 *   cut off. With both switched off, the chart treats the edges as fixed anyway;
 * - small price scale margins: the series adds the radius of its largest
 *   point to them, so bubbles at the extremes are not clipped.
 */
export const scatterChartDefaults: DeepPartial<ScatterChartOptions> = {
	handleScroll: false,
	handleScale: false,
	crosshair: {
		mode: CrosshairMode.Hidden,
	},
	grid: {
		vertLines: { style: LineStyle.Dotted },
		horzLines: { style: LineStyle.Dotted },
	},
	timeScale: {
		borderVisible: false,
		allowBoldLabels: false,
		uniformDistribution: true,
		lockVisibleTimeRangeOnResize: true,
		fixLeftEdge: true,
		fixRightEdge: true,
		shiftVisibleRangeOnNewBar: false,
		rightOffset: 0,
		// The series sets the spacing itself; never let the chart clamp it.
		minBarSpacing: 0.001,
	},
	rightPriceScale: {
		borderVisible: false,
		scaleMargins: { top: 0.05, bottom: 0.05 },
	},
	leftPriceScale: {
		borderVisible: false,
		scaleMargins: { top: 0.05, bottom: 0.05 },
	},
};

/**
 * Creates a chart whose horizontal scale is a numeric X axis, for a scatter
 * series. The options are merged over {@link scatterChartDefaults}.
 *
 * @param container - ID of an HTML element, or the element itself.
 * @param options - Chart options to apply over the scatter defaults.
 */
export function createScatterChart(
	container: string | HTMLElement,
	options: DeepPartial<ScatterChartOptions> = {}
): IChartApiBase<number> {
	return createChartEx<number, ScatterHorzScaleBehavior>(
		container,
		new ScatterHorzScaleBehavior(),
		mergeOptions(scatterChartDefaults, options)
	);
}
