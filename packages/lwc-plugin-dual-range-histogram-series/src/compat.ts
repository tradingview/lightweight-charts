import { CustomData, PaneRendererCustomData } from 'lightweight-charts';

/**
 * The shape the library expects back from `ICustomSeriesPaneRenderer.hitTest`.
 * Declared here rather than imported because the library only exports
 * `CustomSeriesHitTestResult` from v5.1 onwards, while this package supports
 * v5.0. A host that predates it simply never calls `hitTest`.
 */
export interface CustomSeriesHitTestResult {
	/** Distance from the cursor to the hit geometry, in CSS pixels. */
	distance: number;
	/** Identifier of the hovered object, reported through the crosshair. */
	objectId?: string;
	/** Geometric classification of the hit. */
	type?: 'point' | 'line' | 'range' | 'custom';
	/** Cursor to show over the hit. */
	cursorStyle?: string;
	/** Renderer-specific data handed back to `draw` while hovered. */
	hitTestData?: unknown;
}

/**
 * The part of the library's `CustomConflationContext` (v5.1 and later) a
 * reducer in this package reads.
 */
export interface ConflationContext<TData> {
	/** The original data item. */
	readonly data: TData;
}

/**
 * Bar spacing to size a column against: the space up to the next data point,
 * which is wider than `barSpacing` once the chart conflates points into one.
 * `conflationFactor` was added in v5.1 and is absent on older hosts.
 */
export function effectiveBarSpacing<
	HorzScaleItem,
	TData extends CustomData<HorzScaleItem>,
>(data: PaneRendererCustomData<HorzScaleItem, TData>): number {
	const factor = (data as { conflationFactor?: number }).conflationFactor;
	return data.barSpacing * (factor !== undefined && factor > 0 ? factor : 1);
}
