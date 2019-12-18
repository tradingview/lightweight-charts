import { Coordinate } from '../model/coordinate';

import { drawLine, LineStyle, LineWidth } from './draw-line';
import { IPaneRenderer } from './ipane-renderer';

export interface HorizontalLineRendererData {
	color: string;
	height: number;
	lineStyle: LineStyle;
	lineWidth: LineWidth;

	y: Coordinate;
	visible?: boolean;
	width: number;
}

export class HorizontalLineRenderer implements IPaneRenderer {
	private _data: HorizontalLineRendererData | null = null;

	public setData(data: HorizontalLineRendererData): void {
		this._data = data;
	}

	public draw(ctx: CanvasRenderingContext2D, devicePixelRation: number, isHovered: boolean, hitTestData?: unknown): void {
		if (this._data === null) {
			return;
		}

		if (this._data.visible === false) {
			return;
		}

		const y = Math.round(this._data.y * devicePixelRation) + 0.5;

		if (y < 0 || y > this._data.height) {
			return;
		}

		const width = Math.ceil(this._data.width * devicePixelRation);
		ctx.lineCap = 'square';
		ctx.strokeStyle = this._data.color;
		ctx.lineWidth = this._data.lineWidth;

		drawLine(ctx, -0.5, y, width, y, this._data.lineStyle);
	}
}
