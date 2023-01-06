import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';

import { HoveredObject } from '../model/chart-model';
import { Coordinate } from '../model/coordinate';

import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
import { drawHorizontalLine, LineStyle, LineWidth, setLineStyle } from './draw-line';

export interface HorizontalLineRendererData {
	color: string;
	lineStyle: LineStyle;
	lineWidth: LineWidth;

	y: Coordinate;
	visible?: boolean;
	externalId?: string;
}

const enum Constants { HitTestThreshold = 7, }

export class HorizontalLineRenderer extends BitmapCoordinatesPaneRenderer {
	private _data: HorizontalLineRendererData | null = null;

	public setData(data: HorizontalLineRendererData): void {
		this._data = data;
	}

	public hitTest(x: Coordinate, y: Coordinate): HoveredObject | null {
		if (!this._data?.visible) {
			return null;
		}

		const { y: itemY, lineWidth, externalId } = this._data;
		// add a fixed area threshold around line (Y + width) for hit test
		if (y >= itemY - lineWidth - Constants.HitTestThreshold && y <= itemY + lineWidth + Constants.HitTestThreshold) {
			return {
				hitTestData: this._data,
				externalId: externalId,
			};
		}

		return null;
	}

	protected _drawImpl({ context: ctx, bitmapSize, horizontalPixelRatio, verticalPixelRatio }: BitmapCoordinatesRenderingScope): void {
		if (this._data === null) {
			return;
		}

		if (this._data.visible === false) {
			return;
		}

		const y = Math.round(this._data.y * verticalPixelRatio);
		if (y < 0 || y > bitmapSize.height) {
			return;
		}

		ctx.lineCap = 'butt';
		ctx.strokeStyle = this._data.color;
		ctx.lineWidth = Math.floor(this._data.lineWidth * horizontalPixelRatio);
		setLineStyle(ctx, this._data.lineStyle);
		drawHorizontalLine(ctx, y, 0, bitmapSize.width);
	}
}
