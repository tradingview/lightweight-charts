import { clamp } from '../helpers/mathex';

import { Coordinate } from '../model/coordinate';

import { PaneRendererAreaBase, PaneRendererAreaDataBase } from './area-renderer';
import { PaneRendererLineBase, PaneRendererLineDataBase } from './line-renderer';

export interface PaneRendererBaselineData extends PaneRendererAreaDataBase {
	topFillColor1: string;
	topFillColor2: string;

	bottomFillColor1: string;
	bottomFillColor2: string;
}

export class PaneRendererBaselineArea extends PaneRendererAreaBase<PaneRendererBaselineData> {
	protected override _fillStyle(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D['fillStyle'] {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const data = this._data!;

		const gradient = ctx.createLinearGradient(0, 0, 0, data.bottom);
		const baselinePercent = clamp(data.baseLevelCoordinate / data.bottom, 0, 1);

		gradient.addColorStop(0, data.topFillColor1);
		gradient.addColorStop(baselinePercent, data.topFillColor2);
		gradient.addColorStop(baselinePercent, data.bottomFillColor1);
		gradient.addColorStop(1, data.bottomFillColor2);

		return gradient;
	}
}

export interface PaneRendererBaselineLineData extends PaneRendererLineDataBase {
	topColor: string;
	bottomColor: string;

	baseLevelCoordinate: Coordinate;
	bottom: Coordinate;
}

export class PaneRendererBaselineLine extends PaneRendererLineBase<PaneRendererBaselineLineData> {
	protected override _strokeStyle(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D['strokeStyle'] {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const data = this._data!;

		const gradient = ctx.createLinearGradient(0, 0, 0, data.bottom);
		const baselinePercent = clamp(data.baseLevelCoordinate / data.bottom, 0, 1);

		gradient.addColorStop(0, data.topColor);
		gradient.addColorStop(baselinePercent, data.topColor);
		gradient.addColorStop(baselinePercent, data.bottomColor);
		gradient.addColorStop(1, data.bottomColor);

		return gradient;
	}
}
