import { CustomData, ICustomSeriesPaneView } from '../icustom-series';
import { CustomSeriesOptions } from '../series-options';
import { createCustomSeriesDefinition } from './custom-series';
import { CustomSeriesDefinition } from './series-def';

/**
 * Function to create a custom series
 *
 * example:
 * ```ts
 * const customSeries = createCustomSeries({
 * 	// custom pane view implementation
 * });
 *
 * chart.addSeries(customSeries, {
 * 	// custom series options
 * });
 * ```
 * @returns Custom series definition
 */
export function createCustomSeries<
	HorzScaleItem,
	TData extends CustomData<HorzScaleItem>,
	TOptions extends CustomSeriesOptions,
>(customPaneView: ICustomSeriesPaneView<HorzScaleItem, TData, TOptions>): CustomSeriesDefinition<HorzScaleItem, TData, TOptions> {
	return createCustomSeriesDefinition(customPaneView);
}
