import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';

import { Coordinate } from '../model/coordinate';
import { BaselineFillColorerStyle } from '../model/series-bar-colorer';

import { AreaFillItemBase, PaneRendererAreaBase, PaneRendererAreaDataBase } from './area-renderer-base';
import { GradientStyleCache } from './gradient-style-cache';

export type BaselineFillItem = AreaFillItemBase & BaselineFillColorerStyle;
export interface PaneRendererBaselineData extends PaneRendererAreaDataBase<BaselineFillItem> {
}
export class PaneRendererBaselineArea extends PaneRendererAreaBase<PaneRendererBaselineData> {
	private readonly _fillCache: GradientStyleCache = new GradientStyleCache();

	protected override _fillStyle(renderingScope: BitmapCoordinatesRenderingScope, item: BaselineFillItem): CanvasRenderingContext2D['fillStyle'] {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const data = this._data!;

		return this._fillCache.get(
			renderingScope,
			{
				topColor1: item.topFillColor1,
				topColor2: item.topFillColor2,
				bottomColor1: item.bottomFillColor1,
				bottomColor2: item.bottomFillColor2,
				bottom: renderingScope.bitmapSize.height as Coordinate,
				baseLevelCoordinate: data.baseLevelCoordinate,
			}
		);
	}
}
