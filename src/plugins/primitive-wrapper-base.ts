import { DeepPartial } from '../helpers/strict-type-checks';

/**
 * Interface for a primitive wrapper. It must be implemented to add some plugin to the chart.
 */
export interface IPrimitiveWrapper<T, Options = unknown> {
	/**
	 * @param options - Options to apply. The options are deeply merged with the current options.
	 */
	applyOptions(options: DeepPartial<Options>): void;
	/**
	 * Detaches the plugin from the pane/series.
	 */
	detach(): void;
}

/**
 * Interface for a plugin that adds primitive with options.
 */
export interface IPrimitiveWithOptions<Options = unknown> {
	/**
	 * @param options - Options to apply. The options are deeply merged with the current options.
	 */
	applyOptions(options: DeepPartial<Options>): void;
}
