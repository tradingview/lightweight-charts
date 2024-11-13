import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { CustomData, CustomSeriesPricePlotValues, CustomSeriesWhitespaceData } from '../icustom-series';
import { ISeries } from '../iseries';
import { SeriesType } from '../series-options';

export interface ISeriesCustomPaneView extends IUpdatablePaneView {
	priceValueBuilder(plotRow: CustomData<unknown> | CustomSeriesWhitespaceData<unknown>): CustomSeriesPricePlotValues;
	isWhitespace(data: CustomData<unknown> | CustomSeriesWhitespaceData<unknown>): data is CustomSeriesWhitespaceData<unknown>;
}
export type BuiltInPaneViewFactory<T extends SeriesType> = (series: ISeries<T>, model: IChartModelBase) => IUpdatablePaneView;
