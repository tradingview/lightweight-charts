import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { ICustomSeriesPaneView } from '../icustom-series';
import { ISeries } from '../iseries';
import { SeriesStyleOptionsMap, SeriesType } from '../series-options';

/**
 * Series definition interface.
 */
export interface SeriesDefinition<T extends SeriesType> {
	/**
	 * Series type.
	 */
	readonly type: T;
	/**
	 * Indicates if the series is built-in.
	 */
	readonly isBuiltIn: boolean;
	/**
	 * Default series options.
	 */
	readonly defaultOptions: SeriesStyleOptionsMap[T];
}

export const isSeriesDefinition = <T extends SeriesType>(value: unknown): value is SeriesDefinitionInternal<T> => {
	return (value as SeriesDefinitionInternal<T>).createPaneView !== undefined;
};

export interface SeriesDefinitionInternal<T extends SeriesType> extends SeriesDefinition<T> {
	createPaneView: (series: ISeries<T>, model: IChartModelBase, customPaneView?: ICustomSeriesPaneView<unknown>) => IUpdatablePaneView;
	customPaneView?: ICustomSeriesPaneView<unknown>;
}
