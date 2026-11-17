/*
 Runtime checks for chart and series methods that the library added after
 5.0.0. A plugin whose `lightweight-charts` floor is 5.0 cannot call such a
 method directly: the 5.0 typings do not declare it, so the plugin stops
 compiling against its floor, and a 5.0 host does not have it, so the call
 throws. Each check tests for one method and narrows the value to a type that
 has it, so the call inside stays a normal typed call. What to do without the
 method is the caller's decision.

 The checks take any object rather than `ISeriesApi<SeriesType, H>`, which
 fails to infer the horizontal scale item of a custom series.
 */

/**
 * Whether `series` can be reordered with `setSeriesOrder`, which
 * lightweight-charts added in 5.0.6. On older versions a series keeps the
 * order it was added in.
 *
 * ```ts
 * if (supportsSeriesOrder(series)) {
 * 	series.setSeriesOrder(0);
 * }
 * ```
 */
export function supportsSeriesOrder<S extends object>(series: S): series is S & { setSeriesOrder(order: number): void } {
	return typeof (series as { setSeriesOrder?: unknown }).setSeriesOrder === 'function';
}
