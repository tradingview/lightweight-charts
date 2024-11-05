import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { ISeries } from '../iseries';
import { HistogramStyleOptions } from '../series-options';
import { SeriesHistogramPaneView } from './histogram-pane-view';
import { SeriesDefinition, SeriesDefinitionInternal } from './series-def';

export const histogramStyleDefaults: HistogramStyleOptions = {
	color: '#26a69a',
	base: 0,
};
const seriesType = 'Histogram';

const createPaneView = (series: ISeries<typeof seriesType>, model: IChartModelBase): IUpdatablePaneView => new SeriesHistogramPaneView(series, model);

export const createSeries = (): SeriesDefinition<typeof seriesType> => {
	const definition: SeriesDefinitionInternal<typeof seriesType> = {
		type: seriesType,
		isBuiltIn: true as const,
		defaultOptions: histogramStyleDefaults,
		/**
		 * @internal
		 */
		createPaneView: createPaneView,
	};
	return definition as SeriesDefinition<typeof seriesType>;
};
export const histogramSeries: SeriesDefinition<typeof seriesType> = createSeries();
