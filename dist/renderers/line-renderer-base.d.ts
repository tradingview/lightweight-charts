import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';
import { PricedValue } from '../model/price-scale';
import { SeriesItemsIndexesRange, TimedValue } from '../model/time-data';
import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
import { LinePoint, LineStyle, LineType, LineWidth } from './draw-line';
export type LineItemBase = TimedValue & PricedValue & LinePoint;
export interface PaneRendererLineDataBase<TItem extends LineItemBase = LineItemBase> {
    lineType?: LineType;
    items: TItem[];
    barWidth: number;
    lineWidth: LineWidth;
    lineStyle: LineStyle;
    visibleRange: SeriesItemsIndexesRange | null;
    pointMarkersRadius?: number;
}
export declare abstract class PaneRendererLineBase<TData extends PaneRendererLineDataBase> extends BitmapCoordinatesPaneRenderer {
    protected _data: TData | null;
    setData(data: TData): void;
    protected _drawImpl(renderingScope: BitmapCoordinatesRenderingScope): void;
    protected abstract _strokeStyle(renderingScope: BitmapCoordinatesRenderingScope, item: TData['items'][0]): CanvasRenderingContext2D['strokeStyle'];
}
