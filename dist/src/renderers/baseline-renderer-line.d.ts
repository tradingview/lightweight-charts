import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';
import { Coordinate } from '../model/coordinate';
import { BaselineStrokeColorerStyle } from '../model/series-bar-colorer';
import { LineItemBase as LineStrokeItemBase, PaneRendererLineBase, PaneRendererLineDataBase } from './line-renderer-base';
export type BaselineStrokeItem = LineStrokeItemBase & BaselineStrokeColorerStyle;
export interface PaneRendererBaselineLineData extends PaneRendererLineDataBase<BaselineStrokeItem> {
    baseLevelCoordinate: Coordinate;
}
export declare class PaneRendererBaselineLine extends PaneRendererLineBase<PaneRendererBaselineLineData> {
    private readonly _strokeCache;
    protected _strokeStyle(renderingScope: BitmapCoordinatesRenderingScope, item: BaselineStrokeItem): CanvasRenderingContext2D['strokeStyle'];
}
