import { ensure } from '../../helpers/assertions';

import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { CustomData, ICustomSeriesPaneView } from '../icustom-series';
import { ISeries } from '../iseries';
import { CustomSeriesOptions, CustomStyleOptions } from '../series-options';
import { SeriesCustomPaneView } from './custom-pane-view';
import { SeriesDefinition, SeriesDefinitionInternal } from './series-def';

export const customStyleDefaults: CustomStyleOptions = {
	color: '#2196f3',
};
const seriesType = 'Custom';
const createPaneView = <HorzScaleItem>(series: ISeries<typeof seriesType>, model: IChartModelBase, customPaneView?: ICustomSeriesPaneView<HorzScaleItem>): IUpdatablePaneView => {
	const paneView = ensure(customPaneView);
	return new SeriesCustomPaneView(series, model, paneView);
};

export const createCustomSeriesDefinition = <
	HorzScaleItem,
	TData extends CustomData<HorzScaleItem> = CustomData<HorzScaleItem>,
	TSeriesOptions extends CustomSeriesOptions = CustomSeriesOptions
>(paneView: ICustomSeriesPaneView<HorzScaleItem, TData, TSeriesOptions>): SeriesDefinition<'Custom'> => {
	const definition: SeriesDefinitionInternal<'Custom'> = {
		type: seriesType,
		isBuiltIn: false as const,
		defaultOptions: { ...customStyleDefaults, ...paneView.defaultOptions() },
		/**
		 * @internal
		 */
		createPaneView: createPaneView,
		customPaneView: paneView,
	};
	return definition as SeriesDefinition<'Custom'>;
};
