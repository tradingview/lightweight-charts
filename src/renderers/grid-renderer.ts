import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';

import { ensureNotNull } from '../helpers/assertions';

import { PriceMark } from '../model/price-scale';

import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
import { LineStyle, setLineStyle, strokeInPixel } from './draw-line';

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
}

export class GridRenderer extends BitmapCoordinatesPaneRenderer {
	private _data: GridRendererData | null = null;

	public setData(data: GridRendererData | null): void {
		this._data = data;
	}

	protected override _drawImpl({ context: ctx, bitmapSize, horizontalPixelRatio, verticalPixelRatio }: BitmapCoordinatesRenderingScope): void {
		if (this._data === null) {
			return;
		}

		const lineWidth = Math.max(1, Math.floor(horizontalPixelRatio));
		ctx.lineWidth = lineWidth;

		strokeInPixel(ctx, () => {
			const data = ensureNotNull(this._data);
			if (data.vertLinesVisible) {
				ctx.strokeStyle = data.vertLinesColor;
				setLineStyle(ctx, data.vertLineStyle);
				ctx.beginPath();
				for (const timeMark of data.timeMarks) {
					const x = Math.round(timeMark.coord * horizontalPixelRatio);
					ctx.moveTo(x, -lineWidth);
					ctx.lineTo(x, bitmapSize.height + lineWidth);
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
					ctx.lineTo(bitmapSize.width + lineWidth, y);
				}
				ctx.stroke();
			}
		});
	}
}
