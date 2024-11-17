import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';
import { BarCoordinates, BarPrices } from '../model/bar';
import { BarColorerStyle } from '../model/series-bar-colorer';
import { SeriesItemsIndexesRange, TimedValue } from '../model/time-data';
import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
export type BarCandlestickItemBase = TimedValue & BarPrices & BarCoordinates;
export interface BarItem extends BarCandlestickItemBase, BarColorerStyle {
}
export interface PaneRendererBarsData {
    bars: readonly BarItem[];
    barSpacing: number;
    openVisible: boolean;
    thinBars: boolean;
    visibleRange: SeriesItemsIndexesRange | null;
}
export declare class PaneRendererBars extends BitmapCoordinatesPaneRenderer {
    private _data;
    private _barWidth;
    private _barLineWidth;
    setData(data: PaneRendererBarsData): void;
    protected _drawImpl({ context: ctx, horizontalPixelRatio, verticalPixelRatio }: BitmapCoordinatesRenderingScope): void;
    private _calcBarWidth;
}
