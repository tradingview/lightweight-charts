import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { CustomData, ICustomSeriesPaneView } from '../icustom-series';
import { ISeries } from '../iseries';
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
	/** @internal */
	readonly defaultOptions: CustomStyleOptions;
	/** @internal */
	customPaneView: ICustomSeriesPaneView<HorzScaleItem, TData, TOptions>;
}
export interface CustomSeriesDefinitionInternal<
	HorzScaleItem,
	TData extends CustomData<HorzScaleItem>,
	TOptions extends CustomSeriesOptions
> extends CustomSeriesDefinition<HorzScaleItem, TData, TOptions> {
	createPaneView: (series: ISeries<'Custom'>, model: IChartModelBase, customPaneView?: ICustomSeriesPaneView<HorzScaleItem, TData, TOptions>) => IUpdatablePaneView;
}

export const isSeriesDefinition = <T extends SeriesType>(value: unknown): value is SeriesDefinitionInternal<T> => {
	return (value as SeriesDefinitionInternal<T>).createPaneView !== undefined;
};

export interface SeriesDefinitionInternal<T extends SeriesType> extends SeriesDefinition<T> {
	createPaneView: (series: ISeries<T>, model: IChartModelBase, customPaneView?: ICustomSeriesPaneView<unknown>) => IUpdatablePaneView;
}
