export type {
	ConflationRule,
	ConflatedChunk,
	ConflationStrategy,
	CustomConflationStrategy,
	ConflationConfig,
	ConflationResult,
	ConflationCacheEntry,
	StreamingConflationProcessor,
} from './types';

export {
	getDefaultConflationStrategy,
	DEFAULT_CONFLATION_RULES,
	DEFAULT_CONFLATION_FACTORS,
} from './strategies';

export type { BuiltInConflationStrategies } from './strategies';

export {
	StreamingConflationProcessorImpl,
	createStreamingConflationProcessor,
	BatchConflationProcessor,
	IncrementalConflationProcessor,
} from './streaming-processor';
