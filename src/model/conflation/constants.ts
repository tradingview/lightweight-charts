/**
 * Power-of-2 conflation levels supported by the system.
 * These represent the number of original data points that get merged into one conflated point.
 */
export const CONFLATION_LEVELS = [2, 4, 8, 16, 32, 64, 128, 256, 512] as const;

/**
 * Maximum conflation level supported.
 */
export const MAX_CONFLATION_LEVEL = 512;

/**
 * Device pixel ratio threshold for conflation.
 * Conflation happens when barSpacing is less than 1.0 / devicePixelRatio.
 * This ensures we only conflate when we can't physically display the detail.
 */
export const DPR_CONFLATION_THRESHOLD = 1;

export const CONFLATION_ERROR_MESSAGES = {
	missingPriceValueBuilder: 'Custom series with conflation reducer must have a priceValueBuilder method',
} as const;
