import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';
import { PricedValue } from '../model/price-scale';
import { SeriesItemsIndexesRange, TimedValue } from '../model/time-data';
import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
export interface HistogramItem extends PricedValue, TimedValue {
    barColor: string;
}
export interface PaneRendererHistogramData {
    items: HistogramItem[];
    barSpacing: number;
    histogramBase: number;
    visibleRange: SeriesItemsIndexesRange | null;
}
export declare class PaneRendererHistogram extends BitmapCoordinatesPaneRenderer {
    private _data;
    private _precalculatedCache;
    setData(data: PaneRendererHistogramData): void;
    protected _drawImpl({ context: ctx, horizontalPixelRatio, verticalPixelRatio }: BitmapCoordinatesRenderingScope): void;
    private _fillPrecalculatedCache;
}
