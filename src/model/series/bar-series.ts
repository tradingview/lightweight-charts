import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { ISeries } from '../series';
import { BarStyleOptions } from '../series-options';
import { SeriesBarsPaneView } from './bars-pane-view';
import { SeriesDefinition } from './series-def';

export const barStyleDefaults: BarStyleOptions = {
	upColor: '#26a69a',
	downColor: '#ef5350',
	openVisible: true,
	thinBars: true,
};

export const barSeries: SeriesDefinition<'Bar'> = {
	type: 'Bar' as const,
	isBuiltIn: true as const,
	defaultOptions: barStyleDefaults,
	createPaneView: (series: ISeries<'Bar'>, model: IChartModelBase): IUpdatablePaneView => new SeriesBarsPaneView(series, model),
};
