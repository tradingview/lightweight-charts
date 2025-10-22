import { ConflationRule } from './types';

/**
 * Default conflation rules for adaptive conflation.
 * These rules determine how many bars to merge based on bar spacing.
 */
export const DEFAULT_CONFLATION_RULES: ConflationRule[] = [
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
		forBarSpacingLargerThan: 0.01,
	},
	{
		barsToMerge: 200,
		forBarSpacingLargerThan: 0.005,
	},
	{
		barsToMerge: 300,
		forBarSpacingLargerThan: 0,
	},
];

/**
 * Single source of truth for precomputable factors derived from rules.
 * These are the factors that should be used for precomputation.
 */
export const DEFAULT_CONFLATION_FACTORS: number[] = Array.from(
	new Set(DEFAULT_CONFLATION_RULES.map((r: ConflationRule) => r.barsToMerge))
).sort((a: number, b: number) => a - b);

/**
 * Threshold in pixels below which conflation should be considered.
 * When bars would be rendered in less than this many pixels, we conflate them.
 */
export const CONFLATION_THRESHOLD_PIXELS = 0.5;

/**
 * Default batch size for batch conflation processing.
 * This determines how many items are processed in each batch.
 */
export const DEFAULT_BATCH_SIZE = 10000;

/**
 * Default cache settings.
 * Note: We're using WeakMap for automatic garbage collection, so explicit eviction policies are not needed.
 */
export const DEFAULT_CACHE_SETTINGS = {
	/**
	 * Whether to enable cache statistics tracking.
	 * Note: This is a basic implementation since WeakMap doesn't allow iteration.
	 */
	enableStats: false,
};

export const CONFLATION_ERROR_MESSAGES = {
	emptyArray: 'Cannot conflate empty items array',
	invalidFactor: 'Conflation factor must be greater than 1',
	missingPriceValueBuilder: 'Custom series with conflation reducer must have a priceValueBuilder method',
	invalidData: 'Invalid data provided for conflation',
} as const;
