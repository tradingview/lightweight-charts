import { SeriesPlotRow } from '../series-data';
import {
	SeriesType,
} from '../series-options';
import { DEFAULT_BATCH_SIZE } from './constants';
import { ConflationStrategy, StreamingConflationProcessor } from './types';

export class StreamingConflationProcessorImpl<T extends SeriesType> implements StreamingConflationProcessor<T> {
	private _strategy: ConflationStrategy<T>;
	private _barsToMerge: number;
	private _currentBuffer: SeriesPlotRow<T>[] = [];
	private _itemsProcessed: number = 0;
	private _chunksGenerated: number = 0;

	public constructor(strategy: ConflationStrategy<T>, barsToMerge: number) {
		this._strategy = strategy;
		this._barsToMerge = barsToMerge;
	}

	public process(chunk: readonly SeriesPlotRow<T>[]): SeriesPlotRow<T>[] {
		const results: SeriesPlotRow<T>[] = [];

		for (const item of chunk) {
			this._currentBuffer.push(item);
			this._itemsProcessed++;

			// When we have enough items, create a conflated chunk
			if (this._currentBuffer.length >= this._barsToMerge) {
				const conflatedItem = this._strategy.reducer(this._currentBuffer);
				results.push(conflatedItem);
				this._chunksGenerated++;
				this._currentBuffer = [];
			}
		}

		return results;
	}

	public reset(): void {
		this._currentBuffer = [];
		this._itemsProcessed = 0;
		this._chunksGenerated = 0;
	}

	public flush(): SeriesPlotRow<T>[] {
		if (this._currentBuffer.length > 0) {
			const result = this._strategy.reducer(this._currentBuffer);
			this._chunksGenerated++;
			this._currentBuffer = [];
			return [result];
		}
		return [];
	}

	public getStats(): {
		itemsProcessed: number;
		chunksGenerated: number;
		currentBufferSize: number;
	} {
		return {
			itemsProcessed: this._itemsProcessed,
			chunksGenerated: this._chunksGenerated,
			currentBufferSize: this._currentBuffer.length,
		};
	}

	public updateBarsToMerge(barsToMerge: number): void {
		// Flush current buffer before changing the merge count
		this._currentBuffer = [];
		this._barsToMerge = barsToMerge;
	}
}

export function createStreamingConflationProcessor<T extends SeriesType>(
	strategy: ConflationStrategy<T>,
	barsToMerge: number
): StreamingConflationProcessor<T> {
	return new StreamingConflationProcessorImpl(strategy, barsToMerge);
}

export class BatchConflationProcessor<T extends 'Line' | 'Area' | 'Baseline' | 'Candlestick' | 'Bar' | 'Histogram' | 'Custom'> {
	private _strategy: ConflationStrategy<T>;
	private _batchSize: number;

	public constructor(strategy: ConflationStrategy<T>, batchSize: number = DEFAULT_BATCH_SIZE) {
		this._strategy = strategy;
		this._batchSize = batchSize;
	}

	public async processBatch(
		data: readonly SeriesPlotRow<T>[],
		barsToMerge: number,
		onBatchComplete?: (batchIndex: number, batchResults: SeriesPlotRow<T>[]) => void
	): Promise<SeriesPlotRow<T>[]> {
		const results: SeriesPlotRow<T>[] = [];
		const processor = createStreamingConflationProcessor(this._strategy, barsToMerge);

		const yieldInterval = Math.max(1, Math.floor(this._batchSize / 10));
		let itemsProcessed = 0;

		for (let i = 0; i < data.length; i += this._batchSize) {
			const batch = data.slice(i, i + this._batchSize);
			const batchResults = processor.process(batch);
			results.push(...batchResults);
			itemsProcessed += batch.length;

			// Yield control to the event loop more frequently for better responsiveness
			if (itemsProcessed >= yieldInterval) {
				await new Promise<void>((resolve: () => void) => setTimeout(resolve, 0));
				itemsProcessed = 0;
			}

			if (onBatchComplete) {
				onBatchComplete(Math.floor(i / this._batchSize), batchResults);
			}
		}

		const remainingResults = processor.flush();
		results.push(...remainingResults);

		return results;
	}

	public processBatchSync(
		data: readonly SeriesPlotRow<T>[],
		barsToMerge: number,
		onBatchComplete?: (batchIndex: number, batchResults: SeriesPlotRow<T>[]) => void
	): SeriesPlotRow<T>[] {
		const results: SeriesPlotRow<T>[] = [];
		const processor = createStreamingConflationProcessor(this._strategy, barsToMerge);

		// Process data in batches
		for (let i = 0; i < data.length; i += this._batchSize) {
			const batch = data.slice(i, i + this._batchSize);
			const batchResults = processor.process(batch);
			results.push(...batchResults);

			if (onBatchComplete) {
				onBatchComplete(Math.floor(i / this._batchSize), batchResults);
			}
		}

		// Flush any remaining data
		const remainingResults = processor.flush();
		results.push(...remainingResults);

		return results;
	}
}

export class IncrementalConflationProcessor<T extends 'Line' | 'Area' | 'Baseline' | 'Candlestick' | 'Bar' | 'Histogram' | 'Custom'> {
	private _strategy: ConflationStrategy<T>;
	private _processedCount: number = 0;
	private _currentChunk: SeriesPlotRow<T>[] = [];

	public constructor(strategy: ConflationStrategy<T>) {
		this._strategy = strategy;
	}

	public addItem(item: SeriesPlotRow<T>, barsToMerge: number): SeriesPlotRow<T> | null {
		this._currentChunk.push(item);
		this._processedCount++;

		if (this._currentChunk.length >= barsToMerge) {
			const result = this._strategy.reducer(this._currentChunk);
			this._currentChunk = [];
			return result;
		}

		return null;
	}

	public flush(): SeriesPlotRow<T> | null {
		if (this._currentChunk.length > 0) {
			const result = this._strategy.reducer(this._currentChunk);
			this._currentChunk = [];
			return result;
		}
		return null;
	}

	public getStats(): { processedCount: number; pendingCount: number } {
		return {
			processedCount: this._processedCount,
			pendingCount: this._currentChunk.length,
		};
	}

	public reset(): void {
		this._currentChunk = [];
		this._processedCount = 0;
	}
}
