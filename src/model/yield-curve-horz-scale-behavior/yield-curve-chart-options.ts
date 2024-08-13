import { ChartOptionsImpl } from '../chart-model';

/**
 * Options specific to yield curve charts.
 */
export interface YieldCurveOptions {
	/**
	 * The smallest time unit for the yield curve, typically representing one month.
	 * This value determines the granularity of the time scale.
	 * @defaultValue 1
	 */
	baseResolution: number;

	/**
	 * The minimum time range to be displayed on the chart, in units of baseResolution.
	 * This ensures that the chart always shows at least this much time range, even if there's less data.
	 * @defaultValue 120 (10 years)
	 */
	minimumTimeRange: number;

	/**
	 * The starting time value for the chart, in units of baseResolution.
	 * This determines where the time scale begins.
	 * @defaultValue 0
	 */
	startTimeRange: number;

	/**
	 * Optional custom formatter for time values on the horizontal axis.
	 * If not provided, a default formatter will be used.
	 * @param months - The number of months (or baseResolution units) to format
	 * @returns A string representation of the time value
	 */
	formatTime?: (months: number) => string;
}

/**
 * Extended chart options that include yield curve specific options.
 * This interface combines the standard chart options with yield curve options.
 */
export interface YieldCurveChartOptions extends ChartOptionsImpl<number> {
	/**
	 * Yield curve specific options.
	 * This object contains all the settings related to how the yield curve is displayed and behaves.
	 */
	yieldCurve: YieldCurveOptions;
}
