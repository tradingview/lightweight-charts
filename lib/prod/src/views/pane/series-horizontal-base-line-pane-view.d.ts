import { ISeries } from '../../model/series';
import { SeriesType } from '../../model/series-options';
import { SeriesHorizontalLinePaneView } from './series-horizontal-line-pane-view';
export declare class SeriesHorizontalBaseLinePaneView extends SeriesHorizontalLinePaneView {
    constructor(series: ISeries<SeriesType>);
    protected _updateImpl(): void;
}
