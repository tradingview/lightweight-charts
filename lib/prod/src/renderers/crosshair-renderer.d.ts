import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';
import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
import { LineStyle, LineWidth } from './draw-line';
export interface CrosshairLineStyle {
    lineStyle: LineStyle;
    lineWidth: LineWidth;
    color: string;
    visible: boolean;
}
export interface CrosshairRendererData {
    vertLine: CrosshairLineStyle;
    horzLine: CrosshairLineStyle;
    x: number;
    y: number;
}
export declare class CrosshairRenderer extends BitmapCoordinatesPaneRenderer {
    private readonly _data;
    constructor(data: CrosshairRendererData | null);
    protected _drawImpl({ context: ctx, bitmapSize, horizontalPixelRatio, verticalPixelRatio }: BitmapCoordinatesRenderingScope): void;
}
