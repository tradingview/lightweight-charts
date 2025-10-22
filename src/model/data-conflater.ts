import { DEFAULT_CONFLATION_RULES } from './conflation/constants';
import { ConflationRule, CustomConflationRules } from './conflation/types';
import { TimePoint } from './horz-scale-behavior-time/types';
import { CustomConflationContext } from './icustom-series';
import { PlotRowValueIndex } from './plot-data';
import { SeriesPlotRow } from './series-data';
import { SeriesType } from './series-options';
import { TimePointIndex } from './time-data';

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
	// For custom series: the actual conflated data result from custom reducer
	conflatedData?: unknown;
}

/**
 * Cache entry for conflation results.
 */
interface ConflationCacheEntry<T extends SeriesType> {
	version: number;
	results: Map<number, SeriesPlotRow<T>[]>;
}

export { DEFAULT_CONFLATION_FACTORS } from './conflation/constants';

export class DataConflater<T extends SeriesType> {
	private _dataCache: WeakMap<readonly SeriesPlotRow<T>[], ConflationCacheEntry<T>> = new WeakMap();
	private _customRules: ConflationRule[] | null = null;

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

		return this.conflateByFactor(data, rule.barsToMerge);
	}

	/**
	 * Conflates data using a fixed bars-to-merge factor. Cached per factor and invalidated on data change.
	 */
	public conflateByFactor(
		data: readonly SeriesPlotRow<T>[],
		barsToMerge: number,
		customReducer?: (items: readonly unknown[]) => unknown,
		isCustomSeries: boolean = false,
		priceValueBuilder?: (item: unknown) => number[]
	): SeriesPlotRow<T>[] {
		if (data.length === 0 || barsToMerge <= 1) {
			return data.slice();
		}

		const entry = this._ensureCacheEntry(data);
		const dataVersion = this._getDataVersion(data);

		if (entry.version !== dataVersion) {
			entry.results.clear();
			entry.version = dataVersion;
		}

		const cachedRows = entry.results.get(barsToMerge);
		if (cachedRows !== undefined) {
			return cachedRows;
		}

		const chunks = this._buildChunks(data, barsToMerge, customReducer, isCustomSeries, priceValueBuilder);
		const rows = this._chunksToSeriesPlotRows(chunks, isCustomSeries);

		entry.results.set(barsToMerge, rows);

		return rows;
	}

	/**
	 * Precompute and cache the conflation result for a given factor in background.
	 */
	public precomputeByFactor(
		data: readonly SeriesPlotRow<T>[],
		barsToMerge: number,
		priority: 'background' | 'user-visible' | 'user-blocking' = 'background'
	): void {
		if (data.length === 0 || barsToMerge <= 1) {
			return;
		}

		const entry = this._ensureCacheEntry(data);
		const dataVersion = this._getDataVersion(data);

		if (entry.version !== dataVersion) {
			entry.results.clear();
			entry.version = dataVersion;
		}

		if (entry.results.has(barsToMerge)) {
			return;
		}

		const task = () => {
			const chunks = this._buildChunks(data, barsToMerge);
			const rows = this._chunksToSeriesPlotRows(chunks, false);
			entry.results.set(barsToMerge, rows);
		};

		// Use Prioritized Task Scheduling API if available
		const globalObj = ((typeof window === 'object' && window) || (typeof self === 'object' && self)) as unknown as {
			scheduler?: {
				postTask?: (cb: () => void, opts: { priority: 'background' | 'user-visible' | 'user-blocking' }) => Promise<void>;
			};
		} | undefined;

		if (globalObj?.scheduler?.postTask) {
			void globalObj.scheduler.postTask(() => { task(); }, { priority });
		} else {
			void Promise.resolve().then(() => task());
		}
	}

	/**
	 * Precompute conflation results for multiple factors in parallel.
	 */
	public async precomputeConflationLevels(
		data: readonly SeriesPlotRow<T>[],
		factors: number[],
		priority: 'background' | 'user-visible' | 'user-blocking' = 'background'
	): Promise<void> {
		if (data.length === 0) {
			return;
		}

		const entry = this._ensureCacheEntry(data);
		const dataVersion = this._getDataVersion(data);

		if (entry.version !== dataVersion) {
			entry.results.clear();
			entry.version = dataVersion;
		}

		// Filter out already computed factors
		const factorsToCompute = factors.filter((factor: number) =>
			!entry.results.has(factor)
		);

		if (factorsToCompute.length === 0) {
			return;
		}

		// Create tasks for parallel processing
		const tasks = factorsToCompute.map((factor: number) => {
			// eslint-disable-next-line @typescript-eslint/require-await
			const task = async () => {
				const startTime = performance.now();

				try {
					this.precomputeByFactor(data, factor, priority);
					const duration = performance.now() - startTime;

					if (process.env.NODE_ENV === 'development') {
						// eslint-disable-next-line no-console
						console.log(`Precomputed conflation factor ${factor} in ${duration.toFixed(2)}ms`);
					}
				} catch (error) {
					// eslint-disable-next-line no-console
					console.error(`Error precomputing conflation factor ${factor}:`, error);
				}
			};

			return task;
		});

		// Use Prioritized Task Scheduling API if available
		const globalObj = ((typeof window === 'object' && window) || (typeof self === 'object' && self)) as unknown as {
			scheduler?: { postTask?: (cb: () => void, opts: { priority: string }) => Promise<void> };
		} | undefined;

		if (globalObj?.scheduler?.postTask) {
			const promises = tasks.map((task: () => void) =>
				globalObj.scheduler?.postTask?.(task, { priority }) || Promise.resolve(task())
			);
			await Promise.all(promises);
		} else {
			// Fallback to regular Promise execution
			await Promise.all(tasks.map((task: () => void) => task()));
		}
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

	/**
	 * Sets custom conflation rules to override the default ones.
	 *
	 * @param customRules - The custom conflation rules configuration
	 */
	public setCustomConflationRules(customRules: CustomConflationRules): void {
		if (customRules.rules && customRules.rules.length > 0) {
			for (const rule of customRules.rules) {
				if (rule.barsToMerge < 1) {
					throw new Error('barsToMerge must be at least 1');
				}
				if (rule.forBarSpacingLargerThan < 0) {
					throw new Error('forBarSpacingLargerThan must be non-negative');
				}
			}

			const sortedRules = [...customRules.rules].sort((a: ConflationRule, b: ConflationRule) => b.forBarSpacingLargerThan - a.forBarSpacingLargerThan);

			if (customRules.replaceDefaults) {
				this._customRules = sortedRules;
			} else {
				this._customRules = this._mergeRules(DEFAULT_CONFLATION_RULES, sortedRules);
			}
		} else {
			this._customRules = null;
		}
	}

	/**
	 * Merges default rules with custom rules, giving priority to custom rules.
	 */
	private _mergeRules(defaultRules: ConflationRule[], customRules: ConflationRule[]): ConflationRule[] {
		const mergedRules: ConflationRule[] = [];
		const customSpacingValues = new Set(customRules.map((r: ConflationRule) => r.forBarSpacingLargerThan));

		// Add default rules that don't conflict with custom rules
		for (const defaultRule of defaultRules) {
			if (!customSpacingValues.has(defaultRule.forBarSpacingLargerThan)) {
				mergedRules.push(defaultRule);
			}
		}

		mergedRules.push(...customRules);

		return mergedRules.sort((a: ConflationRule, b: ConflationRule) => b.forBarSpacingLargerThan - a.forBarSpacingLargerThan);
	}

	private _findConflationRule(barSpacing: number): ConflationRule {
		const rules = this._customRules || DEFAULT_CONFLATION_RULES;
		for (const rule of rules) {
			if (barSpacing >= rule.forBarSpacingLargerThan) {
				return rule;
			}
		}

		return { barsToMerge: 1, forBarSpacingLargerThan: 0.5 };
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
	 * Rebuilds conflated chunks for the given rule.
	 */
	private _buildChunks(
		data: readonly SeriesPlotRow<T>[],
		barsToMerge: number,
		customReducer?: (items: readonly unknown[]) => unknown,
		isCustomSeries: boolean = false,
		priceValueBuilder?: (item: unknown) => number[]
	): ConflatedChunk[] {
		const chunks: ConflatedChunk[] = [];
		let currentChunk: ConflatedChunk | null = null;
		let dataPointsInChunk = 0;
		let currentItems: unknown[] = [];

		for (let i = 0; i < data.length; i++) {
			const row = data[i];

			if (currentChunk === null || dataPointsInChunk >= barsToMerge) {
				// Finalize current chunk if it exists
				if (currentChunk !== null) {
					chunks.push(currentChunk);
				}

				// Start a new chunk
				currentItems = [row as unknown];
				currentChunk = this._createNewChunk(row);
				dataPointsInChunk = 1;
			} else {
				// Add to existing chunk
				this._updateChunk(currentChunk, row, currentItems, customReducer, isCustomSeries, priceValueBuilder);
				dataPointsInChunk++;
			}
		}

		// Add the last chunk if it exists
		if (currentChunk !== null) {
			chunks.push(currentChunk);
		}
		return chunks;
	}

	private _createNewChunk(row: SeriesPlotRow<T>): ConflatedChunk {
		const seedPrice = this._extractPrice(row);
		return {
			startIndex: row.index,
			endIndex: row.index,
			startTime: row.time as unknown as TimePoint,
			endTime: row.time as unknown as TimePoint,
			open: seedPrice,
			high: seedPrice,
			low: seedPrice,
			close: seedPrice,
			originalDataCount: 1,
		};
	}

	private _updateChunk(
		chunk: ConflatedChunk,
		row: SeriesPlotRow<T>,
		currentItems: unknown[],
		customReducer?: (items: readonly unknown[]) => unknown,
		isCustomSeries: boolean = false,
		priceValueBuilder?: (item: unknown) => number[]
	): void {
		chunk.endIndex = row.index;
		chunk.endTime = row.time as unknown as TimePoint;
		currentItems.push(row as unknown);

		const price = this._extractPrice(row);

		if (customReducer && currentItems.length > 0) {
			if (isCustomSeries && priceValueBuilder) {
				this._handleCustomSeriesConflation(chunk, currentItems, customReducer, priceValueBuilder);
			} else {
				this._handleBuiltInSeriesConflation(chunk, currentItems, customReducer);
			}
		} else {
			chunk.high = Math.max(chunk.high, price);
			chunk.low = Math.min(chunk.low, price);
			chunk.close = price;
		}

		chunk.originalDataCount++;
	}

	/**
	 * Handles conflation for custom series using a custom reducer.
	 */
	private _handleCustomSeriesConflation(
		chunk: ConflatedChunk,
		currentItems: unknown[],
		customReducer: (items: readonly unknown[]) => unknown,
		priceValueBuilder: (item: unknown) => number[]
	): void {
		// Convert SeriesPlotRow items to CustomConflationContext for custom series
		const contextItems = this._convertToContextItems(currentItems, priceValueBuilder);
		const aggregatedData = customReducer(contextItems);

		// Store the conflated data result on the chunk
		chunk.conflatedData = aggregatedData;

		// Update OHLC values based on the aggregated data
		const priceValues = priceValueBuilder(aggregatedData);
		const aggregatedPrice = priceValues.length > 0 ? priceValues[priceValues.length - 1] : 0;

		chunk.high = Math.max(chunk.high, aggregatedPrice);
		chunk.low = Math.min(chunk.low, aggregatedPrice);
		chunk.close = aggregatedPrice;
	}

	/**
	 * Handles conflation for built-in series using a custom reducer.
	 */
	private _handleBuiltInSeriesConflation(
		chunk: ConflatedChunk,
		currentItems: unknown[],
		customReducer: (items: readonly unknown[]) => unknown
	): void {
		const aggregatedRow = customReducer(currentItems) as SeriesPlotRow<T>;
		const aggregatedPrice = this._extractPrice(aggregatedRow);

		chunk.high = Math.max(chunk.high, aggregatedPrice);
		chunk.low = Math.min(chunk.low, aggregatedPrice);
		chunk.close = aggregatedPrice;
	}

	/**
	 * Converts SeriesPlotRow items to CustomConflationContext items.
	 */
	private _convertToContextItems(
		items: unknown[],
		priceValueBuilder: (item: unknown) => number[]
	): CustomConflationContext[] {
		return items.map((item: unknown) => {
			const plotRow = item as SeriesPlotRow<T>;
			const customPlotRow = plotRow as SeriesPlotRow<T> & { data?: Record<string, unknown> };

			const itemData = customPlotRow.data || {};

			return {
				data: itemData,
				index: plotRow.index,
				originalTime: plotRow.originalTime,
				time: plotRow.time,
				priceValues: priceValueBuilder(itemData),
			} as unknown as CustomConflationContext;
		});
	}

	/**
	 * Converts conflated chunks back to SeriesPlotRow format.
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
						time: chunk.endTime,
						originalTime: chunk.endTime,
						value: [chunk.close, chunk.high, chunk.low, chunk.close], // Keep OHLC for compatibility
						data: conflatedData, // Use the actual conflated data from custom reducer
					};
					result.push(conflatedRow as unknown as SeriesPlotRow<T>);
				} else {
					const conflatedRow = {
						index: chunk.startIndex,
						time: chunk.endTime,
						originalTime: chunk.endTime,
						value: [chunk.close, chunk.high, chunk.low, chunk.close],
						data: {
							time: chunk.endTime,
						},
					};
					result.push(conflatedRow as unknown as SeriesPlotRow<T>);
				}
			} else {
				// built-in series use the standard format
				const conflatedRow = {
					index: chunk.startIndex,
					time: chunk.endTime,
					originalTime: chunk.endTime,
					value: [chunk.open, chunk.high, chunk.low, chunk.close],
				};
				result.push(conflatedRow as unknown as SeriesPlotRow<T>);
			}
		}

		return result;
	}

	private _extractPrice(row: SeriesPlotRow<T>): number {
		return row.value[PlotRowValueIndex.Close];
	}

	private _ensureCacheEntry(data: readonly SeriesPlotRow<T>[]): ConflationCacheEntry<T> {
		let entry = this._dataCache.get(data);
		if (entry === undefined) {
			entry = {
				version: this._getDataVersion(data),
				results: new Map(),
			};
			this._dataCache.set(data, entry);
		}
		return entry;
	}
}
