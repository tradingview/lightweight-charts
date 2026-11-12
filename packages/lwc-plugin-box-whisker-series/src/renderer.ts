import { CustomBarItemData, PriceToCoordinateConverter, Time } from 'lightweight-charts';
import { traceMarker } from '@tradingview/lwc-toolkit/canvas/markers';
import { CustomSeriesHitTestResult } from '@tradingview/lwc-toolkit/custom-series/compat';
import { nearestBar, seriesHitTestTolerance } from '@tradingview/lwc-toolkit/custom-series/hit-test';
import {
	BitmapCoordinatesRenderingScope,
	CustomSeriesDrawArgs,
	CustomSeriesRendererBase,
} from '@tradingview/lwc-toolkit/custom-series/renderer-base';
import { forEachVisibleBar } from '@tradingview/lwc-toolkit/custom-series/visible-bars';
import { positionsBox, positionsLine } from '@tradingview/lwc-toolkit/dimensions/positions';

import { BoxWhiskerData } from './data';
import { BoxWhiskerHit, boxWhiskerHit, boxWhiskerWidths, fiveNumbers } from './geometry';
import { BoxWhiskerSeriesOptions } from './options';

/**
 * The five numbers as y coordinates, or `null` while the chart cannot convert
 * prices yet: the series has no first value.
 */
function coordinates(numbers: readonly number[], priceToCoordinate: PriceToCoordinateConverter): number[] | null {
	const ys: number[] = [];
	for (const price of numbers) {
		const y = priceToCoordinate(price);
		if (y === null) {
			return null;
		}
		ys.push(y);
	}
	return ys;
}

export class BoxWhiskerSeriesRenderer<
	HorzScaleItem = Time,
	TData extends BoxWhiskerData<HorzScaleItem> = BoxWhiskerData<HorzScaleItem>
