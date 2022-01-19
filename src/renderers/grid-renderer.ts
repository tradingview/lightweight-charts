import { ensureNotNull } from '../helpers/assertions';

import { PriceMark } from '../model/price-scale';

import { CanvasRenderingTarget } from './canvas-rendering-target';
import { LineStyle, setLineStyle, strokeInPixel } from './draw-line';
import { IPaneRenderer } from './ipane-renderer';

export interface GridMarks {
	coord: number;
}
export interface GridRendererData {
	vertLinesVisible: boolean;
	vertLinesColor: string;
	vertLineStyle: LineStyle;
	timeMarks: GridMarks[];

	horzLinesVisible: boolean;
	horzLinesColor: string;
	horzLineStyle: LineStyle;
	priceMarks: PriceMark[];

	h: number;
	w: number;
}

export class GridRenderer implements IPaneRenderer {
	private _data: GridRendererData | null = null;

	public setData(data: GridRendererData | null): void {
		this._data = data;
	}

	public draw(target: CanvasRenderingTarget, isHovered: boolean, hitTestData?: unknown): void {
		if (this._data === null) {
			return;
		}

		const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = target;

		const lineWidth = Math.max(1, Math.floor(horizontalPixelRatio));
		ctx.lineWidth = lineWidth;

		const height = Math.ceil(this._data.h * verticalPixelRatio);
		const width = Math.ceil(this._data.w * horizontalPixelRatio);

		strokeInPixel(ctx, () => {
			const data = ensureNotNull(this._data);
			if (data.vertLinesVisible) {
				ctx.strokeStyle = data.vertLinesColor;
				setLineStyle(ctx, data.vertLineStyle);
				ctx.beginPath();
				for (const timeMark of data.timeMarks) {
					const x = Math.round(timeMark.coord * horizontalPixelRatio);
					ctx.moveTo(x, -lineWidth);
					ctx.lineTo(x, height + lineWidth);
				}
				ctx.stroke();
			}
			if (data.horzLinesVisible) {
				ctx.strokeStyle = data.horzLinesColor;
				setLineStyle(ctx, data.horzLineStyle);
				ctx.beginPath();
				for (const priceMark of data.priceMarks) {
					const y = Math.round(priceMark.coord * verticalPixelRatio);
					ctx.moveTo(-lineWidth, y);
					ctx.lineTo(width + lineWidth, y);
				}
				ctx.stroke();
			}
		});
	}
}
