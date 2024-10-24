import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { ISeries } from '../series';
import { BarStyleOptions } from '../series-options';
import { SeriesBarsPaneView } from './bars-pane-view';
import { BuiltInSeriesDefinition } from './series-def';

export const barStyleDefaults: BarStyleOptions = {
	upColor: '#26a69a',
	downColor: '#ef5350',
	openVisible: true,
	thinBars: true,
};

export class BarSeries implements BuiltInSeriesDefinition<'Bar'> {
	// eslint-disable-next-line @typescript-eslint/tslint/config
	public readonly type = 'Bar' as const;
	// eslint-disable-next-line @typescript-eslint/tslint/config
	public readonly isBuiltIn = true as const;

	public readonly defaultOptions: BarStyleOptions = barStyleDefaults;
	/**
	* @internal
	*/
	public createPaneView(series: ISeries<'Bar'>, model: IChartModelBase): IUpdatablePaneView {
		return new SeriesBarsPaneView(series, model);
	}
}

export const barSeries = new BarSeries();
