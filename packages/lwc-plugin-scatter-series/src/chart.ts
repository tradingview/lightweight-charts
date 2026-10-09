import {
	ChartOptionsImpl,
	CrosshairMode,
	DeepPartial,
	IChartApiBase,
	LineStyle,
	createChartEx,
} from 'lightweight-charts';
import { freezeOptions, mergeOptions } from '@tradingview/lwc-toolkit/options/merge';

import { ScatterHorzScaleBehavior } from './horz-scale-behavior';

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
 *   X domain, and they are what makes the chart move the first and last X
 *   labels inside the plot: at a free edge it centres them on their values,
 *   and the series keeps the ends of the domain far enough in for them. With
 *   both switched off, the chart treats the edges as fixed anyway;
 * - small price scale margins: the series adds the radius of its largest
 *   point to them, so bubbles at the extremes are not clipped.
 *
 * Frozen: copy it to change it. Scrolling and zooming are switched off flag by
 * flag, as the chart stores them, so that the object can be passed to
 * `createChartEx` as it is (the chart rewrites a `true` or `false` given for
 * all of them into the flags, in the object it is given); a host passing some
 * of the flags to `createScatterChart` switches on just those.
 */
export const scatterChartDefaults: DeepPartial<ScatterChartOptions> = freezeOptions<DeepPartial<ScatterChartOptions>>({
	handleScroll: {
		mouseWheel: false,
		pressedMouseMove: false,
		horzTouchDrag: false,
		vertTouchDrag: false,
	},
	handleScale: {
		axisPressedMouseMove: { time: false, price: false },
		axisDoubleClickReset: { time: false, price: false },
		mouseWheel: false,
		pinch: false,
	},
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
});

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
