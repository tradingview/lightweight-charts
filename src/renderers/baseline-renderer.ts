import { clamp } from '../helpers/mathex';

import { Coordinate } from '../model/coordinate';

import { PaneRendererAreaBase, PaneRendererAreaDataBase } from './area-renderer';
import { MediaCoordsRenderingScope } from './canvas-rendering-target';
import { PaneRendererLineBase, PaneRendererLineDataBase } from './line-renderer';

export interface PaneRendererBaselineData extends PaneRendererAreaDataBase {
	topFillColor1: string;
	topFillColor2: string;

	bottomFillColor1: string;
	bottomFillColor2: string;
}

export class PaneRendererBaselineArea extends PaneRendererAreaBase<PaneRendererBaselineData> {
	protected override _fillStyle(renderingScope: MediaCoordsRenderingScope): CanvasRenderingContext2D['fillStyle'] {
		const { context: ctx, mediaSize } = renderingScope;
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const data = this._data!;
		const baseLevelCoordinate = data.baseLevelCoordinate ?? mediaSize.height;

		const gradient = ctx.createLinearGradient(0, 0, 0, mediaSize.height);
		const baselinePercent = clamp(baseLevelCoordinate / mediaSize.height, 0, 1);

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
}

export class PaneRendererBaselineLine extends PaneRendererLineBase<PaneRendererBaselineLineData> {
	protected override _strokeStyle(renderingScope: MediaCoordsRenderingScope): CanvasRenderingContext2D['strokeStyle'] {
		const { context: ctx, mediaSize } = renderingScope;
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const data = this._data!;
		const baseLevelCoordinate = data.baseLevelCoordinate ?? mediaSize.height;

		const gradient = ctx.createLinearGradient(0, 0, 0, mediaSize.height);
		const baselinePercent = clamp(baseLevelCoordinate / mediaSize.height, 0, 1);

		gradient.addColorStop(0, data.topColor);
		gradient.addColorStop(baselinePercent, data.topColor);
		gradient.addColorStop(baselinePercent, data.bottomColor);
		gradient.addColorStop(1, data.bottomColor);

		return gradient;
	}
}
