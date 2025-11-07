import { CONFLATION_LEVELS, DPR_CONFLATION_THRESHOLD, MAX_CONFLATION_LEVEL } from './conflation/constants';
import { TimePoint } from './horz-scale-behavior-time/types';
import { CustomConflationContext, CustomConflationReducer, CustomData } from './icustom-series';
import { PlotRowValueIndex } from './plot-data';
import { SeriesPlotRow } from './series-data';
import { SeriesType } from './series-options';
import { TimePointIndex } from './time-data';

/**
 * Represents a conflated chunk of data points with remainder handling.
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
	// For custom series: the actual conflated data result from custom reducer
	conflatedData?: unknown;
	// Whether this chunk is a remainder (couldn't be merged at this level)
	isRemainder?: boolean;
}

/**
 * Cache entry for conflation results with recursive building support.
 */
interface ConflationCacheEntry<T extends SeriesType> {
	version: number;
	results: Map<number, SeriesPlotRow<T>[]>;
	levelResults: Map<number, SeriesPlotRow<T>[]>;
}

export class DataConflater<T extends SeriesType> {
	private _dataCache: WeakMap<readonly SeriesPlotRow<T>[], ConflationCacheEntry<T>> = new WeakMap();

	public calculateConflationLevel(barSpacing: number, devicePixelRatio: number): number {
		return this.calculateConflationLevelWithSmoothing(barSpacing, devicePixelRatio, 1.0);
	}

	public calculateConflationLevelWithSmoothing(barSpacing: number, devicePixelRatio: number, smoothingFactor: number): number {
		const conflationThreshold = (DPR_CONFLATION_THRESHOLD / devicePixelRatio) * smoothingFactor;

		if (barSpacing >= conflationThreshold) {
			return 1;
		}

		// calculate conflation level as power of 2
		const ratio = conflationThreshold / barSpacing;
		const conflationLevel = Math.pow(2, Math.floor(Math.log2(ratio)));

		// ensure we don't exceed maximum conflation level
		return Math.min(conflationLevel, MAX_CONFLATION_LEVEL);
	}

	public conflateByFactor(
		data: readonly SeriesPlotRow<T>[],
		barsToMerge: number,
		customReducer?: CustomConflationReducer<unknown>,
		isCustomSeries: boolean = false,
		priceValueBuilder?: (item: unknown) => number[]
	): SeriesPlotRow<T>[] {
		if (data.length === 0 || barsToMerge <= 1) {
			return data.slice();
		}

		const conflationLevel = this._normalizeConflationLevel(barsToMerge);
		if (conflationLevel === 1) {
			return data.slice();
		}

		const entry = this._ensureCacheEntry(data);
		const dataVersion = this._getDataVersion(data);

		if (entry.version !== dataVersion) {
			entry.results.clear();
			entry.levelResults.clear();
			entry.version = dataVersion;
		}

		let cachedRows = entry.levelResults.get(conflationLevel);
		if (cachedRows !== undefined) {
			return cachedRows;
		}

		cachedRows = this._buildRecursively(
			data,
			conflationLevel,
			customReducer,
			isCustomSeries,
			priceValueBuilder,
			entry.levelResults
		);

		entry.levelResults.set(conflationLevel, cachedRows);
		return cachedRows;
	}

	/**
	 * Calculate effective bar spacing for precomputation decisions.
	 */
	public calculateEffectiveBarSpacing(
		minBarSpacing: number,
		currentBarSpacing: number,
		width: number,
		dataLength: number
	): number {
		return Math.max(
			minBarSpacing,
			Math.min(currentBarSpacing, width / dataLength)
		);
	}

	public getMaxNeededConflationLevel(effectiveBarSpacing: number, devicePixelRatio: number): number {
		return this.calculateConflationLevel(effectiveBarSpacing, devicePixelRatio);
	}

	/**
	 * Efficiently update the last conflated chunk when new data arrives.
	 * This avoids rebuilding all chunks when just the last data point changes.
	 */
	public updateLastConflatedChunk(
		originalData: readonly SeriesPlotRow<T>[],
		newLastRow: SeriesPlotRow<T>,
		conflationLevel: number,
		customReducer?: CustomConflationReducer<unknown>,
		isCustomSeries: boolean = false,
		priceValueBuilder?: (item: unknown) => number[]
	): SeriesPlotRow<T>[] {
		if (conflationLevel <= 1 || originalData.length === 0) {
			return originalData.slice();
		}

		const entry = this._ensureCacheEntry(originalData);
		const dataVersion = this._getDataVersion(originalData);

		if (entry.version !== dataVersion) {
			entry.results.clear();
			entry.levelResults.clear();
			entry.version = dataVersion;
		}

		const cachedRows = entry.levelResults.get(conflationLevel);
		if (!cachedRows) {
			return this.conflateByFactor(originalData, conflationLevel, customReducer, isCustomSeries, priceValueBuilder);
		}

		const updatedRows = this._updateLastChunkInCache(
			originalData,
			newLastRow,
			conflationLevel,
			cachedRows,
			customReducer,
			isCustomSeries,
			priceValueBuilder
		);

		entry.levelResults.set(conflationLevel, updatedRows);
		return updatedRows;
	}

