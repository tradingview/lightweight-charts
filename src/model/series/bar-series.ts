import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { Series } from '../series';
import { BarStyleOptions } from '../series-options';
import { SeriesBarsPaneView } from './bars-pane-view';
import { SeriesDefinition, SeriesDefinitionInternal } from './series-def';

export const barStyleDefaults: BarStyleOptions = {
	upColor: '#26a69a',
	downColor: '#ef5350',
	openVisible: true,
	thinBars: true,
};
const seriesType = 'Bar';
const createPaneView = (series: Series<typeof seriesType>, model: IChartModelBase): IUpdatablePaneView => new SeriesBarsPaneView(series, model);

export const createSeries = (): SeriesDefinition<typeof seriesType> => {
	const definition: SeriesDefinitionInternal<typeof seriesType> = {
		type: seriesType,
		isBuiltIn: true as const,
		defaultOptions: barStyleDefaults,
		/**
		 * @internal
		 */
		createPaneView: createPaneView,
	};

	return definition as SeriesDefinition<typeof seriesType>;
};
export const barSeries: SeriesDefinition<typeof seriesType> = createSeries();
