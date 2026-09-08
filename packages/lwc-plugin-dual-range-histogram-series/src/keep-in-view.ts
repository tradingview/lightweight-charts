import { IChartApiBase, IPriceScaleApi, Time } from 'lightweight-charts';

/** The part of a series API {@link keepPixelSeriesInView} needs. */
export interface PixelHeightSeriesApi {
	options(): { maxHeight: number };
	priceScale(): IPriceScaleApi;
}

/**
 * Reserves room on the price scale for a series drawn at a fixed pixel height.
 *
 * In `pixels` scale mode the series does not report its values to the price
 * scale, so autoscaling knows nothing about the columns and they are clipped
 * whenever the base line is close to the top or bottom of the pane. This sets
 * the scale margins so that half of the histogram always fits above and below
 * the base line, and keeps them correct as the chart is resized.
 *
 * @param chart - the chart the series belongs to.
 * @param series - the series to reserve room for.
 * @param maxHeight - height in CSS pixels to reserve room for. Defaults to the
 * series' own `maxHeight` option, re-read on every resize.
 * @returns a function which stops observing the chart. Call it before the chart
 * is removed.
 */
export function keepPixelSeriesInView<HorzScaleItem = Time>(
	chart: IChartApiBase<HorzScaleItem>,
	series: PixelHeightSeriesApi,
	maxHeight?: number
): () => void {
	const apply = (): void => {
		const height = chart.paneSize().height;
		if (height <= 0) {
			return;
		}
		const seriesHeight = maxHeight ?? series.options().maxHeight;
		const margin = Math.min(0.3, seriesHeight / 2 / height);
		series.priceScale().applyOptions({
			scaleMargins: { top: margin, bottom: margin },
		});
	};

	apply();
	if (typeof ResizeObserver === 'undefined') {
		return () => {};
	}
	const observer = new ResizeObserver(() => apply());
	observer.observe(chart.chartElement());
	return () => observer.disconnect();
}
