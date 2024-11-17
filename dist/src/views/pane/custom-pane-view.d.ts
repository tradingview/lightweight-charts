import { CanvasRenderingTarget2D } from 'fancy-canvas';
import { IChartModelBase } from '../../model/chart-model';
import { CustomData, CustomSeriesPricePlotValues, CustomSeriesWhitespaceData, ICustomSeriesPaneRenderer, ICustomSeriesPaneView, PriceToCoordinateConverter } from '../../model/icustom-series';
import { PriceScale } from '../../model/price-scale';
import { Series } from '../../model/series';
import { TimedValue } from '../../model/time-data';
import { ITimeScale } from '../../model/time-scale';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { SeriesPaneViewBase } from './series-pane-view-base';
type CustomBarItemBase = TimedValue;
interface CustomBarItem extends CustomBarItemBase {
    barColor: string;
    originalData?: Record<string, unknown>;
}
declare class CustomSeriesPaneRendererWrapper implements IPaneRenderer {
    private _sourceRenderer;
    private _priceScale;
    constructor(sourceRenderer: ICustomSeriesPaneRenderer, priceScale: PriceToCoordinateConverter);
    draw(target: CanvasRenderingTarget2D, isHovered: boolean, hitTestData?: unknown): void;
}
export declare class SeriesCustomPaneView extends SeriesPaneViewBase<'Custom', CustomBarItem, CustomSeriesPaneRendererWrapper> {
    protected readonly _renderer: CustomSeriesPaneRendererWrapper;
    private readonly _paneView;
    constructor(series: Series<'Custom'>, model: IChartModelBase, paneView: ICustomSeriesPaneView<unknown>);
    priceValueBuilder(plotRow: CustomData<unknown> | CustomSeriesWhitespaceData<unknown>): CustomSeriesPricePlotValues;
    isWhitespace(data: CustomData<unknown> | CustomSeriesWhitespaceData<unknown>): data is CustomSeriesWhitespaceData<unknown>;
    protected _fillRawPoints(): void;
    protected _convertToCoordinates(priceScale: PriceScale, timeScale: ITimeScale): void;
    protected _prepareRendererData(): void;
}
export {};
