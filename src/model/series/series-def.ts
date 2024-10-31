import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { ICustomSeriesPaneView } from '../icustom-series';
import { Series } from '../series';
import { SeriesStyleOptionsMap, SeriesType } from '../series-options';

export interface SeriesDefinition<T extends SeriesType> {
	readonly type: T;
	readonly isBuiltIn: boolean;
	readonly defaultOptions: SeriesStyleOptionsMap[T];
}

export const isSeriesDefinition = <T extends SeriesType>(value: unknown): value is SeriesDefinitionInternal<T> => {
	return (value as SeriesDefinitionInternal<T>).createPaneView !== undefined;
};

export interface SeriesDefinitionInternal<T extends SeriesType> extends SeriesDefinition<T> {
	createPaneView: (series: Series<T>, model: IChartModelBase, customPaneView?: ICustomSeriesPaneView<unknown>) => IUpdatablePaneView;
	customPaneView?: ICustomSeriesPaneView<unknown>;
}
