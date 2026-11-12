import {
	CustomSeriesOptions,
	DeepPartial,
	customSeriesDefaultOptions,
} from 'lightweight-charts';

/**
 * The lowest and the highest amount among the cells of the points in view,
 * handed to the `cellShader` on every paint.
 */
export interface HeatmapAmountRange {
	/** The lowest amount. */
	min: number;
	/** The highest amount; equal to `min` when every cell in view has the same amount. */
	max: number;
}

/**
 * Turns a cell's amount into its fill color. `range` is the range of the
 * amounts in view, so a shader can spread its colors over what is on screen
 * rather than over a maximum fixed in advance.
 */
export type HeatmapCellShader = (amount: number, range: HeatmapAmountRange) => string;

export interface HeatmapSeriesOptions extends CustomSeriesOptions {
	/**
	 * Turns a cell's amount into its fill color. It is called for every cell on
	 * screen on every paint, so keep it cheap; `createColorScale` builds one
	 * that looks its colors up from a table. A cell whose color the canvas
	 * cannot parse is not drawn.
	 */
	cellShader: HeatmapCellShader;
	/**
	 * Space left between neighboring cells, in CSS pixels, both between the
	 * columns and between the cells of a column. It is left out along a side
	 * of a cell that is not more than three times as long, as measured before
	 * rounding to device pixels, so cells of one size all get it or all go
	 * without. `0` for none.
	 */
	cellGap: number;
	/**
	 * Width of the border drawn inside the edge of every cell, in CSS pixels.
	 * It is left out along a side of a cell that is not more than three times
	 * as long, after the gap, as measured before rounding to device pixels.
	 * `0` for none.
	 */
	cellBorderWidth: number;
	/** Color of the cell border. */
	cellBorderColor: string;
}

/**
 * The options as they are passed in: every one optional. `cellShader` keeps
 * its function type, which the library's `DeepPartial` would turn into an
 * object type, so an inline shader gets its parameters typed.
 */
export type HeatmapSeriesPartialOptions = DeepPartial<Omit<HeatmapSeriesOptions, 'cellShader'>> & {
	cellShader?: HeatmapCellShader;
};

export const defaultOptions: HeatmapSeriesOptions = {
	...customSeriesDefaultOptions,
	// A heatmap has no single current value to show on the price scale.
	lastValueVisible: false,
	priceLineVisible: false,
	// Green, from faint at 0 to opaque at 100 and above. The amount is rounded,
	// so the shader returns at most 101 colors and cells are filled together
	// by color.
	cellShader: (amount: number) => {
		const amt = Math.round(Math.min(Math.max(0, amount), 100));
		return `rgba(0, ${100 + Math.round(amt * 1.55)}, ${amt}, ${(200 + amt * 8) / 1000})`;
	},
	cellGap: 1,
	cellBorderWidth: 0,
	cellBorderColor: 'rgba(255, 255, 255, 1)',
};