> extends CustomSeriesRendererBase<HorzScaleItem, TData, BoxWhiskerSeriesOptions> {
	/**
	 * Reports the part of the box plot under the cursor, within the series'
	 * `hitTestTolerance`: `objectId` is `'box-<point>'`, `'median-<point>'`,
	 * `'whisker-<point>'` or `'outlier-<point>-<index>'`, where `<point>` is the
	 * point's position in `series.data()` and `<index>` the index into its
	 * `outliers`. Called by the library from v5.2 onwards; older hosts never
	 * call it.
	 */
	public hitTest(
		x: number,
		y: number,
		priceToCoordinate: PriceToCoordinateConverter
	): CustomSeriesHitTestResult | null {
		const data = this.data;
		const options = this.options;
		if (data === null || options === null) {
			return null;
		}
		// The chart hands a hit test media coordinates only, so the widths are
		// taken at a pixel ratio of 1. The series has no conflation reducer, so
		// the chart never conflates it and every bar is one bar spacing wide.
		const widths = boxWhiskerWidths(data.barSpacing, 1, 1);
		const tolerance = seriesHitTestTolerance(options);
		const hitFor = (bar: CustomBarItemData<HorzScaleItem, TData>): BoxWhiskerHit | null => {
			// The chart only hands over points that are not whitespace, so all
			// five numbers are finite.
			const point = bar.originalData;
			const ys = coordinates(fiveNumbers(point), priceToCoordinate);
			if (ys === null) {
				return null;
			}
			const outlierYs = (point.outliers ?? []).map((value: number) => (Number.isFinite(value) ? priceToCoordinate(value) : null) ?? Number.NaN);
			return boxWhiskerHit(
				{
					x: bar.x,
					ys,
					outlierYs,
					bodyWidth: widths.body,
					capWidth: widths.cap,
					medianWidth: widths.median,
					whiskerWidth: widths.whisker,
					lineWidth: widths.line,
					outlierRadius: widths.outlierRadius,
				},
				x,
				y
			);
		};
		const reach = Math.max(widths.median, widths.outlierRadius * 2) / 2 + tolerance;
		// The part hit on each bar measured, so the winner's is not worked out
		// again.
		const parts = new Map<number, BoxWhiskerHit>();
		const hit = nearestBar(data, x, reach, tolerance, (bar, index) => {
			const nearest = hitFor(bar);
			if (nearest !== null) {
				parts.set(index, nearest);
			}
			return nearest?.distance ?? null;
		});
		const part = hit === null ? undefined : parts.get(hit.index);
		if (hit === null || part === undefined) {
			return null;
		}
		const isOutlier = part.part.startsWith('outlier-');
		return {
			distance: hit.distance,
			objectId: isOutlier ? `outlier-${hit.index}-${part.part.slice('outlier-'.length)}` : `${part.part}-${hit.index}`,
			// The chart prefers a point hit to any other whatever the distance, so
			// only an outlier dot is one; the box and the lines are ranges.
			type: isOutlier ? 'point' : 'range',
		};
	}

	protected drawImpl(
		scope: BitmapCoordinatesRenderingScope,
		{ data, options, priceToCoordinate }: CustomSeriesDrawArgs<HorzScaleItem, TData, BoxWhiskerSeriesOptions>
	): void {
		const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = scope;
		const widths = boxWhiskerWidths(data.barSpacing, horizontalPixelRatio, verticalPixelRatio);
		forEachVisibleBar(data, bar => {
			const point = bar.originalData;
			const ys = coordinates(fiveNumbers(point), priceToCoordinate);
			if (ys === null) {
				return;
			}
			const [y0, y1, y2, y3, y4] = ys;
			const whiskerX = positionsLine(bar.x, horizontalPixelRatio, widths.whisker, true);
			const centerX = whiskerX.position + whiskerX.length / 2;

			const outliers = point.outliers;
			if (outliers !== undefined && outliers !== null && outliers.length > 0) {
				// A point's outliers share a color, so they are filled as one path.
				ctx.fillStyle = point.outlierColor ?? options.outlierColor;
				ctx.beginPath();
				for (const outlier of outliers) {
					const outlierY = Number.isFinite(outlier) ? priceToCoordinate(outlier) : null;
					if (outlierY !== null) {
						traceMarker(ctx, 'circle', centerX, outlierY * verticalPixelRatio, widths.outlierRadius);
					}
				}
				ctx.fill();
			}

			// The whisker runs from each end to the box; it is not drawn through
			// the box itself.
			ctx.fillStyle = point.whiskerColor ?? options.whiskerColor;
			const lowerWhisker = positionsBox(y0, y1, verticalPixelRatio);
			ctx.fillRect(whiskerX.position, lowerWhisker.position, whiskerX.length, lowerWhisker.length);
			const upperWhisker = positionsBox(y3, y4, verticalPixelRatio);
			ctx.fillRect(whiskerX.position, upperWhisker.position, whiskerX.length, upperWhisker.length);
			const capX = positionsLine(bar.x, horizontalPixelRatio, widths.cap, true);
			const lowerCap = positionsLine(y0, verticalPixelRatio, widths.line, true);
			ctx.fillRect(capX.position, lowerCap.position, capX.length, lowerCap.length);
			const upperCap = positionsLine(y4, verticalPixelRatio, widths.line, true);
			ctx.fillRect(capX.position, upperCap.position, capX.length, upperCap.length);

			const bodyX = positionsLine(bar.x, horizontalPixelRatio, widths.body, true);
			const lower = positionsBox(y1, y2, verticalPixelRatio);
			ctx.fillStyle = point.lowerBoxColor ?? options.lowerBoxColor;
			ctx.fillRect(bodyX.position, lower.position, bodyX.length, lower.length);
			const upper = positionsBox(y2, y3, verticalPixelRatio);
			ctx.fillStyle = point.upperBoxColor ?? options.upperBoxColor;
			ctx.fillRect(bodyX.position, upper.position, bodyX.length, upper.length);

			const medianX = positionsLine(bar.x, horizontalPixelRatio, widths.median, true);
			const medianY = positionsLine(y2, verticalPixelRatio, widths.line, true);
			ctx.fillStyle = point.medianColor ?? options.medianColor;
			ctx.fillRect(medianX.position, medianY.position, medianX.length, medianY.length);
		});
	}
}
