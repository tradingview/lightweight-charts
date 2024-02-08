import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';
import { Coordinate } from '../model/coordinate';
import { PricedValue } from '../model/price-scale';
import { SeriesItemsIndexesRange, TimedValue } from '../model/time-data';
import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
import { LinePoint, LineStyle, LineType, LineWidth } from './draw-line';
export type AreaFillItemBase = TimedValue & PricedValue & LinePoint;
export interface PaneRendererAreaDataBase<TItem extends AreaFillItemBase = AreaFillItemBase> {
    items: TItem[];
    lineType: LineType;
    lineWidth: LineWidth;
    lineStyle: LineStyle;
    baseLevelCoordinate: Coordinate | null;
    invertFilledArea: boolean;
    barWidth: number;
    visibleRange: SeriesItemsIndexesRange | null;
}
export declare abstract class PaneRendererAreaBase<TData extends PaneRendererAreaDataBase> extends BitmapCoordinatesPaneRenderer {
    protected _data: TData | null;
    setData(data: TData): void;
    protected _drawImpl(renderingScope: BitmapCoordinatesRenderingScope): void;
    protected abstract _fillStyle(renderingScope: BitmapCoordinatesRenderingScope, item: TData['items'][0]): CanvasRenderingContext2D['fillStyle'];
}
