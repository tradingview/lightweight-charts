
import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { ISeries } from '../series';
import { HistogramStyleOptions } from '../series-options';
import { SeriesHistogramPaneView } from './histogram-pane-view';
import { BuiltInSeriesDefinition } from './series-def';

export const histogramStyleDefaults: HistogramStyleOptions = {
	color: '#26a69a',
	base: 0,
};

export const histogramSeries: BuiltInSeriesDefinition<'Histogram'> = {
	type: 'Histogram' as const,
	isBuiltIn: true as const,
	defaultOptions: histogramStyleDefaults,
	createPaneView: (series: ISeries<'Histogram'>, model: IChartModelBase): IUpdatablePaneView => new SeriesHistogramPaneView(series, model),
};

