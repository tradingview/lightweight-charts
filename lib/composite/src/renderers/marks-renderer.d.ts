import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';
import { SeriesItemsIndexesRange } from '../model/time-data';
import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
import { LineItemBase } from './line-renderer-base';
export interface MarksRendererData {
    items: LineItemBase[];
    lineColor: string;
    lineWidth: number;
    backColor: string;
    radius: number;
    visibleRange: SeriesItemsIndexesRange | null;
}
export declare class PaneRendererMarks extends BitmapCoordinatesPaneRenderer {
    protected _data: MarksRendererData | null;
    setData(data: MarksRendererData): void;
    protected _drawImpl({ context: ctx, horizontalPixelRatio, verticalPixelRatio }: BitmapCoordinatesRenderingScope): void;
}
