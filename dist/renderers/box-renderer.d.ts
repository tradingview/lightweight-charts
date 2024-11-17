import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';
import { Coordinate } from '../model/coordinate';
import { Point } from '../model/point';
import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
import { LineStyle, LineWidth } from './draw-line';
export interface BoxRendererData {
    fillColor: string;
    fillOpacity: number;
    borderColor: string;
    borderStyle: LineStyle;
    borderWidth: LineWidth;
    borderVisible: boolean;
    corners: Point[];
    xLow: Coordinate;
    xHigh: Coordinate;
    yLow: Coordinate;
    yHigh: Coordinate;
    visible?: boolean;
    width: number;
    height: number;
}
export declare class BoxRenderer extends BitmapCoordinatesPaneRenderer {
    private _data;
    setData(data: BoxRendererData): void;
    protected _drawImpl({ context: ctx, bitmapSize, horizontalPixelRatio, verticalPixelRatio }: BitmapCoordinatesRenderingScope): void;
    private _hexToRgba;
}
