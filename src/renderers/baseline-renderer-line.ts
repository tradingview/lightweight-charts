import { clamp } from '../helpers/mathex';

import { Coordinate } from '../model/coordinate';
import { BaselineStrokeColorerStyle } from '../model/series-bar-colorer';

import { LineItemBase as LineStrokeItemBase, PaneRendererLineBase, PaneRendererLineDataBase } from './line-renderer-base';

export type BaselineStrokeItem = LineStrokeItemBase & BaselineStrokeColorerStyle;
export interface PaneRendererBaselineLineData extends PaneRendererLineDataBase<BaselineStrokeItem> {
	baseLevelCoordinate: Coordinate;
	bottom: Coordinate;
}

interface BaselineStrokeCache extends Record<keyof BaselineStrokeColorerStyle, string> {
	strokeStyle: CanvasRenderingContext2D['strokeStyle'];
	baseLevelCoordinate: Coordinate;
	bottom: Coordinate;
}

export class PaneRendererBaselineLine extends PaneRendererLineBase<PaneRendererBaselineLineData> {
	private _strokeCache: BaselineStrokeCache | null = null;

	protected override _strokeStyle(ctx: CanvasRenderingContext2D, item: BaselineStrokeItem): CanvasRenderingContext2D['strokeStyle'] {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const data = this._data!;

		const { topLineColor, bottomLineColor } = item;
		const { baseLevelCoordinate, bottom } = data;

		if (
			this._strokeCache !== null &&
			this._strokeCache.topLineColor === topLineColor &&
			this._strokeCache.bottomLineColor === bottomLineColor &&
			this._strokeCache.baseLevelCoordinate === baseLevelCoordinate &&
			this._strokeCache.bottom === bottom
		) {
			return this._strokeCache.strokeStyle;
		}

		const strokeStyle = ctx.createLinearGradient(0, 0, 0, bottom);
		const baselinePercent = clamp(baseLevelCoordinate / bottom, 0, 1);

		strokeStyle.addColorStop(0, topLineColor);
		strokeStyle.addColorStop(baselinePercent, topLineColor);
		strokeStyle.addColorStop(baselinePercent, bottomLineColor);
		strokeStyle.addColorStop(1, bottomLineColor);

		this._strokeCache = {
			topLineColor,
			bottomLineColor,
			strokeStyle,
			baseLevelCoordinate,
			bottom,
		};

		return strokeStyle;
	}
}
