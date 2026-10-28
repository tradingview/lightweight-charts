import type { HandleScaleOptions, HandleScrollOptions } from 'lightweight-charts';

/** The chart options {@link canUserMoveTimeScale} reads. */
export interface TimeScaleInteractionOptions {
	/** `handleScroll` of the chart options: all flags at once, or one by one. */
	readonly handleScroll: HandleScrollOptions | boolean;
	/** `handleScale` of the chart options: all flags at once, or one by one. */
	readonly handleScale: HandleScaleOptions | boolean;
}

/**
 * The flags of `handleScroll` and `handleScale` that let the user scroll or
 * zoom the time scale: those `TimeScale._isAllScalingAndScrollingDisabled`
 * in the library's `src/model/time-scale.ts` checks. For
 * `axisPressedMouseMove` and `axisDoubleClickReset`, which can be objects,
 * it is their `time` flag that counts.
 *
 * The library keeps the rule private; this copy is pinned to its source by
 * a unit test of the toolkit, which fails when the two lists differ.
 */
export const TIME_SCALE_MOVE_FLAGS: {
	readonly handleScroll: readonly (keyof HandleScrollOptions)[];
	readonly handleScale: readonly (keyof HandleScaleOptions)[];
} = {
	handleScroll: ['mouseWheel', 'pressedMouseMove', 'horzTouchDrag', 'vertTouchDrag'],
	handleScale: ['mouseWheel', 'pinch', 'axisPressedMouseMove', 'axisDoubleClickReset'],
};

function anyFlagOn(value: unknown, keys: readonly string[]): boolean {
	if (typeof value === 'boolean') {
		return value;
	}
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	const flags = value as Record<string, unknown>;
	return keys.some((key: string) => {
		const flag = flags[key];
		return typeof flag === 'object' && flag !== null ? (flag as { time?: unknown }).time === true : flag === true;
	});
}

/**
 * Whether the user can scroll or zoom the time scale with the chart options
 * as they are (pass `chart.options()`): at least one of
 * {@link TIME_SCALE_MOVE_FLAGS} is on. While none is, the chart treats both
 * ends of the time scale as fixed — it moves the first and last tick mark
 * labels inside the plot as if `fixLeftEdge` and `fixRightEdge` were set — and
 * only the API moves the visible range.
 */
export function canUserMoveTimeScale(options: TimeScaleInteractionOptions): boolean {
	return anyFlagOn(options.handleScroll, TIME_SCALE_MOVE_FLAGS.handleScroll) ||
		anyFlagOn(options.handleScale, TIME_SCALE_MOVE_FLAGS.handleScale);
}
