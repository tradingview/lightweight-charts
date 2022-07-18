import { LineStrokeColorerStyle } from '../model/series-bar-colorer';

import { MediaCoordsRenderingScope } from './canvas-rendering-target';
import { LineItemBase, PaneRendererLineBase, PaneRendererLineDataBase } from './line-renderer-base';

export type LineStrokeItem = LineItemBase & LineStrokeColorerStyle;
export interface PaneRendererLineData extends PaneRendererLineDataBase<LineStrokeItem> {
}

export class PaneRendererLine extends PaneRendererLineBase<PaneRendererLineData> {
	protected override _strokeStyle(renderingScope: MediaCoordsRenderingScope, item: LineStrokeItem): CanvasRenderingContext2D['strokeStyle'] {
		return item.lineColor;
	}
}
