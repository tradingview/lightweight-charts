import { CustomData, Time } from 'lightweight-charts';

/** One cell of a heatmap column: a price range and the amount that colors it. */
export interface HeatmapCell {
	/** Price of one edge of the cell, usually the lower one. */
	low: number;
	/** Price of the other edge of the cell, usually the upper one. */
	high: number;
	/** Amount for the cell, turned into a color by the `cellShader` option. */
	amount: number;
}

/**
 * Heatmap series data: a column of cells per time point.
 */
export interface HeatmapData<HorzScaleItem = Time> extends CustomData<HorzScaleItem> {
	/**
	 * The cells of the column, in any order. A `null` cell, as a JSON feed may
	 * send, is skipped.
	 */
	cells: readonly (HeatmapCell | null)[];
}
