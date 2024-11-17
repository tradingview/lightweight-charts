import { IChartModelBase } from '../../model/chart-model';
import { PriceScale } from '../../model/price-scale';
import { ISeries } from '../../model/series';
import { SeriesType } from '../../model/series-options';
import { SeriesItemsIndexesRange, TimedValue } from '../../model/time-data';
import { ITimeScale } from '../../model/time-scale';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { IUpdatablePaneView, UpdateType } from './iupdatable-pane-view';
export declare abstract class SeriesPaneViewBase<TSeriesType extends SeriesType, ItemType extends TimedValue, TRenderer extends IPaneRenderer> implements IUpdatablePaneView {
    protected readonly _series: ISeries<TSeriesType>;
    protected readonly _model: IChartModelBase;
    protected _invalidated: boolean;
    protected _dataInvalidated: boolean;
    protected _optionsInvalidated: boolean;
    protected _items: ItemType[];
    protected _itemsVisibleRange: SeriesItemsIndexesRange | null;
    protected readonly abstract _renderer: TRenderer;
    private readonly _extendedVisibleRange;
    constructor(series: ISeries<TSeriesType>, model: IChartModelBase, extendedVisibleRange: boolean);
    update(updateType?: UpdateType): void;
    renderer(): IPaneRenderer | null;
    protected abstract _fillRawPoints(): void;
    protected _updateOptions(): void;
    protected abstract _convertToCoordinates(priceScale: PriceScale, timeScale: ITimeScale, firstValue: number): void;
    protected _clearVisibleRange(): void;
    protected abstract _prepareRendererData(): void;
    private _makeValid;
    private _makeValidImpl;
}
