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
	data?: unknown;
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
	levelResults: Map<number, readonly SeriesPlotRow<T>[]>;
}

export class DataConflater<T extends SeriesType, HorzScaleItem = unknown> {
	private _dataCache: WeakMap<readonly SeriesPlotRow<T>[], ConflationCacheEntry<T>> = new WeakMap();

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
		customReducer?: CustomConflationReducer<HorzScaleItem>,
		isCustomSeries: boolean = false,
		priceValueBuilder?: (item: unknown) => number[]
	): readonly SeriesPlotRow<T>[] {
		if (data.length === 0 || barsToMerge <= 1) {
			return data;
		}

		const conflationLevel = this._normalizeConflationLevel(barsToMerge);
		if (conflationLevel <= 1) {
			return data;
		}

		const entry = this._getValidatedCacheEntry(data);

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
	 * Efficiently update the last conflated chunk when new data arrives.
	 * This avoids rebuilding all chunks when just the last data point changes.
	 */
	public updateLastConflatedChunk(
		originalData: readonly SeriesPlotRow<T>[],
		newLastRow: SeriesPlotRow<T>,
		conflationLevel: number,
		customReducer?: CustomConflationReducer<HorzScaleItem>,
		isCustomSeries: boolean = false,
		priceValueBuilder?: (item: unknown) => number[]
	): readonly SeriesPlotRow<T>[] {
		if (conflationLevel < 1 || originalData.length === 0) {
			return originalData;
		}

		const entry = this._getValidatedCacheEntry(originalData);

		const cachedRows = entry.levelResults.get(conflationLevel);
		if (!cachedRows) {
			return this.conflateByFactor(originalData, conflationLevel, customReducer, isCustomSeries, priceValueBuilder);
		}

		const updatedRows = this._updateLastChunkInCache(
			originalData,
			newLastRow,
			conflationLevel,
			cachedRows,
			isCustomSeries,
			customReducer,
			priceValueBuilder
		);

		entry.levelResults.set(conflationLevel, updatedRows);
		return updatedRows;
	}

	private _normalizeConflationLevel(barsToMerge: number): number {
		if (barsToMerge <= 2) {
			return 2;
		}
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
		customReducer?: CustomConflationReducer<HorzScaleItem>,
		isCustomSeries: boolean = false,
		priceValueBuilder?: (item: unknown) => number[],
		levelResults: Map<number, readonly SeriesPlotRow<T>[]> = new Map()
	): readonly SeriesPlotRow<T>[] {
		if (targetLevel === 2) {
			return this._buildLevelFromOriginal(data, 2, customReducer, isCustomSeries, priceValueBuilder);
		}

		const prevLevel = targetLevel / 2;
		let prevData = levelResults.get(prevLevel);

		if (!prevData) {
			prevData = this._buildRecursively(
				data,
				prevLevel,
				customReducer,
				isCustomSeries,
				priceValueBuilder,
				levelResults
			);
			levelResults.set(prevLevel, prevData);
		}

		return this._buildLevelFromPrevious(prevData, customReducer, isCustomSeries, priceValueBuilder);
	}

	/**
	 * Build a conflation level directly from original data (used for level 2).
	 */
	private _buildLevelFromOriginal(
		data: readonly SeriesPlotRow<T>[],
		level: number,
		customReducer?: CustomConflationReducer<HorzScaleItem>,
		isCustomSeries: boolean = false,
		priceValueBuilder?: (item: unknown) => number[]
	): readonly SeriesPlotRow<T>[] {
		const chunks = this._buildChunksFromData(data, level, customReducer, isCustomSeries, priceValueBuilder);
		return this._chunksToSeriesPlotRows(chunks, isCustomSeries);
	}

	/**
	 * Build a conflation level from the previous level's result.
	 */
	private _buildLevelFromPrevious(
		prevData: readonly SeriesPlotRow<T>[],
		customReducer?: CustomConflationReducer<HorzScaleItem>,
		isCustomSeries: boolean = false,
		priceValueBuilder?: (item: unknown) => number[]
	): readonly SeriesPlotRow<T>[] {
		// Always merge 2 chunks from the previous level
		const chunks = this._buildChunksFromData(prevData, 2, customReducer, isCustomSeries, priceValueBuilder);
		return this._chunksToSeriesPlotRows(chunks, isCustomSeries);
	}

	private _buildChunksFromData(
		data: readonly SeriesPlotRow<T>[],
		mergeFactor: number,
		customReducer?: CustomConflationReducer<HorzScaleItem>,
		isCustomSeries: boolean = false,
		priceValueBuilder?: (item: unknown) => number[]
	): ConflatedChunk[] {
		const chunks: ConflatedChunk[] = [];
		for (let i = 0; i < data.length; i += mergeFactor) {
			const remaining = data.length - i;
			if (remaining >= mergeFactor) {
				const merged = this._mergeTwoRows(
					data[i],
					data[i + 1],
					customReducer,
					isCustomSeries,
					priceValueBuilder
				);
				merged.isRemainder = false;
				chunks.push(merged);
			} else {
				// remainder of 1 -> fold into previous chunk if possible
				if (chunks.length === 0) {
					chunks.push(this._plotRowToChunk(data[i], true));
				} else {
					const prev = chunks[chunks.length - 1];
					chunks[chunks.length - 1] = this._mergeChunkAndRow(
						prev,
						data[i],
						customReducer,
						isCustomSeries,
						priceValueBuilder
					);
				}
			}
		}
		return chunks;
	}

	private _sumCount(a: number | undefined, b: number | undefined): number {
		return (a ?? 1) + (b ?? 1);
	}

	private _mergeTwoRows(
		a: SeriesPlotRow<T>,
		b: SeriesPlotRow<T>,
		customReducer?: CustomConflationReducer<HorzScaleItem>,
		isCustomSeries: boolean = false,
		priceValueBuilder?: (item: unknown) => number[]
	): ConflatedChunk {
		if (!isCustomSeries || !customReducer || !priceValueBuilder) {
			const high = a.value[PlotRowValueIndex.High] > b.value[PlotRowValueIndex.High] ? a.value[PlotRowValueIndex.High] : b.value[PlotRowValueIndex.High];
			const low = a.value[PlotRowValueIndex.Low] < b.value[PlotRowValueIndex.Low] ? a.value[PlotRowValueIndex.Low] : b.value[PlotRowValueIndex.Low];
			return {
				startIndex: a.index,
				endIndex: b.index,
				startTime: a.time as unknown as TimePoint,
				endTime: b.time as unknown as TimePoint,
				open: a.value[PlotRowValueIndex.Open],
				high,
				low,
				close: b.value[PlotRowValueIndex.Close],
				originalDataCount: this._sumCount(a.originalDataCount, b.originalDataCount),
				conflatedData: undefined as unknown,
				isRemainder: false,
			};
		}
		const c1 = this._convertToContext(a, priceValueBuilder);
		const c2 = this._convertToContext(b, priceValueBuilder);
		const aggregated = customReducer(c1, c2);
		const prices = priceValueBuilder(aggregated);
		const p = prices.length ? prices[prices.length - 1] : 0;
		return {
			startIndex: a.index,
			endIndex: b.index,
			startTime: a.time as unknown as TimePoint,
			endTime: b.time as unknown as TimePoint,
			open: a.value[PlotRowValueIndex.Open],
			high: Math.max(a.value[PlotRowValueIndex.High], p),
			low: Math.min(a.value[PlotRowValueIndex.Low], p),
			close: p,
			originalDataCount: this._sumCount(a.originalDataCount, b.originalDataCount),
			conflatedData: aggregated,
			isRemainder: false,
		};
	}

	private _mergeChunkAndRow(
		chunk: ConflatedChunk,
		row: SeriesPlotRow<T>,
		customReducer?: CustomConflationReducer<HorzScaleItem>,
		isCustomSeries: boolean = false,
		priceValueBuilder?: (item: unknown) => number[]
	): ConflatedChunk {
		if (!isCustomSeries || !customReducer || !priceValueBuilder) {
			return {
				startIndex: chunk.startIndex,
				endIndex: row.index,
				startTime: chunk.startTime,
				endTime: row.time as unknown as TimePoint,
				open: chunk.open,
				high: chunk.high > row.value[PlotRowValueIndex.High] ? chunk.high : row.value[PlotRowValueIndex.High],
				low: chunk.low < row.value[PlotRowValueIndex.Low] ? chunk.low : row.value[PlotRowValueIndex.Low],
				close: row.value[PlotRowValueIndex.Close],
				originalDataCount: chunk.originalDataCount + (row.originalDataCount ?? 1),
				conflatedData: chunk.conflatedData,
				isRemainder: false,
			};
		}
		const prevAgg = chunk.conflatedData as CustomData<HorzScaleItem> | undefined;
		const ctx = this._convertToContext(row, priceValueBuilder);

		// if prevAgg is missing (e.g single-item remainder chunk)
		// treat the row as the first aggregate seed to avoid calling builder on undefined.
		const prevCtx: CustomConflationContext<HorzScaleItem, CustomData<HorzScaleItem>> | null = prevAgg
			? {
				data: prevAgg,
				index: chunk.startIndex,
				originalTime: chunk.startTime as unknown as HorzScaleItem,
				time: chunk.startTime,
				priceValues: priceValueBuilder(prevAgg),
			}
			: null;

		const aggregated = prevCtx ? customReducer(prevCtx, ctx) : (ctx.data);
		const prices = prevCtx ? priceValueBuilder(aggregated) : ctx.priceValues;
		const p = prices.length ? prices[prices.length - 1] : 0;
		return {
			startIndex: chunk.startIndex,
			endIndex: row.index,
			startTime: chunk.startTime,
			endTime: row.time as unknown as TimePoint,
			open: chunk.open,
			high: Math.max(chunk.high, p),
			low: Math.min(chunk.low, p),
			close: p,
			originalDataCount: chunk.originalDataCount + (row.originalDataCount ?? 1),
			conflatedData: aggregated,
			isRemainder: false,
		};
	}

	// fold [start, end) with override at overrideIndex
	// eslint-disable-next-line max-params
	private _mergeRangeWithOverride(
		data: readonly SeriesPlotRow<T>[],
		start: number,
		end: number,
		overrideIndex: number,
		overrideRow: SeriesPlotRow<T>,
		customReducer?: CustomConflationReducer<HorzScaleItem>,
		isCustomSeries: boolean = false,
		priceValueBuilder?: (item: unknown) => number[]
	): ConflatedChunk {
		const first = (start === overrideIndex) ? overrideRow : data[start];
		if (end - start === 1) {
			return this._plotRowToChunk(first, true);
		}

		const second = (start + 1 === overrideIndex) ? overrideRow : data[start + 1];
		let chunk = this._mergeTwoRows(first, second, customReducer, isCustomSeries, priceValueBuilder);

		for (let i = start + 2; i < end; i++) {
			const row = (i === overrideIndex) ? overrideRow : data[i];
			chunk = this._mergeChunkAndRow(chunk, row, customReducer, isCustomSeries, priceValueBuilder);
		}

		return chunk;
	}

	private _convertToContext(
		item: SeriesPlotRow<T> & { data?: unknown },
		priceValueBuilder: (item: unknown) => number[]
	): CustomConflationContext<HorzScaleItem, CustomData<HorzScaleItem>> {
		const itemData = item.data ?? {};
		return {
			data: item.data as CustomData<HorzScaleItem>,
			index: item.index,
			originalTime: item.originalTime as HorzScaleItem,
			time: item.time,
			priceValues: priceValueBuilder(itemData),
		} satisfies CustomConflationContext<HorzScaleItem, CustomData<HorzScaleItem>>;
	}

	private _chunkToSeriesPlotRow(chunk: ConflatedChunk, isCustomSeries: boolean = false): SeriesPlotRow<T> {
		const isCustom = isCustomSeries === true;
		const hasCustomData = !!chunk.conflatedData;

		const base = {
			index: chunk.startIndex,
			time: chunk.startTime as unknown as HorzScaleItem,
			originalTime: chunk.startTime as unknown as HorzScaleItem,
			value: [
				isCustom ? chunk.close : chunk.open,
				chunk.high,
				chunk.low,
				chunk.close,
			],
			originalDataCount: chunk.originalDataCount,
		};

		const data =
			isCustom
				? (hasCustomData ? chunk.conflatedData : { time: chunk.startTime })
				: undefined;

		return {
			...base,
			data,
		} as unknown as SeriesPlotRow<T>;
	}

	private _chunksToSeriesPlotRows(
		chunks: ConflatedChunk[],
		isCustomSeries: boolean = false
	): readonly SeriesPlotRow<T>[] {
		return chunks.map((chunk: ConflatedChunk) => this._chunkToSeriesPlotRow(chunk, isCustomSeries));
	}

	/**
	 * Update only the last chunk in cached conflated data efficiently.
	 */
	// eslint-disable-next-line max-params
	private _updateLastChunkInCache(
		originalData: readonly SeriesPlotRow<T>[],
		newLastRow: SeriesPlotRow<T>,
		conflationLevel: number,
		cachedRows: readonly SeriesPlotRow<T>[],
		isCustomSeries: boolean = false,
		customReducer?: CustomConflationReducer<HorzScaleItem>,
		priceValueBuilder?: (item: unknown) => number[]
	): readonly SeriesPlotRow<T>[] {
		if (cachedRows.length === 0) {
			return cachedRows;
		}

		const lastOriginalIndex = originalData.length - 1;
		const chunkStartIndex = Math.floor(lastOriginalIndex / conflationLevel) * conflationLevel;
		const chunkEndIndex = Math.min(chunkStartIndex + conflationLevel, originalData.length);

		if (chunkEndIndex - chunkStartIndex < conflationLevel && originalData.length > conflationLevel) {
			// we must allocate a new array here to do a full rebuild.
			const newOriginalData = originalData.slice();
			newOriginalData[newOriginalData.length - 1] = newLastRow;
			return this.conflateByFactor(newOriginalData, conflationLevel, customReducer, isCustomSeries, priceValueBuilder);
		}

		const lastChunkIndex = Math.floor((lastOriginalIndex - 1) / conflationLevel);
		const newChunkIndex = Math.floor(lastOriginalIndex / conflationLevel);

		if (lastChunkIndex === newChunkIndex || cachedRows.length === 1) {
			// Data length is within the same chunk OR it's the only chunk
			const actualEndIndex = Math.min(chunkStartIndex + conflationLevel, originalData.length);
			const count = actualEndIndex - chunkStartIndex;
			if (count <= 0) {
				// This can happen if originalData.length was 0, though we guard at the top.
				return cachedRows;
			}

			const mergedChunk = count === 1
				? this._plotRowToChunk((chunkStartIndex === lastOriginalIndex) ? newLastRow : originalData[chunkStartIndex], /* isRemainder*/ true)
				: this._mergeRangeWithOverride(
					originalData, chunkStartIndex, actualEndIndex,
					lastOriginalIndex, newLastRow,
					customReducer, isCustomSeries, priceValueBuilder
				);

			// in-place update of the cached result: avoid allocating a new array
			(cachedRows as SeriesPlotRow<T>[])[cachedRows.length - 1] = this._chunkToSeriesPlotRow(mergedChunk, isCustomSeries);
			return cachedRows;
		} else {
			// update affects chunk structure
			// we must allocate a new array here to do a full rebuild.
			const newOriginalData = originalData.slice();
			newOriginalData[newOriginalData.length - 1] = newLastRow;
			return this.conflateByFactor(newOriginalData, conflationLevel, customReducer, isCustomSeries, priceValueBuilder);
		}
	}

	private _plotRowToChunk(item: SeriesPlotRow<T>, isRemainder: boolean = false): ConflatedChunk {
		const chunk: ConflatedChunk = {
			startIndex: item.index,
			endIndex: item.index,
			startTime: item.time as unknown as TimePoint,
			endTime: item.time as unknown as TimePoint,
			open: item.value[PlotRowValueIndex.Open],
			high: item.value[PlotRowValueIndex.High],
			low: item.value[PlotRowValueIndex.Low],
			close: item.value[PlotRowValueIndex.Close],
			originalDataCount: item.originalDataCount ?? 1,
			conflatedData: (item as SeriesPlotRow<'Custom'>).data,
			isRemainder: isRemainder,
		};

		return chunk;
	}

	private _getValidatedCacheEntry(data: readonly SeriesPlotRow<T>[]): ConflationCacheEntry<T> {
		const entry = this._ensureCacheEntry(data);
		const dataVersion = this._getDataVersion(data);

		if (entry.version !== dataVersion) {
			entry.levelResults.clear();
			entry.version = dataVersion;
		}
		return entry;
	}

	private _ensureCacheEntry(data: readonly SeriesPlotRow<T>[]): ConflationCacheEntry<T> {
		let entry = this._dataCache.get(data);
		if (entry === undefined) {
			entry = {
				version: this._getDataVersion(data),
				levelResults: new Map(),
			};
			this._dataCache.set(data, entry);
		}
		return entry;
	}
}
