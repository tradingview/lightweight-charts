import { SeriesStyleOptionsMap, SeriesType } from '../series-options';
import { BuiltInPaneViewFactory } from './pane-view';

export interface BaseSeriesDefinition<T extends SeriesType> {
	readonly type: T;
	readonly defaultOptions: SeriesStyleOptionsMap[T];
}

export interface BuiltInSeriesDefinition<T extends SeriesType> extends BaseSeriesDefinition<T> {
	readonly isBuiltIn: true;
	/**
	* @internal
	*/
	createPaneView: BuiltInPaneViewFactory<T>;
}

export interface CustomSeriesDefinition<T extends SeriesType> extends BaseSeriesDefinition<T> {
	readonly isBuiltIn: false;
}

export type SeriesDefinition<T extends SeriesType> =
| BuiltInSeriesDefinition<T>
| CustomSeriesDefinition<T>;

