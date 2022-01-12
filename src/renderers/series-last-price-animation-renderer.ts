import { Point } from '../model/point';

import { CanvasRenderingParams } from './canvas-rendering-target';
import { IPaneRenderer } from './ipane-renderer';

export interface LastPriceCircleRendererData {
	radius: number;
	fillColor: string;
	strokeColor: string;
	seriesLineColor: string;
	seriesLineWidth: number;
	center: Point;
}

export class SeriesLastPriceAnimationRenderer implements IPaneRenderer {
	private _data: LastPriceCircleRendererData | null = null;

	public setData(data: LastPriceCircleRendererData | null): void {
		this._data = data;
	}

	public data(): LastPriceCircleRendererData | null {
		return this._data;
	}

	public draw(ctx: CanvasRenderingContext2D, renderParams: CanvasRenderingParams, isHovered: boolean, hitTestData?: unknown): void {
		const data = this._data;
		if (data === null) {
			return;
		}

		ctx.save();

		const { horizontalPixelRatio, verticalPixelRatio } = renderParams;

		const tickWidth = Math.max(1, Math.floor(horizontalPixelRatio));

		const correction = (tickWidth % 2) / 2;
		const centerX = Math.round(data.center.x * horizontalPixelRatio) + correction; // correct x coordinate only
		const centerY = data.center.y * verticalPixelRatio;

		ctx.fillStyle = data.seriesLineColor;
		ctx.beginPath();
		// TODO: it is better to have different horizontal and vertical radii
		const centerPointRadius = Math.max(2, data.seriesLineWidth * 1.5) * horizontalPixelRatio;
		ctx.arc(centerX, centerY, centerPointRadius, 0, 2 * Math.PI, false);
		ctx.fill();

		ctx.fillStyle = data.fillColor;
		ctx.beginPath();
		ctx.arc(centerX, centerY, data.radius * horizontalPixelRatio, 0, 2 * Math.PI, false);
		ctx.fill();

		ctx.lineWidth = tickWidth;
		ctx.strokeStyle = data.strokeColor;
		ctx.beginPath();
		ctx.arc(centerX, centerY, data.radius * horizontalPixelRatio + tickWidth / 2, 0, 2 * Math.PI, false);
		ctx.stroke();
		ctx.restore();
	}
}
