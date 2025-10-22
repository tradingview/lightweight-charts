import { PlotRowValueIndex } from '../plot-data';
import {
	AreaPlotRow,
	BarPlotRow,
	BaselinePlotRow,
	CandlestickPlotRow,
	HistogramPlotRow,
	LinePlotRow,
	SeriesPlotRow,
} from '../series-data';
import { SeriesType } from '../series-options';
import { CONFLATION_ERROR_MESSAGES } from './constants';
import {
	BuiltInConflationStrategies,
	ConflationStrategy,
} from './types';

/**
 * Helper function to create a conflation strategy.
 */
function createConflationStrategy<T extends SeriesType>(
	name: string,
	reducer: (items: readonly SeriesPlotRow<T>[]) => SeriesPlotRow<T>,
	description?: string
): ConflationStrategy<T> {
	return {
		name,
		description,
		reducer,
		validate: (items: readonly SeriesPlotRow<T>[]) => items.length > 0,
	};
}

/**
 * Line series conflation strategy - preserves the last value.
 */
export const lineConflationStrategy: ConflationStrategy<'Line'> = createConflationStrategy(
	'LineLastValue',
	(items: readonly LinePlotRow[]): LinePlotRow => {
		if (items.length === 0) {
			throw new Error(CONFLATION_ERROR_MESSAGES.emptyArray);
		}

		const lastItem = items[items.length - 1];
		return {
			...lastItem,
			index: items[0].index,
			time: items[0].time,
			originalTime: items[0].originalTime,
		};
	},
	'Uses the last value in the chunk for line series conflation'
);

/**
 * Area series conflation strategy - preserves the last value and colors.
 */
export const areaConflationStrategy: ConflationStrategy<'Area'> = createConflationStrategy(
	'AreaLastValue',
	(items: readonly AreaPlotRow[]): AreaPlotRow => {
		if (items.length === 0) {
			throw new Error(CONFLATION_ERROR_MESSAGES.emptyArray);
		}

		const lastItem = items[items.length - 1];
		return {
			...lastItem,
			index: items[0].index,
			time: items[0].time,
			originalTime: items[0].originalTime,
			// Preserve area-specific properties from the last item
			lineColor: lastItem.lineColor,
			topColor: lastItem.topColor,
			bottomColor: lastItem.bottomColor,
		};
	},
	'Uses the last value and preserves area-specific colors'
);

/**
 * Baseline series conflation strategy - preserves top/bottom values and colors.
 */
export const baselineConflationStrategy: ConflationStrategy<'Baseline'> = createConflationStrategy(
	'BaselinePreserveValues',
	(items: readonly BaselinePlotRow[]): BaselinePlotRow => {
		if (items.length === 0) {
			throw new Error(CONFLATION_ERROR_MESSAGES.emptyArray);
		}

		const firstItem = items[0];
		const lastItem = items[items.length - 1];

		// For baseline, we need to find the max and min values for proper rendering
		let maxClose = -Infinity;
		let minClose = Infinity;

		for (const item of items) {
			const close = item.value[PlotRowValueIndex.Close];
			maxClose = Math.max(maxClose, close);
			minClose = Math.min(minClose, close);
		}

		// Create value array that preserves the range
		const value: [number, number, number, number] = [
			firstItem.value[PlotRowValueIndex.Open], // Open
			maxClose, // High (as max close)
			minClose, // Low (as min close)
			lastItem.value[PlotRowValueIndex.Close], // Close
		];

		return {
			...firstItem,
			index: firstItem.index,
			time: firstItem.time,
			originalTime: firstItem.originalTime,
			value,
			// Preserve baseline-specific properties
			topFillColor1: lastItem.topFillColor1,
			topFillColor2: lastItem.topFillColor2,
			topLineColor: lastItem.topLineColor,
			bottomFillColor1: lastItem.bottomFillColor1,
			bottomFillColor2: lastItem.bottomFillColor2,
			bottomLineColor: lastItem.bottomLineColor,
		};
	},
	'Preserves value range and baseline-specific colors for proper rendering'
);

/**
 * Candlestick series conflation strategy - preserves full OHLC.
 */
