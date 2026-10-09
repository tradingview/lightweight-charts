import type { AutoscaleInfo } from 'lightweight-charts';
import { isFiniteNumber } from '@tradingview/lwc-toolkit/numbers';

import type { ScatterBaseline, ScatterRange } from './options';
import type { ScatterRenderOptions } from './renderer';

/** Room added to the radius of a point for its antialiased edge, CSS pixels. */
const ANTIALIAS_ROOM = 1;

/** The ends `yRange` pins: its finite ends, swapped when given in the wrong order. */
export function pinnedYRange(yRange: ScatterRange): ScatterRange {
	const min = isFiniteNumber(yRange.min) ? yRange.min : null;
	const max = isFiniteNumber(yRange.max) ? yRange.max : null;
	return min !== null && max !== null && min > max ? { min: max, max: min } : { min, max };
}

/** What {@link scatterAutoscaleInfo} needs of the model. */
export interface AutoscaledModel {
	/** The horizontal baselines, which the price scale includes. */
	readonly yBaselines: readonly ScatterBaseline[];
	/** The largest size of a visible point, CSS pixels; `0` without one. */
	readonly maxSize: number;
}

/** The range of `base` widened to the baselines, `null` ends when there is neither. */
function baseExtent(base: AutoscaleInfo | null, baselines: readonly ScatterBaseline[]): ScatterRange {
	let min = base?.priceRange?.minValue ?? null;
	let max = base?.priceRange?.maxValue ?? null;
	for (const baseline of baselines) {
		min = min === null ? baseline.value : Math.min(min, baseline.value);
		max = max === null ? baseline.value : Math.max(max, baseline.value);
	}
	return { min, max };
}

/** How far the largest point reaches from its centre, CSS pixels, as it is drawn when hovered; `0` without points. */
function largestReach(
	maxSize: number,
	paint: Pick<ScatterRenderOptions, 'hoveredSizeIncrease' | 'hoveredRingWidth' | 'hoveredRingGap'>
): number {
	if (!(maxSize > 0)) {
		return 0;
	}
	const hoverReach = paint.hoveredSizeIncrease / 2 + (paint.hoveredRingWidth > 0 ? paint.hoveredRingGap + paint.hoveredRingWidth : 0);
	return maxSize / 2 + hoverReach + ANTIALIAS_ROOM;
}

/**
 * The price range of a scatter series: the range of the visible slots
 * (`base`, the chart's own), widened to the horizontal baselines and pinned to
 * `yRange`, with room at an open end for the largest point as it is drawn when
 * hovered (the margins are in pixels). A pinned end gets no room. `base` when
 * there is no range at all.
 */
export function scatterAutoscaleInfo(
	base: AutoscaleInfo | null,
	model: AutoscaledModel,
	yRange: ScatterRange,
	paint: Pick<ScatterRenderOptions, 'hoveredSizeIncrease' | 'hoveredRingWidth' | 'hoveredRingGap'>
): AutoscaleInfo | null {
	const extent = baseExtent(base, model.yBaselines);
	const pinned = pinnedYRange(yRange);
	let min = pinned.min ?? extent.min;
	let max = pinned.max ?? extent.max;
	if (min === null || max === null) {
		return base;
	}
	if (min > max) {
		// A single pinned end beyond the data: the range collapses onto it.
		if (pinned.min !== null && pinned.max === null) {
			max = min;
		} else {
			min = max;
		}
	}
	const radius = largestReach(model.maxSize, paint);
	return {
		priceRange: { minValue: min, maxValue: max },
		margins: {
			above: pinned.max !== null ? 0 : Math.max(radius, base?.margins?.above ?? 0),
			below: pinned.min !== null ? 0 : Math.max(radius, base?.margins?.below ?? 0),
		},
	};
}
