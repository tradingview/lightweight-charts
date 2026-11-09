import { PriceToCoordinateConverter, Time } from 'lightweight-charts';
import { beginMarker, markerDistance } from '@tradingview/lwc-toolkit/canvas/markers';
import { CustomSeriesHitTestResult } from '@tradingview/lwc-toolkit/custom-series/compat';
import { nearestBar, nearestVerticalRange, seriesHitTestTolerance } from '@tradingview/lwc-toolkit/custom-series/hit-test';
import {
	BitmapCoordinatesRenderingScope,
	CustomSeriesDrawArgs,
	CustomSeriesRendererBase,
} from '@tradingview/lwc-toolkit/custom-series/renderer-base';
import { forEachVisibleBar } from '@tradingview/lwc-toolkit/custom-series/visible-bars';
import { positionsBox, positionsLine } from '@tradingview/lwc-toolkit/dimensions/positions';

import { LollipopData } from './data';
import { lollipopBase, lollipopSizes } from './geometry';
import { LollipopSeriesOptions } from './options';

export class LollipopSeriesRenderer<
	HorzScaleItem = Time,
	TData extends LollipopData<HorzScaleItem> = LollipopData<HorzScaleItem>
> extends CustomSeriesRendererBase<HorzScaleItem, TData, LollipopSeriesOptions> {
	/**
	 * Reports the lollipop under the cursor, within the series'
	 * `hitTestTolerance`, so that the chart can report it through the crosshair
	 * as `hoveredObjectId`. Called by the library from v5.2 onwards; older hosts
	 * never call it.
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
		const baseY = priceToCoordinate(lollipopBase(options));
		if (baseY === null) {
			return null;
		}
		// The series has no conflation reducer, so the chart never conflates it
		// and every bar is one bar spacing wide.
		const { lineWidth, dotRadius } = lollipopSizes(options, data.barSpacing);
		const tolerance = seriesHitTestTolerance(options);
		const valueY = (bar: { originalData: TData }) => priceToCoordinate(bar.originalData.value);
		const stem = nearestVerticalRange(data, x, y, lineWidth / 2, tolerance, bar => {
			const top = valueY(bar);
			return top === null ? null : [baseY, top];
		});
		// Every dot within reach is measured to its circle: where neighboring dots
		// touch, the nearest square around a dot is not always the nearest dot.
		const dot = dotRadius > 0
			? nearestBar(data, x, dotRadius + tolerance, tolerance, bar => {
				const center = valueY(bar);
				return center === null ? null : markerDistance('circle', x - bar.x, y - center, dotRadius);
			})
			: null;
		// The chart prefers a point hit to any other whatever the distance, so
		// only the dot is one: a stem is a range, like a column, so a candle body
		// the pointer is inside wins over a stem the pointer is only near. The
		// dot wins a tie with a stem.
		if (dot !== null && (stem === null || dot.distance <= stem.distance)) {
			return { distance: dot.distance, objectId: `bar-${dot.index}`, type: 'point' };
		}
		if (stem !== null) {
			return { distance: stem.distance, objectId: `bar-${stem.index}`, type: 'range' };
		}
		return null;
	}

	protected drawImpl(
		scope: BitmapCoordinatesRenderingScope,
		{ data, options, priceToCoordinate }: CustomSeriesDrawArgs<HorzScaleItem, TData, LollipopSeriesOptions>
	): void {
		const baseY = priceToCoordinate(lollipopBase(options));
		if (baseY === null) {
			return;
		}
		const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = scope;
		const { lineWidth, dotRadius } = lollipopSizes(options, data.barSpacing);
		// At least one device pixel, so that stems capped by a narrow bar spacing
		// thin out instead of disappearing.
		const stemWidth = Math.max(1, Math.round(lineWidth * horizontalPixelRatio));
		forEachVisibleBar(data, bar => {
			const valueY = priceToCoordinate(bar.originalData.value);
			if (valueY === null) {
				return;
			}
			ctx.fillStyle = bar.barColor;
			const stemX = positionsLine(bar.x, horizontalPixelRatio, stemWidth, true);
			const stemY = positionsBox(baseY, valueY, verticalPixelRatio);
			ctx.fillRect(stemX.position, stemY.position, stemX.length, stemY.length);
			if (dotRadius > 0) {
				// Centered on the stem as drawn, which is snapped to whole bitmap
				// pixels.
				beginMarker(ctx, 'circle', stemX.position + stemX.length / 2, valueY * verticalPixelRatio, dotRadius * horizontalPixelRatio);
				ctx.fill();
			}
		});
	}
}
