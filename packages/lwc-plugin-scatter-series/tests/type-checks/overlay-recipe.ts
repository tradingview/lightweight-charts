// The README recipe "Draw your own overlays", verbatim (it must compile for
// npm consumers), then used the way the README shows. Keep this copy, the
// README and its JavaScript port in tests/interactions/overlay-recipe.js (which
// checks what it draws) the same. The demo (src/example/region-shading.ts) and the
// x-coordinates interaction test carry a fuller version of it: a class with
// setRegions, to replace the regions in place.
import type { IPrimitivePaneView, ISeriesPrimitive } from 'lightweight-charts';
import type { ScatterSeriesApi } from '@tradingview/lwc-plugin-scatter-series';

/** A rectangle in data units. An open end (`null`) runs to the edge of the pane. */
interface ShadedRegion {
	xMin: number | null;
	xMax: number | null;
	yMin: number | null;
	yMax: number | null;
	color: string;
}

function regionShading(scatter: ScatterSeriesApi, regions: readonly ShadedRegion[]): ISeriesPrimitive<number> {
	let boxes: { left: number; right: number; top: number; bottom: number; color: string }[] = [];
	const view: IPrimitivePaneView = {
		zOrder: () => 'bottom',
		renderer: () => ({
			// Whole device pixels within the pane, so that the edges stay sharp.
			draw: target => target.useBitmapCoordinateSpace(({ context, bitmapSize, horizontalPixelRatio: h, verticalPixelRatio: v }) => {
				for (const box of boxes) {
					const left = Math.max(0, Math.round(box.left * h));
					const right = Math.min(bitmapSize.width, Math.round(box.right * h));
					const top = Math.max(0, Math.round(box.top * v));
					const bottom = Math.min(bitmapSize.height, Math.round(box.bottom * v));
					if (right > left && bottom > top) {
						context.fillStyle = box.color;
						context.fillRect(left, top, right - left, bottom - top);
					}
				}
			}),
		}),
	};
	return {
		attached: ({ requestUpdate }) => requestUpdate(), // attaching does not repaint the chart
		paneViews: () => [view],
		updateAllViews: () => {
			const series = scatter.series();
			boxes = [];
			if (!series.options().visible) {
				return; // the chart draws the primitives of a hidden series too
			}
			// An open Y end runs to the top of the pane, or to the bottom of an inverted scale.
			const up = series.priceScale().options().invertScale ? Infinity : -Infinity;
			const x = (value: number | null, open: number) => (value === null ? open : scatter.xToCoordinate(value));
			const y = (value: number | null, open: number) => (value === null ? open : series.priceToCoordinate(value));
			for (const region of regions) {
				const left = x(region.xMin, -Infinity);
				const right = x(region.xMax, Infinity);
				const low = y(region.yMin, -up);
				const high = y(region.yMax, up);
				if (left !== null && right !== null && low !== null && high !== null) {
					boxes.push({ left, right, top: Math.min(low, high), bottom: Math.max(low, high), color: region.color });
				}
			}
		},
	};
}

// Usage, as in the README: a relative rotation graph's quadrants.
import { createScatterChart, createScatterSeries, type ScatterPoint } from '@tradingview/lwc-plugin-scatter-series';

const chart = createScatterChart(document.createElement('div'), { autoSize: true });
const series = createScatterSeries(chart, { xRange: { min: 96, max: 104 }, yRange: { min: 96, max: 104 } });
series.series().attachPrimitive(regionShading(series, [
	{ xMin: 100, xMax: null, yMin: 100, yMax: null, color: 'rgba(8, 153, 129, 0.1)' }, // leading
	{ xMin: 100, xMax: null, yMin: null, yMax: 100, color: 'rgba(251, 192, 45, 0.12)' }, // weakening
	{ xMin: null, xMax: 100, yMin: null, yMax: 100, color: 'rgba(242, 54, 69, 0.08)' }, // lagging
	{ xMin: null, xMax: 100, yMin: 100, yMax: null, color: 'rgba(41, 98, 255, 0.08)' }, // improving
]));

// The primitive goes with the series, or is detached earlier.
const quadrants = regionShading(series, []);
series.series().attachPrimitive(quadrants);
series.series().detachPrimitive(quadrants);

// A series of a host point type takes it too.
interface Sector extends ScatterPoint {
	sector: string;
}
const sectors = createScatterSeries<Sector>(chart);
sectors.series().attachPrimitive(regionShading(sectors, []));
// @ts-expect-error A region needs all four ends: null for an open one.
regionShading(series, [{ xMin: 100, color: 'red' }]);