	/**
	 * Clear cache for specific data or all data.
	 */
	public clearCache(data?: readonly SeriesPlotRow<T>[]): void {
		if (data) {
			this._dataCache.delete(data);
		} else {
			this._dataCache = new WeakMap();
		}
	}

	private _normalizeConflationLevel(barsToMerge: number): number {
		for (const level of CONFLATION_LEVELS) {
			if (barsToMerge <= level) {
				return level;
			}
		}
		return MAX_CONFLATION_LEVEL;
	}

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
	 * Build conflation recursively, reusing previous level results.
	 */
	private _buildRecursively(
		data: readonly SeriesPlotRow<T>[],
		targetLevel: number,
		customReducer?: CustomConflationReducer<unknown>,
		isCustomSeries: boolean = false,
		priceValueBuilder?: (item: unknown) => number[],
		levelResults: Map<number, SeriesPlotRow<T>[]> = new Map()
	): SeriesPlotRow<T>[] {
		if (targetLevel === 2) {
			return this._buildLevelFromOriginal(data, 2, customReducer, isCustomSeries, priceValueBuilder);
		}

		const prevLevel = targetLevel / 2;
		let prevData = levelResults.get(prevLevel);

		if (!prevData) {
			prevData = this._buildRecursively(data, prevLevel, customReducer, isCustomSeries, priceValueBuilder, levelResults);
			levelResults.set(prevLevel, prevData);
		}

		return this._buildLevelFromPrevious(prevData, targetLevel, customReducer, isCustomSeries, priceValueBuilder);
	}

	/**
	 * Build a conflation level directly from original data (used for level 2).
	 */
	private _buildLevelFromOriginal(
		data: readonly SeriesPlotRow<T>[],
		level: number,
		customReducer?: CustomConflationReducer<unknown>,
		isCustomSeries: boolean = false,
		priceValueBuilder?: (item: unknown) => number[]
	): SeriesPlotRow<T>[] {
		const chunks = this._buildChunksFromData(data, level, customReducer, isCustomSeries, priceValueBuilder);
		return this._chunksToSeriesPlotRows(chunks, isCustomSeries);
	}

	/**
	 * Build a conflation level from the previous level's result.
	 */
	private _buildLevelFromPrevious(
		prevData: SeriesPlotRow<T>[],
		targetLevel: number,
		customReducer?: CustomConflationReducer<unknown>,
		isCustomSeries: boolean = false,
		priceValueBuilder?: (item: unknown) => number[]
	): SeriesPlotRow<T>[] {
		const chunks = this._buildChunksFromData(prevData, 2, customReducer, isCustomSeries, priceValueBuilder);

		for (const chunk of chunks) {
			chunk.originalDataCount *= (targetLevel / 2);
		}

		return this._chunksToSeriesPlotRows(chunks, isCustomSeries);
	}

	/**
	 * Build chunks by merging items, handling remainders by merging them into previous chunks.
	 * This eliminates visual gaps by combining remainders with the last full chunk.
	 */
	private _buildChunksFromData(
		data: readonly SeriesPlotRow<T>[],
		mergeFactor: number,
		customReducer?: CustomConflationReducer<unknown>,
		isCustomSeries: boolean = false,
		priceValueBuilder?: (item: unknown) => number[]
	): ConflatedChunk[] {
		const estimatedNumberChunks = Math.max(1, Math.ceil(data.length / mergeFactor));
		const chunks: ConflatedChunk[] = new Array(estimatedNumberChunks);
		let chunkWriteIndex = 0;

		for (let i = 0; i < data.length; i += mergeFactor) {
			const itemsToMerge = Math.min(mergeFactor, data.length - i);

			if (itemsToMerge === mergeFactor) {
				const chunk = this._mergeItems(
					data.slice(i, i + mergeFactor),
					customReducer,
					isCustomSeries,
					priceValueBuilder
				);
				chunk.isRemainder = false;
				chunks[chunkWriteIndex++] = chunk;
			} else {
				const remainderData = data.slice(i);

				if (chunkWriteIndex === 0) {
					for (const remainder of remainderData) {
						const chunk: ConflatedChunk = {
							startIndex: remainder.index,
							endIndex: remainder.index,
							startTime: remainder.time as unknown as TimePoint,
							endTime: remainder.time as unknown as TimePoint,
							open: remainder.value[PlotRowValueIndex.Open],
							high: remainder.value[PlotRowValueIndex.High],
							low: remainder.value[PlotRowValueIndex.Low],
							close: remainder.value[PlotRowValueIndex.Close],
							originalDataCount: 1,
						};
						chunk.isRemainder = true;
						chunks[chunkWriteIndex++] = chunk;
					}
				} else {
					const lastChunkStartIndex = Math.max(0, i - mergeFactor);
					const lastChunkEndIndex = i;
					const lastChunkData = data.slice(lastChunkStartIndex, lastChunkEndIndex);

					const combinedData = [...lastChunkData, ...remainderData];

					const mergedChunk = this._mergeItems(
						combinedData,
						customReducer,
						isCustomSeries,
						priceValueBuilder
					);
					mergedChunk.isRemainder = false;
					chunks[chunkWriteIndex - 1] = mergedChunk;
				}
			}
		}

		return chunks.slice(0, chunkWriteIndex);
	}

