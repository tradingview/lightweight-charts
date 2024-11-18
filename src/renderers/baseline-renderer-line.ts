import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';

import { Coordinate } from '../model/coordinate';
import { BaselineStrokeColorerStyle } from '../model/series-bar-colorer';

import { GradientStyleCache } from './gradient-style-cache';
import { LineItemBase as LineStrokeItemBase, PaneRendererLineBase, PaneRendererLineDataBase } from './line-renderer-base';

export type BaselineStrokeItem = LineStrokeItemBase & BaselineStrokeColorerStyle;
export interface PaneRendererBaselineLineData extends PaneRendererLineDataBase<BaselineStrokeItem> {
	baseLevelCoordinate: Coordinate;
	topCoordinate?: Coordinate;
	bottomCoordinate?: Coordinate;
}

export class PaneRendererBaselineLine extends PaneRendererLineBase<PaneRendererBaselineLineData> {
	private readonly _strokeCache: GradientStyleCache = new GradientStyleCache();

	protected override _strokeStyle(renderingScope: BitmapCoordinatesRenderingScope, item: BaselineStrokeItem): CanvasRenderingContext2D['strokeStyle'] {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const data = this._data!;

		return this._strokeCache.get(
			renderingScope,
			{
				topColor1: item.topLineColor,
				topColor2: item.topLineColor,
				bottomColor1: item.bottomLineColor,
				bottomColor2: item.bottomLineColor,
				baseLevelCoordinate: data.baseLevelCoordinate,
				topCoordinate: data.topCoordinate ?? 0 as Coordinate,
				bottomCoordinate: data.bottomCoordinate ?? renderingScope.bitmapSize.height as Coordinate,
			}
		);
	}
}
