import { TimePoint } from './horz-scale-behavior-time/types';
import { PlotRowValueIndex } from './plot-data';
import { SeriesPlotRow } from './series-data';
import { SeriesType } from './series-options';
import { TimePointIndex } from './time-data';

/**
 * Defines a conflation rule that determines how many bars to merge based on bar spacing.
 */
interface ConflationRule {
	barsToMerge: number;
	forBarSpacingLargerThan: number;
}

/**
 * Represents a conflated chunk of data points.
 */
export interface ConflatedChunk {
	startIndex: TimePointIndex;
	endIndex: TimePointIndex;
	startTime: TimePoint;
	endTime: TimePoint;
	open: number;
	high: number;
	low: number;
	close: number;
	originalDataCount: number;
}

const CONFLATION_RULES: ConflationRule[] = [
	{
		barsToMerge: 2,
		forBarSpacingLargerThan: 0.5,
	},
	{
		barsToMerge: 5,
		forBarSpacingLargerThan: 0.2,
	},
	{
		barsToMerge: 10,
		forBarSpacingLargerThan: 0.1,
	},
	{
		barsToMerge: 25,
		forBarSpacingLargerThan: 0.05,
	},
	{
		barsToMerge: 50,
		forBarSpacingLargerThan: 0.02,
	},
	{
		barsToMerge: 100,
		forBarSpacingLargerThan: 0,
	},
];

export class DataConflater<T extends SeriesType> {
	private _conflatedChunks: Map<number, ConflatedChunk[]> = new Map();
	private _lastBarSpacing: number = -1;
	private _lastDataVersion: number = -1;

	/**
	 * Conflates data based on adaptive bar spacing rules instead of a fixed factor.
	 * Uses multiple levels of detail for optimal performance at different zoom levels.
	 *
	 * @param data - The original series data
	 * @param barSpacing - Current bar spacing in pixels
	 * @returns Conflated data array
	 */
	public conflateDataAdaptive(data: readonly SeriesPlotRow<T>[], barSpacing: number): SeriesPlotRow<T>[] {
		if (data.length === 0) {
			return [];
		}

		const rule = this._findConflationRule(barSpacing);
		if (rule.barsToMerge <= 1) {
			return data.slice();
		}

		const dataVersion = this._getDataVersion(data);
		if (this._lastBarSpacing !== barSpacing || this._lastDataVersion !== dataVersion) {
			this._rebuildChunks(data, rule);
			this._lastBarSpacing = barSpacing;
			this._lastDataVersion = dataVersion;
		}

		return this._chunksToSeriesPlotRows(rule.barsToMerge);
	}

	private _findConflationRule(barSpacing: number): ConflationRule {
		for (const rule of CONFLATION_RULES) {
			if (barSpacing >= rule.forBarSpacingLargerThan) {
				return rule;
			}
		}
		// This should theoretically not be reached if the last rule has forBarSpacingLargerThan: 0
		return { barsToMerge: 1, forBarSpacingLargerThan: 0.5 };
	}

	/**
	 * Generates a simple version hash for the data to detect changes.
	 */
	private _getDataVersion(data: readonly SeriesPlotRow<T>[]): number {
		if (data.length === 0) {
			return 0;
		}
		// Simple hash based on data length and first/last items
		const first = data[0];
		const last = data[data.length - 1];
		return data.length * 31 + first.index * 17 + last.index * 13;
	}

	/**
	 * Rebuilds conflated chunks for the given rule.
	 */
	private _rebuildChunks(data: readonly SeriesPlotRow<T>[], rule: ConflationRule): void {
		const chunks: ConflatedChunk[] = [];
		let currentChunk: ConflatedChunk | null = null;
		let dataPointsInChunk = 0;

		for (let i = 0; i < data.length; i++) {
			const row = data[i];
			const price = this._extractPrice(row);

			if (currentChunk === null || dataPointsInChunk >= rule.barsToMerge) {
				if (currentChunk !== null) {
					chunks.push(currentChunk);
				}

				currentChunk = {
					startIndex: row.index,
					endIndex: row.index,
					startTime: row.time as unknown as TimePoint,
					endTime: row.time as unknown as TimePoint,
					open: price,
					high: price,
					low: price,
					close: price,
					originalDataCount: 1,
				};
				dataPointsInChunk = 1;
			} else {
				currentChunk.endIndex = row.index;
				currentChunk.endTime = row.time as unknown as TimePoint;
				currentChunk.high = Math.max(currentChunk.high, price);
				currentChunk.low = Math.min(currentChunk.low, price);
				currentChunk.close = price;
				currentChunk.originalDataCount++;
				dataPointsInChunk++;
			}
		}

		if (currentChunk !== null) {
			chunks.push(currentChunk);
		}

		this._conflatedChunks.set(rule.barsToMerge, chunks);
	}

	/**
	 * Converts conflated chunks back to SeriesPlotRow format.
	 */
	private _chunksToSeriesPlotRows(barsToMerge: number): SeriesPlotRow<T>[] {
		const chunks = this._conflatedChunks.get(barsToMerge) || [];
		const result: SeriesPlotRow<T>[] = [];

		for (const chunk of chunks) {
			const conflatedRow = {
				index: chunk.startIndex,
				time: chunk.endTime,
				originalTime: chunk.endTime, // originalTime might need to be startTime for some use cases
				value: [chunk.open, chunk.high, chunk.low, chunk.close],
			};

			result.push(conflatedRow as unknown as SeriesPlotRow<T>);
		}

		return result;
	}

	/**
	 * Extracts price from a series plot row (close value for simplicity).
	 */
	private _extractPrice(row: SeriesPlotRow<T>): number {
		return row.value[PlotRowValueIndex.Close];
	}
}
