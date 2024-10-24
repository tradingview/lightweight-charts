import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { ISeries } from '../series';
import { SeriesType } from '../series-options';

export type BuiltInPaneViewFactory<T extends SeriesType> = (series: ISeries<T>, model: IChartModelBase) => IUpdatablePaneView;
