import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';
import { Point } from '../model/point';
import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
export interface LastPriceCircleRendererData {
    radius: number;
    fillColor: string;
    strokeColor: string;
    seriesLineColor: string;
    seriesLineWidth: number;
    center: Point;
}
export declare class SeriesLastPriceAnimationRenderer extends BitmapCoordinatesPaneRenderer {
    private _data;
    setData(data: LastPriceCircleRendererData | null): void;
    data(): LastPriceCircleRendererData | null;
    protected _drawImpl({ context: ctx, horizontalPixelRatio, verticalPixelRatio }: BitmapCoordinatesRenderingScope): void;
}
