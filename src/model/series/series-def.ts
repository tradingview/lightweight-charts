// import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { ICustomSeriesPaneView } from '../icustom-series';
import { Series, SeriesOptionsInternal } from '../series';
import { SeriesStyleOptionsMap, SeriesType } from '../series-options';

export interface SeriesDefinition<T extends SeriesType> {
	readonly type: T;
	readonly isBuiltIn: boolean;
	readonly defaultOptions: SeriesStyleOptionsMap[T];
	/**
	 * @internal
	 */
	createSeries(model: IChartModelBase, options: SeriesOptionsInternal<T>, customPaneView?: ICustomSeriesPaneView<unknown>): Series<T>;
}
