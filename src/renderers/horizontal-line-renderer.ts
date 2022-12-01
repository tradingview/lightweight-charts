import { HoveredObject } from '../model/chart-model';
import { Coordinate } from '../model/coordinate';

import { drawHorizontalLine, LineStyle, LineWidth, setLineStyle } from './draw-line';
import { IPaneRenderer } from './ipane-renderer';

export interface HorizontalLineRendererData {
	color: string;
	height: number;
	lineStyle: LineStyle;
	lineWidth: LineWidth;

	y: Coordinate;
	visible?: boolean;
	width: number;
	externalId?: string;
}

export class HorizontalLineRenderer implements IPaneRenderer {
	private _data: HorizontalLineRendererData | null = null;

	public setData(data: HorizontalLineRendererData): void {
		this._data = data;
	}

	public hitTest(x: Coordinate, y: Coordinate): HoveredObject | null {
		if (!this._data?.visible) {
			return null;
		}

		const item = this._data;
		const itemY = item.y;
		const width = item.lineWidth;
		// add a fixed area threshold around line (Y + width) for hit test
		const threshold = 7; // TODO: calculate click threshold this dynamically instead
		if (y >= itemY - width - threshold && y <= itemY + width + threshold) {
			return {
				hitTestData: item,
				externalId: item.externalId,
			};
		}

		return null;
	}

	public draw(ctx: CanvasRenderingContext2D, pixelRatio: number, isHovered: boolean, hitTestData?: unknown): void {
		if (this._data === null) {
			return;
		}

		if (this._data.visible === false) {
			return;
		}

		const y = Math.round(this._data.y * pixelRatio);

		if (y < 0 || y > Math.ceil(this._data.height * pixelRatio)) {
			return;
		}

		const width = Math.ceil(this._data.width * pixelRatio);
		ctx.lineCap = 'butt';
		ctx.strokeStyle = this._data.color;
		ctx.lineWidth = Math.floor(this._data.lineWidth * pixelRatio);
		setLineStyle(ctx, this._data.lineStyle);
		drawHorizontalLine(ctx, y, 0, width);
	}
}
