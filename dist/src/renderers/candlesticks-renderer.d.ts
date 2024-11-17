import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';
import { CandlesticksColorerStyle } from '../model/series-bar-colorer';
import { SeriesItemsIndexesRange } from '../model/time-data';
import { BarCandlestickItemBase } from './bars-renderer';
import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
export interface CandlestickItem extends BarCandlestickItemBase, CandlesticksColorerStyle {
}
export interface PaneRendererCandlesticksData {
    bars: readonly CandlestickItem[];
    barSpacing: number;
    wickVisible: boolean;
    borderVisible: boolean;
    visibleRange: SeriesItemsIndexesRange | null;
}
export declare class PaneRendererCandlesticks extends BitmapCoordinatesPaneRenderer {
    private _data;
    private _barWidth;
    setData(data: PaneRendererCandlesticksData): void;
    protected _drawImpl(renderingScope: BitmapCoordinatesRenderingScope): void;
    private _drawWicks;
    private _calculateBorderWidth;
    private _drawBorder;
    private _drawCandles;
}
