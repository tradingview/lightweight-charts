import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { ICustomSeriesPaneView } from '../icustom-series';
import { ISeries } from '../series';
import { CustomStyleOptions } from '../series-options';
import { SeriesCustomPaneView } from './custom-pane-view';
import { SeriesDefinition } from './series-def';

export const customStyleDefaults: CustomStyleOptions = {
	color: '#2196f3',
};

export const createCustomSeriesDefinition = (paneView: ICustomSeriesPaneView<unknown>): SeriesDefinition<'Custom'> => ({
	type: 'Custom' as const,
	isBuiltIn: false as const,
	defaultOptions: { ...customStyleDefaults, ...paneView.defaultOptions() },
	createPaneView: (series: ISeries<'Custom'>, model: IChartModelBase): IUpdatablePaneView => new SeriesCustomPaneView(series, model, paneView),
});
