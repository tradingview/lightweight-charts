import { Coordinate } from '../model/coordinate';

import { drawHorizontalLine, LineStyle, LineWidth, setLineStyle } from './draw-line';
import { IPaneRenderer } from './ipane-renderer';
import { CanvasRenderingParams } from './render-params';

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

	public draw(ctx: CanvasRenderingContext2D, renderParams: CanvasRenderingParams, isHovered: boolean, hitTestData?: unknown): void {
		if (this._data === null) {
			return;
		}

		if (this._data.visible === false) {
			return;
		}

		const { horizontalPixelRatio, verticalPixelRatio } = renderParams;

		const y = Math.round(this._data.y * verticalPixelRatio);
		if (y < 0 || y > renderParams.bitmapSize.height) {
			return;
		}

		const width = Math.ceil(this._data.width * horizontalPixelRatio);
		ctx.lineCap = 'butt';
		ctx.strokeStyle = this._data.color;
		ctx.lineWidth = Math.floor(this._data.lineWidth * horizontalPixelRatio);
		setLineStyle(ctx, this._data.lineStyle);
		drawHorizontalLine(ctx, y, 0, width);
	}
}
