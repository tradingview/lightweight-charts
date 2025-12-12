import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { CustomConflationContext, CustomData, CustomSeriesPricePlotValues, CustomSeriesWhitespaceData } from '../icustom-series';
import { ISeries } from '../iseries';
import { SeriesType } from '../series-options';

export interface ISeriesCustomPaneView<
	HorzScaleItem = unknown,
	TData extends CustomData<HorzScaleItem> = CustomData<HorzScaleItem>
> extends IUpdatablePaneView {
	priceValueBuilder(plotRow: TData | CustomSeriesWhitespaceData<HorzScaleItem>): CustomSeriesPricePlotValues;
	isWhitespace(data: TData | CustomSeriesWhitespaceData<HorzScaleItem>): data is CustomSeriesWhitespaceData<HorzScaleItem>;
	conflationReducer: undefined | ((item1: CustomConflationContext<HorzScaleItem, TData>, item2: CustomConflationContext<HorzScaleItem, TData>) => TData);
}
export type BuiltInPaneViewFactory<T extends SeriesType> = (series: ISeries<T>, model: IChartModelBase) => IUpdatablePaneView;
