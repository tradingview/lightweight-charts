import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';
import { HoveredObject } from '../model/chart-model';
import { Coordinate } from '../model/coordinate';
import { SeriesMarkerShape } from '../model/series-markers';
import { SeriesItemsIndexesRange, TimedValue } from '../model/time-data';
import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
export interface SeriesMarkerText {
    content: string;
    x: Coordinate;
    y: Coordinate;
    width: number;
    height: number;
}
export interface SeriesMarkerRendererDataItem extends TimedValue {
    y: Coordinate;
    size: number;
    shape: SeriesMarkerShape;
    color: string;
    internalId: number;
    externalId?: string;
    text?: SeriesMarkerText;
}
export interface SeriesMarkerRendererData {
    items: SeriesMarkerRendererDataItem[];
    visibleRange: SeriesItemsIndexesRange | null;
}
export declare class SeriesMarkersRenderer extends BitmapCoordinatesPaneRenderer {
    private _data;
    private _textWidthCache;
    private _fontSize;
    private _fontFamily;
    private _font;
    setData(data: SeriesMarkerRendererData): void;
    setParams(fontSize: number, fontFamily: string): void;
    hitTest(x: Coordinate, y: Coordinate): HoveredObject | null;
    protected _drawImpl({ context: ctx, horizontalPixelRatio, verticalPixelRatio }: BitmapCoordinatesRenderingScope, isHovered: boolean, hitTestData?: unknown): void;
}