export const candlestickConflationStrategy: ConflationStrategy<'Candlestick'> = createConflationStrategy(
	'CandlestickOHLC',
	(items: readonly CandlestickPlotRow[]): CandlestickPlotRow => {
		if (items.length === 0) {
			throw new Error(CONFLATION_ERROR_MESSAGES.emptyArray);
		}

		const firstItem = items[0];
		const lastItem = items[items.length - 1];

		// Aggregate OHLC values
		const open = firstItem.value[PlotRowValueIndex.Open];
		let high = firstItem.value[PlotRowValueIndex.High];
		let low = firstItem.value[PlotRowValueIndex.Low];
		const close = lastItem.value[PlotRowValueIndex.Close];

		// Find the true high and low across all items
		for (const item of items) {
			high = Math.max(high, item.value[PlotRowValueIndex.High]);
			low = Math.min(low, item.value[PlotRowValueIndex.Low]);
		}

		const value: [number, number, number, number] = [open, high, low, close];

		return {
			...firstItem,
			index: firstItem.index,
			time: firstItem.time,
			originalTime: firstItem.originalTime,
			value,
			// Preserve candlestick-specific properties from the last item
			color: lastItem.color,
			borderColor: lastItem.borderColor,
			wickColor: lastItem.wickColor,
		};
	},
	'Preserves complete OHLC data and candlestick-specific properties'
);

/**
 * Bar series conflation strategy - preserves full OHLC.
 */
export const barConflationStrategy: ConflationStrategy<'Bar'> = createConflationStrategy(
	'BarOHLC',
	(items: readonly BarPlotRow[]): BarPlotRow => {
		if (items.length === 0) {
			throw new Error(CONFLATION_ERROR_MESSAGES.emptyArray);
		}

		const firstItem = items[0];
		const lastItem = items[items.length - 1];

		// Aggregate OHLC values
		const open = firstItem.value[PlotRowValueIndex.Open];
		let high = firstItem.value[PlotRowValueIndex.High];
		let low = firstItem.value[PlotRowValueIndex.Low];
		const close = lastItem.value[PlotRowValueIndex.Close];

		// Find the true high and low across all items
		for (const item of items) {
			high = Math.max(high, item.value[PlotRowValueIndex.High]);
			low = Math.min(low, item.value[PlotRowValueIndex.Low]);
		}

		const value: [number, number, number, number] = [open, high, low, close];

		return {
			...firstItem,
			index: firstItem.index,
			time: firstItem.time,
			originalTime: firstItem.originalTime,
			value,
			// Preserve bar-specific properties from the last item
			color: lastItem.color,
		};
	},
	'Preserves complete OHLC data and bar-specific properties'
);

/**
 * Histogram series conflation strategy - uses the maximum value.
 */
export const histogramConflationStrategy: ConflationStrategy<'Histogram'> = createConflationStrategy(
	'HistogramMaxValue',
	(items: readonly HistogramPlotRow[]): HistogramPlotRow => {
		if (items.length === 0) {
			throw new Error(CONFLATION_ERROR_MESSAGES.emptyArray);
		}

		const firstItem = items[0];
		let maxValue = firstItem.value[PlotRowValueIndex.Close];
		let maxColor = firstItem.color;

		// Find the maximum value and its color
		for (const item of items) {
			const value = item.value[PlotRowValueIndex.Close];
			if (value > maxValue) {
				maxValue = value;
				maxColor = item.color;
			}
		}

		const value: [number, number, number, number] = [
			maxValue, // Open = max
			maxValue, // High = max
			maxValue, // Low = max
			maxValue, // Close = max
		];

		return {
			...firstItem,
			index: firstItem.index,
			time: firstItem.time,
			originalTime: firstItem.originalTime,
			value,
			// Preserve color from the maximum value item
			color: maxColor,
		};
	},
	'Uses the maximum value in the chunk and preserves its color'
);

/**
 * Built-in conflation strategies mapping.
 */
const builtInConflationStrategies: BuiltInConflationStrategies = {
	Line: lineConflationStrategy,
	Area: areaConflationStrategy,
	Baseline: baselineConflationStrategy,
	Candlestick: candlestickConflationStrategy,
	Bar: barConflationStrategy,
	Histogram: histogramConflationStrategy,
};

// Export the strategies individually and as a type
export type { BuiltInConflationStrategies };

/**
 * Get the default conflation strategy for a series type.
 */
export function getDefaultConflationStrategy<T extends SeriesType>(
	seriesType: T
): T extends keyof BuiltInConflationStrategies
	? BuiltInConflationStrategies[T]
	: never {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
	return builtInConflationStrategies[seriesType as keyof BuiltInConflationStrategies] as any;
}

export { DEFAULT_CONFLATION_RULES, DEFAULT_CONFLATION_FACTORS } from './constants';

