import { Coordinate } from '../model/coordinate';

import { drawLine, LineStyle, LineWidth } from './draw-line';
import { ScaledRenderer } from './scaled-renderer';

export interface HorizontalLineRendererData {
	color: string;
	height: number;
	lineStyle: LineStyle;
	lineWidth: LineWidth;

	y: Coordinate;
	visible?: boolean;
	width: number;
}

export class HorizontalLineRenderer extends ScaledRenderer {
	private _data: HorizontalLineRendererData | null = null;

	public setData(data: HorizontalLineRendererData): void {
		this._data = data;
	}

	protected _drawImpl(ctx: CanvasRenderingContext2D): void {
		if (this._data === null) {
			return;
		}

		if (this._data.visible === false) {
			return;
		}

		const y = this._data.y;

		if (y < 0 || y > this._data.height) {
			return;
		}

		const width = this._data.width;
		ctx.lineCap = 'square';
		ctx.strokeStyle = this._data.color;
		ctx.lineWidth = this._data.lineWidth;

		drawLine(ctx, 0, y, width, y, this._data.lineStyle);
	}
}
