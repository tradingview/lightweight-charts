import { ensure } from '../../helpers/assertions';

import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { ICustomSeriesPaneView } from '../icustom-series';
import { Series } from '../series';
import { CustomStyleOptions } from '../series-options';
import { SeriesCustomPaneView } from './custom-pane-view';
import { SeriesDefinition, SeriesDefinitionInternal } from './series-def';

export const customStyleDefaults: CustomStyleOptions = {
	color: '#2196f3',
};
const seriesType = 'Custom';
const createPaneView = (series: Series<typeof seriesType>, model: IChartModelBase, customPaneView?: ICustomSeriesPaneView<unknown>): IUpdatablePaneView => {
	const paneView = ensure(customPaneView);
	return new SeriesCustomPaneView(series, model, paneView);
};

export const createCustomSeriesDefinition = (paneView: ICustomSeriesPaneView<unknown>): SeriesDefinition<'Custom'> => {
	const definition: SeriesDefinitionInternal<typeof seriesType> = {
		type: seriesType,
		isBuiltIn: false as const,
		defaultOptions: { ...customStyleDefaults, ...paneView.defaultOptions() },
		/**
		 * @internal
		 */
		createPaneView: createPaneView,
		/**
		 * @internal
		 */
		customPaneView: paneView,
	};
	return definition as SeriesDefinition<typeof seriesType>;
};

