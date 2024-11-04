import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { CustomData, ICustomSeriesPaneView } from '../icustom-series';
import { Series } from '../series';
import { CustomSeriesOptions, CustomStyleOptions, SeriesStyleOptionsMap, SeriesType } from '../series-options';

export interface SeriesDefinition<T extends SeriesType> {
	readonly type: T;
	readonly isBuiltIn: boolean;
	readonly defaultOptions: SeriesStyleOptionsMap[T];
}
export interface CustomSeriesDefinition<
	HorzScaleItem,
	TData extends CustomData<HorzScaleItem>,
	TOptions extends CustomSeriesOptions
> {
	readonly type: 'Custom';
	readonly isBuiltIn: boolean;
	readonly defaultOptions: CustomStyleOptions;
	customPaneView: ICustomSeriesPaneView<HorzScaleItem, TData, TOptions>;
}
export interface CustomSeriesDefinitionInternal<
	HorzScaleItem,
	TData extends CustomData<HorzScaleItem>,
	TOptions extends CustomSeriesOptions
> extends CustomSeriesDefinition<HorzScaleItem, TData, TOptions> {
	createPaneView: (series: Series<'Custom'>, model: IChartModelBase, customPaneView?: ICustomSeriesPaneView<HorzScaleItem, TData, TOptions>) => IUpdatablePaneView;
}

export const isSeriesDefinition = <T extends SeriesType>(value: unknown): value is SeriesDefinitionInternal<T> => {
	return (value as SeriesDefinitionInternal<T>).createPaneView !== undefined;
};

export interface SeriesDefinitionInternal<T extends SeriesType> extends SeriesDefinition<T> {
	createPaneView: (series: Series<T>, model: IChartModelBase, customPaneView?: ICustomSeriesPaneView<unknown>) => IUpdatablePaneView;
}
