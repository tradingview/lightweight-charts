import { CustomBox } from '../../model/custom-box';
import { Series } from '../../model/series';
import { SeriesType } from '../../model/series-options';
import { SeriesBoxPaneView } from './series-box-pane-view';
export declare class CustomBoxPaneView extends SeriesBoxPaneView {
    private readonly _box;
    constructor(series: Series<SeriesType>, box: CustomBox);
    protected _updateImpl(): void;
}
