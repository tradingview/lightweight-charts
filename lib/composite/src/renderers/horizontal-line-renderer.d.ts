import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';
import { HoveredObject } from '../model/chart-model';
import { Coordinate } from '../model/coordinate';
import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
import { LineStyle, LineWidth } from './draw-line';
export interface HorizontalLineRendererData {
    color: string;
    lineStyle: LineStyle;
    lineWidth: LineWidth;
    y: Coordinate;
    visible?: boolean;
    externalId?: string;
}
export declare class HorizontalLineRenderer extends BitmapCoordinatesPaneRenderer {
    private _data;
    setData(data: HorizontalLineRendererData): void;
    hitTest(x: Coordinate, y: Coordinate): HoveredObject | null;
    protected _drawImpl({ context: ctx, bitmapSize, horizontalPixelRatio, verticalPixelRatio }: BitmapCoordinatesRenderingScope): void;
}
