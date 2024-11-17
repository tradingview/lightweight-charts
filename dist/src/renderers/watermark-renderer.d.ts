import { MediaCoordinatesRenderingScope } from 'fancy-canvas';
import { MediaCoordinatesPaneRenderer } from './media-coordinates-pane-renderer';
export interface WatermarkRendererLineData {
    text: string;
    font: string;
    lineHeight: number;
    vertOffset: number;
    zoom: number;
}
/**
 * Represents a horizontal alignment.
 */
export type HorzAlign = 'left' | 'center' | 'right';
/**
 * Represents a vertical alignment.
 */
export type VertAlign = 'top' | 'center' | 'bottom';
export interface WatermarkRendererData {
    lines: WatermarkRendererLineData[];
    color: string;
    visible: boolean;
    horzAlign: HorzAlign;
    vertAlign: VertAlign;
}
export declare class WatermarkRenderer extends MediaCoordinatesPaneRenderer {
    private readonly _data;
    private _metricsCache;
    constructor(data: WatermarkRendererData);
    protected _drawImpl(renderingScope: MediaCoordinatesRenderingScope): void;
    protected _drawBackgroundImpl(renderingScope: MediaCoordinatesRenderingScope): void;
    private _metrics;
    private _fontCache;
}
