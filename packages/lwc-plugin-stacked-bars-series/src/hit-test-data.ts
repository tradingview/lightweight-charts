/** The hit test data this package passes back to its own renderer. */
export interface StackedBarsHitTestData {
	/** Index of the hovered bar within the series data. */
	barIndex: number;
	/** Index of the hovered segment within the bar's `values`. */
	segmentIndex: number;
}

/** Narrows the `hitTestData` handed back to `draw` to this package's own shape. */
export function isHitTestData(
	value: unknown
): value is StackedBarsHitTestData {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as StackedBarsHitTestData).segmentIndex === 'number'
	);
}
