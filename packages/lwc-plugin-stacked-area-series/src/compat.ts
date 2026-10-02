/**
 * Structural copies of library types that only exist from `lightweight-charts`
 * 5.1 onwards. Declaring them here keeps the package compiling — and running —
 * against its declared 5.0.0 floor, while the members which use them still line
 * up with the newer `ICustomSeriesPaneRenderer` and `ICustomSeriesPaneView`.
 */

/** Mirrors the library's `CustomSeriesHitTestResult`. */
export interface StackedAreaHitTestResult {
	/** Distance from the cursor to the hit geometry, in CSS pixels. */
	distance: number;
	/** Identifier of the hovered object: here, the index of the band. */
	objectId?: string;
	/** Geometric classification of the hit. */
	type?: 'point' | 'line' | 'range' | 'custom';
	/** Cursor override while the object is hovered. */
	cursorStyle?: string;
	/** Renderer data passed back into `draw` while the object is hovered. */
	hitTestData?: unknown;
}

/** Mirrors the library's `CustomConflationContext`. */
export interface StackedAreaConflationContext<TData> {
	/** The original data item. */
	readonly data: TData;
}

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
