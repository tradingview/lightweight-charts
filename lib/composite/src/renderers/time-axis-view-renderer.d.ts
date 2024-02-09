import { CanvasRenderingTarget2D } from 'fancy-canvas';
import { ITimeAxisViewRenderer, TimeAxisViewRendererOptions } from './itime-axis-view-renderer';
export interface TimeAxisViewRendererData {
    width: number;
    text: string;
    coordinate: number;
    color: string;
    background: string;
    visible: boolean;
    tickVisible: boolean;
}
export declare class TimeAxisViewRenderer implements ITimeAxisViewRenderer {
    private _data;
    constructor();
    setData(data: TimeAxisViewRendererData): void;
    draw(target: CanvasRenderingTarget2D, rendererOptions: TimeAxisViewRendererOptions): void;
}
