import { clamp } from '../helpers/mathex';

import { Coordinate } from '../model/coordinate';
import { BaselineFillColorerStyle } from '../model/series-bar-colorer';

import { AreaFillItemBase, PaneRendererAreaBase, PaneRendererAreaDataBase } from './area-renderer-base';

export type BaselineFillItem = AreaFillItemBase & BaselineFillColorerStyle;
export interface PaneRendererBaselineData extends PaneRendererAreaDataBase<BaselineFillItem> {
}

interface BaselineFillCache extends Record<keyof BaselineFillColorerStyle, string> {
	fillStyle: CanvasRenderingContext2D['fillStyle'];
	baseLevelCoordinate: Coordinate;
	bottom: Coordinate;
}
export class PaneRendererBaselineArea extends PaneRendererAreaBase<PaneRendererBaselineData> {
	private _fillCache: BaselineFillCache | null = null;

	protected override _fillStyle(ctx: CanvasRenderingContext2D, item: BaselineFillItem): CanvasRenderingContext2D['fillStyle'] {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const data = this._data!;

		const { topFillColor1, topFillColor2, bottomFillColor1, bottomFillColor2 } = item;
		const { baseLevelCoordinate, bottom } = data;

		if (
			this._fillCache !== null &&
			this._fillCache.topFillColor1 === topFillColor1 &&
			this._fillCache.topFillColor2 === topFillColor2 &&
			this._fillCache.bottomFillColor1 === bottomFillColor1 &&
			this._fillCache.bottomFillColor2 === bottomFillColor2 &&
			this._fillCache.baseLevelCoordinate === baseLevelCoordinate &&
			this._fillCache.bottom === bottom
		) {
			return this._fillCache.fillStyle;
		}

		const fillStyle = ctx.createLinearGradient(0, 0, 0, bottom);
		const baselinePercent = clamp(baseLevelCoordinate / bottom, 0, 1);

		fillStyle.addColorStop(0, topFillColor1);
		fillStyle.addColorStop(baselinePercent, topFillColor2);
		fillStyle.addColorStop(baselinePercent, bottomFillColor1);
		fillStyle.addColorStop(1, bottomFillColor2);

		this._fillCache = {
			topFillColor1,
			topFillColor2,
			bottomFillColor1,
			bottomFillColor2,
			fillStyle,
			baseLevelCoordinate,
			bottom,
		};

		return fillStyle;
	}
}
