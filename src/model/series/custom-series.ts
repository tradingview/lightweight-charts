import { ensure } from '../../helpers/assertions';

import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { ICustomSeriesPaneView } from '../icustom-series';
import { Series, SeriesOptionsInternal } from '../series';
import { CustomStyleOptions } from '../series-options';
import { SeriesCustomPaneView } from './custom-pane-view';
import { SeriesDefinition } from './series-def';

export const customStyleDefaults: CustomStyleOptions = {
	color: '#2196f3',
};
const seriesType = 'Custom';
const createPaneView = (series: Series<typeof seriesType>, model: IChartModelBase, customPaneView?: ICustomSeriesPaneView<unknown>): IUpdatablePaneView => {
	const paneView = ensure(customPaneView);
	return new SeriesCustomPaneView(series, model, paneView);
};

export const createCustomSeriesDefinition = (paneView: ICustomSeriesPaneView<unknown>): SeriesDefinition<'Custom'> => ({
	type: 'Custom' as const,
	isBuiltIn: false as const,
	defaultOptions: { ...customStyleDefaults, ...paneView.defaultOptions() },
	createSeries: (model: IChartModelBase, options: SeriesOptionsInternal<typeof seriesType>): Series<typeof seriesType> => {
		return new Series<typeof seriesType>(model, seriesType, options, createPaneView, paneView);
	},
});
