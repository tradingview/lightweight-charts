import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';
import { AreaFillColorerStyle } from '../model/series-bar-colorer';
import { AreaFillItemBase, PaneRendererAreaBase, PaneRendererAreaDataBase } from './area-renderer-base';
export type AreaFillItem = AreaFillItemBase & AreaFillColorerStyle;
export interface PaneRendererAreaData extends PaneRendererAreaDataBase<AreaFillItem> {
}
export declare class PaneRendererArea extends PaneRendererAreaBase<PaneRendererAreaData> {
    private readonly _fillCache;
    protected _fillStyle(renderingScope: BitmapCoordinatesRenderingScope, item: AreaFillItem): CanvasRenderingContext2D['fillStyle'];
}
