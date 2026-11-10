/** The hit test data this package passes back to its own renderer. */
export interface StackedAreaHitTestData {
	/** Index of the hovered band within the point's `values`. */
	bandIndex: number;
}

/** Narrows the `hitTestData` handed back to `draw` to this package's own shape. */
export function isHitTestData(value: unknown): value is StackedAreaHitTestData {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as StackedAreaHitTestData).bandIndex === 'number'
	);
}
