/**
 * Structural copies of custom-series types that the library only exports from
 * a later version than a plugin's `lightweight-charts` floor. A plugin that
 * declares its renderer's `hitTest` or its view's `conflationReducer` with
 * these keeps compiling, and running, against 5.0, where the chart never
 * calls either; on newer hosts they line up with the library's own types.
 *
 * Types only: importing this module adds nothing to a bundle.
 */

/**
 * What `ICustomSeriesPaneRenderer.hitTest` returns. Mirrors the library's
 * `CustomSeriesHitTestResult`, exported from 5.2, the first version that
 * calls `hitTest`.
 */
export interface CustomSeriesHitTestResult {
	/** Distance from the cursor to the hit geometry, in CSS pixels. */
	distance: number;
	/** Identifier of the hovered object, reported through the crosshair. */
	objectId?: string;
	/**
	 * Geometric classification of the hit, which the chart uses to rank it
	 * against other hits under the cursor: a `'point'` beats the rest.
	 */
	type?: 'point' | 'line' | 'range' | 'custom';
	/** Cursor to show over the hit. */
	cursorStyle?: string;
	/**
	 * Renderer data handed back to `draw` while the object is hovered. The
	 * chart compares it by reference, so return the same object while the
	 * same item stays hovered; see `createHitTestDataCache` in
	 * `custom-series/hit-test`.
	 */
	hitTestData?: unknown;
}

/**
 * The part of the library's `CustomConflationContext` (5.1 and later) that a
 * `conflationReducer` usually reads: the data item being merged.
 */
export interface ConflationContext<TData> {
	/** The original data item. */
	readonly data: TData;
}
