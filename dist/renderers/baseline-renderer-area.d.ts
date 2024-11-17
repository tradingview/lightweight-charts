import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';
import { BaselineFillColorerStyle } from '../model/series-bar-colorer';
import { AreaFillItemBase, PaneRendererAreaBase, PaneRendererAreaDataBase } from './area-renderer-base';
export type BaselineFillItem = AreaFillItemBase & BaselineFillColorerStyle;
export interface PaneRendererBaselineData extends PaneRendererAreaDataBase<BaselineFillItem> {
}
export declare class PaneRendererBaselineArea extends PaneRendererAreaBase<PaneRendererBaselineData> {
    private readonly _fillCache;
    protected _fillStyle(renderingScope: BitmapCoordinatesRenderingScope, item: BaselineFillItem): CanvasRenderingContext2D['fillStyle'];
}