	private _mergeItems(
		items: SeriesPlotRow<T>[],
		customReducer?: CustomConflationReducer<unknown>,
		isCustomSeries: boolean = false,
		priceValueBuilder?: (item: unknown) => number[]
	): ConflatedChunk {
		if (items.length < 2) {
			throw new Error(`Expected at least 2 items to merge, got ${items.length}`);
		}

		const firstItem = items[0];
		const lastItem = items[items.length - 1];

		if (!isCustomSeries || !customReducer || !priceValueBuilder) {
			const high = Math.max(...items.map((item: SeriesPlotRow<T>) => item.value[PlotRowValueIndex.High]));
			const low = Math.min(...items.map((item: SeriesPlotRow<T>) => item.value[PlotRowValueIndex.Low]));

			return {
				startIndex: firstItem.index,
				endIndex: lastItem.index,
				startTime: firstItem.time as unknown as TimePoint,
				endTime: lastItem.time as unknown as TimePoint,
				open: firstItem.value[PlotRowValueIndex.Open],
				high,
				low,
				close: lastItem.value[PlotRowValueIndex.Close],
				originalDataCount: items.length,
			};
		}

		const contexts = items.map((item: SeriesPlotRow<T>) => this._convertToContext(item, priceValueBuilder));
		let aggregatedData = customReducer(contexts[0], contexts[1]);

		for (let i = 2; i < contexts.length; i++) {
			const tempContext: CustomConflationContext<unknown, CustomData<unknown>> = {
				data: aggregatedData,
				index: contexts[0].index,
				originalTime: contexts[0].originalTime,
				time: contexts[0].time,
				priceValues: priceValueBuilder(aggregatedData),
			};
			aggregatedData = customReducer(tempContext, contexts[i]);
		}

		const priceValues = priceValueBuilder(aggregatedData);
		const aggregatedPrice = priceValues.length > 0 ? priceValues[priceValues.length - 1] : 0;

		return {
			startIndex: firstItem.index,
			endIndex: lastItem.index,
			startTime: firstItem.time as unknown as TimePoint,
			endTime: lastItem.time as unknown as TimePoint,
			open: firstItem.value[PlotRowValueIndex.Open],
			high: Math.max(firstItem.value[PlotRowValueIndex.High], aggregatedPrice),
			low: Math.min(firstItem.value[PlotRowValueIndex.Low], aggregatedPrice),
			close: aggregatedPrice,
			originalDataCount: items.length,
			conflatedData: aggregatedData,
		};
	}

	/**
	 * Convert a SeriesPlotRow to CustomConflationContext.
	 */
	private _convertToContext(
		item: SeriesPlotRow<T>,
		priceValueBuilder: (item: unknown) => number[]
	): CustomConflationContext<unknown, CustomData<unknown>> {
		const itemData = (item as SeriesPlotRow<T> & { data?: Record<string, unknown> }).data || {};

		return {
			data: itemData as unknown as CustomData<unknown>,
			index: item.index,
			originalTime: item.originalTime,
			time: item.time,
			priceValues: priceValueBuilder(itemData),
		} satisfies CustomConflationContext<unknown, CustomData<unknown>>;
	}

