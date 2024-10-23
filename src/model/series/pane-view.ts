import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { Series } from '../series';
import { SeriesType } from '../series-options';

export type BuiltInPaneViewFactory<T extends SeriesType> = (series: Series<T>, model: IChartModelBase) => IUpdatablePaneView;
