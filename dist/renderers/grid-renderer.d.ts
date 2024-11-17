import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';
import { PriceMark } from '../model/price-scale';
import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
import { LineStyle } from './draw-line';
export interface GridMarks {
    coord: number;
}
export interface GridRendererData {
    vertLinesVisible: boolean;
    vertLinesColor: string;
    vertLineStyle: LineStyle;
    timeMarks: GridMarks[];
    horzLinesVisible: boolean;
    horzLinesColor: string;
    horzLineStyle: LineStyle;
    priceMarks: PriceMark[];
}
export declare class GridRenderer extends BitmapCoordinatesPaneRenderer {
    private _data;
    setData(data: GridRendererData | null): void;
    protected _drawImpl({ context: ctx, bitmapSize, horizontalPixelRatio, verticalPixelRatio }: BitmapCoordinatesRenderingScope): void;
}