	/**
	 * Convert conflated chunks back to SeriesPlotRow format.
	 */
	private _chunksToSeriesPlotRows(chunks: ConflatedChunk[], isCustomSeries: boolean = false): SeriesPlotRow<T>[] {
		const result: SeriesPlotRow<T>[] = [];

		for (const chunk of chunks) {
			if (isCustomSeries) {
				const conflatedData = chunk.conflatedData;
				if (conflatedData) {
					// Custom reducer provided conflated data - use it directly
					const conflatedRow = {
						index: chunk.startIndex,
						time: chunk.startTime,
						originalTime: chunk.startTime,
						value: [chunk.close, chunk.high, chunk.low, chunk.close], // Keep OHLC for compatibility
						data: conflatedData, // Use the actual conflated data from custom reducer
						originalDataCount: chunk.originalDataCount,
					};
					result.push(conflatedRow as unknown as SeriesPlotRow<T>);
				} else {
					const conflatedRow = {
						index: chunk.startIndex,
						time: chunk.startTime,
						originalTime: chunk.startTime,
						value: [chunk.close, chunk.high, chunk.low, chunk.close],
						data: {
							time: chunk.startTime,
						},
						originalDataCount: chunk.originalDataCount,
					};
					result.push(conflatedRow as unknown as SeriesPlotRow<T>);
				}
			} else {
				// built-in series use the standard format
				const conflatedRow = {
					index: chunk.startIndex,
					time: chunk.startTime,
					originalTime: chunk.startTime,
					value: [chunk.open, chunk.high, chunk.low, chunk.close],
					originalDataCount: chunk.originalDataCount,
				};
				result.push(conflatedRow as unknown as SeriesPlotRow<T>);
			}
		}

		return result;
	}

	/**
	 * Update only the last chunk in cached conflated data efficiently.
	 */
	// eslint-disable-next-line max-params
	private _updateLastChunkInCache(
		originalData: readonly SeriesPlotRow<T>[],
		newLastRow: SeriesPlotRow<T>,
		conflationLevel: number,
		cachedRows: SeriesPlotRow<T>[],
		customReducer?: CustomConflationReducer<unknown>,
		isCustomSeries: boolean = false,
		priceValueBuilder?: (item: unknown) => number[]
	): SeriesPlotRow<T>[] {
		if (cachedRows.length === 0) {
			return cachedRows;
		}

		const lastOriginalIndex = originalData.length - 1;
		const chunkStartIndex = Math.floor(lastOriginalIndex / conflationLevel) * conflationLevel;
		const chunkEndIndex = Math.min(chunkStartIndex + conflationLevel, originalData.length);

		if (chunkEndIndex - chunkStartIndex !== conflationLevel) {
			// last chunk is incomplete (remainder), need to rebuild from scratch
			return this.conflateByFactor(originalData, conflationLevel, customReducer, isCustomSeries, priceValueBuilder);
		}

		const newOriginalData = originalData.slice(0, -1);
		newOriginalData.push(newLastRow);

		const lastChunkIndex = Math.floor((lastOriginalIndex - 1) / conflationLevel);
		const newChunkIndex = Math.floor((newOriginalData.length - 1) / conflationLevel);

		if (lastChunkIndex === newChunkIndex && chunkEndIndex - chunkStartIndex === conflationLevel) {
			const chunkData = newOriginalData.slice(chunkStartIndex, chunkStartIndex + conflationLevel);
			const updatedChunk = this._mergeItems(chunkData, customReducer, isCustomSeries, priceValueBuilder);
			const updatedRows = cachedRows.slice(0, -1);
			updatedRows.push(this._chunkToSeriesPlotRow(updatedChunk, isCustomSeries));
			return updatedRows;
		} else {
			// update affects chunk structure - need full rebuild
			return this.conflateByFactor(newOriginalData, conflationLevel, customReducer, isCustomSeries, priceValueBuilder);
		}
	}

	/**
	 * Convert a chunk back to SeriesPlotRow format.
	 */
	private _chunkToSeriesPlotRow(chunk: ConflatedChunk, isCustomSeries: boolean = false): SeriesPlotRow<T> {
		if (isCustomSeries && chunk.conflatedData) {
			return {
				index: chunk.startIndex,
				time: chunk.startTime,
				originalTime: chunk.startTime,
				value: [chunk.close, chunk.high, chunk.low, chunk.close],
				data: chunk.conflatedData,
				originalDataCount: chunk.originalDataCount,
			} as unknown as SeriesPlotRow<T>;
		} else {
			return {
				index: chunk.startIndex,
				time: chunk.startTime,
				originalTime: chunk.startTime,
				value: [chunk.open, chunk.high, chunk.low, chunk.close],
				originalDataCount: chunk.originalDataCount,
			} as unknown as SeriesPlotRow<T>;
		}
	}

	private _ensureCacheEntry(data: readonly SeriesPlotRow<T>[]): ConflationCacheEntry<T> {
		let entry = this._dataCache.get(data);
		if (entry === undefined) {
			entry = {
				version: this._getDataVersion(data),
				results: new Map(),
				levelResults: new Map(),
			};
			this._dataCache.set(data, entry);
		}
		return entry;
	}
}
