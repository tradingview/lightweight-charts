// The README recipe "Draw your own overlays", as a page would write it: only
// the import of the scatter series type differs (the package, in the README).
import type { IPrimitivePaneView, ISeriesPrimitive, SeriesAttachedParameter } from 'lightweight-charts';
import type { ScatterSeriesApi } from '../scatter-series-api';

/** A rectangle in data units. An open end (`null`) runs to the edge of the pane. */
export interface ShadedRegion {
	xMin: number | null;
	xMax: number | null;
	yMin: number | null;
	yMax: number | null;
	color: string;
}

/** Shades rectangles of a scatter plot, under the grid and the points. */
export class RegionShading implements ISeriesPrimitive<number> {
	private readonly _scatter: ScatterSeriesApi;
	private _regions: readonly ShadedRegion[];
	private _boxes: { left: number; right: number; top: number; bottom: number; color: string }[] = [];
	private _requestUpdate: (() => void) | null = null;
	private readonly _views: readonly IPrimitivePaneView[] = [{
		zOrder: () => 'bottom',
		renderer: () => ({
			draw: target => target.useBitmapCoordinateSpace(({ context, bitmapSize, horizontalPixelRatio, verticalPixelRatio }) => {
				for (const box of this._boxes) {
					// Whole device pixels, within the pane.
					const left = Math.max(0, Math.round(box.left * horizontalPixelRatio));
					const right = Math.min(bitmapSize.width, Math.round(box.right * horizontalPixelRatio));
					const top = Math.max(0, Math.round(box.top * verticalPixelRatio));
					const bottom = Math.min(bitmapSize.height, Math.round(box.bottom * verticalPixelRatio));
					if (right > left && bottom > top) {
						context.fillStyle = box.color;
						context.fillRect(left, top, right - left, bottom - top);
					}
				}
			}),
		}),
	}];

	public constructor(scatter: ScatterSeriesApi, regions: readonly ShadedRegion[]) {
		this._scatter = scatter;
		this._regions = regions;
	}

	public attached({ requestUpdate }: SeriesAttachedParameter<number>): void {
		this._requestUpdate = requestUpdate;
		// Attaching does not repaint the chart: ask for the first paint.
		requestUpdate();
	}

	public detached(): void {
		this._requestUpdate = null;
	}

	/** Replaces the regions; the chart paints them on its next frame. */
	public setRegions(regions: readonly ShadedRegion[]): void {
		this._regions = regions;
		this._requestUpdate?.();
	}

	/** Called by the chart before every paint: convert with the scales of that paint. */
	public updateAllViews(): void {
		const series = this._scatter.series();
		this._boxes = [];
		// The chart draws the primitives of a hidden series too: draw nothing then.
		if (!series.options().visible) {
			return;
		}
		// An open Y end runs to the top of the pane, or to the bottom of an inverted scale.
		const up = series.priceScale().options().invertScale ? Infinity : -Infinity;
		const x = (value: number | null, open: number) => (value === null ? open : this._scatter.xToCoordinate(value));
		const y = (value: number | null, open: number) => (value === null ? open : series.priceToCoordinate(value));
		for (const region of this._regions) {
			const left = x(region.xMin, -Infinity);
			const right = x(region.xMax, Infinity);
			const low = y(region.yMin, -up);
			const high = y(region.yMax, up);
			if (left !== null && right !== null && low !== null && high !== null) {
				this._boxes.push({ left, right, top: Math.min(low, high), bottom: Math.max(low, high), color: region.color });
			}
		}
	}

	public paneViews(): readonly IPrimitivePaneView[] {
		return this._views;
	}
}
