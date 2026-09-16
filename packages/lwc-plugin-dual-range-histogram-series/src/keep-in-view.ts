import { IChartApiBase, IPriceScaleApi, ISeriesPrimitive, Time } from 'lightweight-charts';

/** The part of a series API {@link keepPixelSeriesInView} needs. */
export interface PixelHeightSeriesApi<HorzScaleItem = Time> {
	options(): { maxHeight: number };
	priceScale(): IPriceScaleApi;
	attachPrimitive(primitive: ISeriesPrimitive<HorzScaleItem>): void;
	detachPrimitive(primitive: ISeriesPrimitive<HorzScaleItem>): void;
}

/**
 * Reserves room on the price scale for a series drawn at a fixed pixel height.
 *
 * In `pixels` scale mode the series does not report its values to the price
 * scale, so autoscaling knows nothing about the columns and they are clipped
 * whenever the base line is close to the top or bottom of the pane. This sets
 * the scale margins so that half of the histogram always fits above and below
 * the base line, and keeps them correct as panes are resized or the series moves to another pane.
 *
 * @param chart - the chart the series belongs to.
 * @param series - the series to reserve room for.
 * @param maxHeight - height in CSS pixels to reserve room for. Defaults to the
 * series' own `maxHeight` option, re-read on every resize.
 * @returns a function which detaches the sizing primitive. Call it before the chart
 * is removed.
 */
export function keepPixelSeriesInView<HorzScaleItem = Time>(
	chart: IChartApiBase<HorzScaleItem>,
	series: PixelHeightSeriesApi<HorzScaleItem>,
	maxHeight?: number
): () => void {
	let disposed = false;
	let queued = false;
	const apply = (): void => {
		if (disposed) { return; }
		// The series may have been removed since an update was queued.
		const pane = chart.panes().find(candidate => candidate.getSeries().some(item => Object.is(item, series)));
		const height = pane?.getHeight() ?? 0;
		if (height <= 0) { return; }
		const seriesHeight = maxHeight ?? series.options().maxHeight;
		const margin = Math.max(0, Math.min(0.3, seriesHeight / 2 / height));
		const scale = series.priceScale();
		const current = scale.options().scaleMargins;
		if (current.top !== margin || current.bottom !== margin) {
			scale.applyOptions({ scaleMargins: { top: margin, bottom: margin } });
		}
	};
	// Series primitive updates follow pane-only resizes and moves, which a
	// ResizeObserver on the outer chart element cannot detect. Defer writes
	// until the host finishes updating its views to avoid reentrant layout.
	const primitive: ISeriesPrimitive<HorzScaleItem> = {
		updateAllViews: () => {
			if (disposed || queued) { return; }
			queued = true;
			queueMicrotask(() => {
				queued = false;
				apply();
			});
		},
		detached: () => { disposed = true; },
	};
	series.attachPrimitive(primitive);
	apply();
	return () => {
		if (disposed) { return; }
		disposed = true;
		series.detachPrimitive(primitive);
	};
}
