import { Coordinate } from '../model/coordinate';
import { AreaFillColorerStyle } from '../model/series-bar-colorer';

import { AreaFillItemBase, PaneRendererAreaBase, PaneRendererAreaDataBase } from './area-renderer-base';

export type AreaFillItem = AreaFillItemBase & AreaFillColorerStyle;
export interface PaneRendererAreaData extends PaneRendererAreaDataBase<AreaFillItem> {
}

interface AreaFillCache extends Record<keyof AreaFillColorerStyle, string> {
	fillStyle: CanvasRenderingContext2D['fillStyle'];
	bottom: Coordinate;
}

export class PaneRendererArea extends PaneRendererAreaBase<PaneRendererAreaData> {
	private _fillCache: AreaFillCache | null = null;

	protected override _fillStyle(ctx: CanvasRenderingContext2D, item: AreaFillItem): CanvasRenderingContext2D['fillStyle'] {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const data = this._data!;

		const { topColor, bottomColor } = item;
		const bottom = data.bottom;

		if (
			this._fillCache !== null &&
			this._fillCache.topColor === topColor &&
			this._fillCache.bottomColor === bottomColor &&
			this._fillCache.bottom === bottom
		) {
			return this._fillCache.fillStyle;
		}

		const fillStyle = ctx.createLinearGradient(0, 0, 0, bottom);
		fillStyle.addColorStop(0, topColor);
		fillStyle.addColorStop(1, bottomColor);

		this._fillCache = { topColor, bottomColor, fillStyle, bottom };

		return fillStyle;
	}
}
