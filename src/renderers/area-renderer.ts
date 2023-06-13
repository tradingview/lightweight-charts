import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';

import { Coordinate } from '../model/coordinate';
import { AreaFillColorerStyle } from '../model/series-bar-colorer';

import { AreaFillItemBase, PaneRendererAreaBase, PaneRendererAreaDataBase } from './area-renderer-base';
import { GradientStyleCache } from './gradient-style-cache';

export type AreaFillItem = AreaFillItemBase & AreaFillColorerStyle;
export interface PaneRendererAreaData extends PaneRendererAreaDataBase<AreaFillItem> {
}

export class PaneRendererArea extends PaneRendererAreaBase<PaneRendererAreaData> {
	private readonly _fillCache: GradientStyleCache = new GradientStyleCache();

	protected override _fillStyle(renderingScope: BitmapCoordinatesRenderingScope, item: AreaFillItem): CanvasRenderingContext2D['fillStyle'] {
		return this._fillCache.get(
			renderingScope,
			{
				topColor1: item.topColor,
				topColor2: '',
				bottomColor1: '',
				bottomColor2: item.bottomColor,
				bottom: renderingScope.bitmapSize.height as Coordinate,
			}
		);
	}
}
