import { ensure } from '../../helpers/assertions';

import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { CustomData, ICustomSeriesPaneView } from '../icustom-series';
import { Series } from '../series';
import { CustomSeriesOptions, CustomStyleOptions } from '../series-options';
import { SeriesCustomPaneView } from './custom-pane-view';
import { CustomSeriesDefinition, CustomSeriesDefinitionInternal } from './series-def';

export const customStyleDefaults: CustomStyleOptions = {
	color: '#2196f3',
};
const seriesType = 'Custom';
const createPaneView = <HorzScaleItem>(series: Series<typeof seriesType>, model: IChartModelBase, customPaneView?: ICustomSeriesPaneView<HorzScaleItem>): IUpdatablePaneView => {
	const paneView = ensure(customPaneView);
	return new SeriesCustomPaneView(series, model, paneView);
};

export const createCustomSeriesDefinition = <
	HorzScaleItem,
	TData extends CustomData<HorzScaleItem> = CustomData<HorzScaleItem>,
	TSeriesOptions extends CustomSeriesOptions = CustomSeriesOptions
>(paneView: ICustomSeriesPaneView<HorzScaleItem, TData, TSeriesOptions>): CustomSeriesDefinition<HorzScaleItem, TData, TSeriesOptions> => {
	const definition: CustomSeriesDefinitionInternal<HorzScaleItem, TData, TSeriesOptions> = {
		type: seriesType,
		isBuiltIn: false as const,
		defaultOptions: { ...customStyleDefaults, ...paneView.defaultOptions() },
		/**
		 * @internal
		 */
		createPaneView: createPaneView,
		customPaneView: paneView,
	};
	return definition as CustomSeriesDefinition<HorzScaleItem, TData, TSeriesOptions>;
};

export function isCustomSeriesDefinition<
    HorzScaleItem,
    TData extends CustomData<HorzScaleItem> = CustomData<HorzScaleItem>,
    TOptions extends CustomSeriesOptions = CustomSeriesOptions
>(def: unknown): def is CustomSeriesDefinition<HorzScaleItem, TData, TOptions> {
	return (def as CustomSeriesDefinition<HorzScaleItem, TData, TOptions>)?.type === 'Custom';
}
