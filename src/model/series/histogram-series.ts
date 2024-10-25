
import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { Series, SeriesOptionsInternal } from '../series';
import { HistogramStyleOptions } from '../series-options';
import { SeriesHistogramPaneView } from './histogram-pane-view';
import { SeriesDefinition } from './series-def';

export const histogramStyleDefaults: HistogramStyleOptions = {
	color: '#26a69a',
	base: 0,
};
const seriesType = 'Histogram';
const createPaneView = (series: Series<typeof seriesType>, model: IChartModelBase): IUpdatablePaneView => new SeriesHistogramPaneView(series, model);

export const histogramSeries: SeriesDefinition<typeof seriesType> = {
	type: seriesType,
	isBuiltIn: true as const,
	defaultOptions: histogramStyleDefaults,
	createSeries: (model: IChartModelBase, options: SeriesOptionsInternal<typeof seriesType>): Series<typeof seriesType> => {
		return new Series<typeof seriesType>(model, seriesType, options, createPaneView);
	},
};

