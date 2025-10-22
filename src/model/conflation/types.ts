import { TimePoint } from '../horz-scale-behavior-time/types';
import { SeriesPlotRow } from '../series-data';
import {
	SeriesType,
} from '../series-options';
import { TimePointIndex } from '../time-data';

/** Structure describing a single conflation rule */
export interface ConflationRule {
	/** Number of bars to merge */
	barsToMerge: number;
	/** Maximum allowed spacing between bars to merge */
	forBarSpacingLargerThan: number;
}

/**
 * Configuration for custom conflation rules.
 */
export interface CustomConflationRules {
	/**
	 * Custom rules for adaptive conflation.
	 * If provided, these will override the default rules.
	 */
	rules?: ConflationRule[];

	/**
	 * Whether to use the custom rules instead of the default ones.
	 * If false, the custom rules will be merged with the default ones.
	 */
	replaceDefaults?: boolean;
}

export interface ConflatedChunk<T extends SeriesType> {
	startIndex: TimePointIndex;
	endIndex: TimePointIndex;
	startTime: TimePoint;
	endTime: TimePoint;
	originalDataCount: number;
	data: SeriesPlotRow<T>;
}

/**
 * Base interface for all conflation strategies.
 * Provides a unified way to handle both built-in and custom series conflation.
 */
export interface BaseConflationStrategy<TInput, TOutput> {
	/**
	 * Reduces multiple input items into a single output item.
	 */
	reducer(items: readonly TInput[]): TOutput;

	/**
	 * Optional validation for input items.
	 */
	validate?(items: readonly TInput[]): boolean;

	/**
	 * Optional metadata about the conflation strategy.
	 */
	readonly name?: string;
	readonly description?: string;
}

/**
 * Conflation strategy for built-in series types.
 */
export interface ConflationStrategy<T extends SeriesType> extends BaseConflationStrategy<SeriesPlotRow<T>, SeriesPlotRow<T>> {
}

/**
 * Conflation strategy for custom series types.
 */
export interface CustomConflationStrategy<
	HorzScaleItem = unknown,
	TData = unknown
> extends BaseConflationStrategy<TData, TData> {
	/**
	 * Builds price values from custom data for auto-scaling and crosshair.
	 */
	priceValueBuilder(item: TData): number[];
}

/**
 * Union type for all conflation strategies.
 */
export type AnyConflationStrategy<T extends SeriesType> =
	| ConflationStrategy<T>
	| CustomConflationStrategy;

/**
 * Type-safe conflation configuration for a series.
 */
export interface ConflationConfig<T extends SeriesType> {
	strategy: T extends 'Custom' ? CustomConflationStrategy : ConflationStrategy<T>;
	rules: ConflationRule[];
	enabled: boolean;
}

/**
 * Conflation result with metadata.
 */
export interface ConflationResult<T extends SeriesType> {
	data: SeriesPlotRow<T>[];
	factor: number;
	rule: ConflationRule;
	originalCount: number;
	conflatedCount: number;
	performance?: {
		duration: number;
		memoryUsage?: number;
	};
}

/**
 * Conflation cache entry for performance optimization.
 */
export interface ConflationCacheEntry<T extends SeriesType> {
	version: number;
	results: Map<number, ConflationResult<T>>;
	inflight: Map<number, Promise<void>>;
	lastAccessed: number;
}
