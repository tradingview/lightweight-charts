import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';

import { SeriesItemsIndexesRange } from '../model/time-data';

import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
import { LineItemBase } from './line-renderer-base';

export interface MarksRendererData {
	items: LineItemBase[];
	lineColor: string;
	lineWidth: number;
	backColor: string;
	radius: number;
	visibleRange: SeriesItemsIndexesRange | null;
}

export class PaneRendererMarks extends BitmapCoordinatesPaneRenderer {
	protected _data: MarksRendererData | null = null;

	public setData(data: MarksRendererData): void {
		this._data = data;
	}

	protected _drawImpl({ context: ctx, horizontalPixelRatio, verticalPixelRatio }: BitmapCoordinatesRenderingScope): void {
		if (this._data === null || this._data.visibleRange === null) {
			return;
		}

		const visibleRange = this._data.visibleRange;
		const data = this._data;

		const tickWidth = Math.max(1, Math.floor(horizontalPixelRatio));
		const correction = (tickWidth % 2) / 2;

		const draw = (radiusMedia: number) => {
			ctx.beginPath();

			for (let i = visibleRange.to - 1; i >= visibleRange.from; --i) {
				const point = data.items[i];
				const centerX = Math.round(point.x * horizontalPixelRatio) + correction; // correct x coordinate only
				const centerY = point.y * verticalPixelRatio;
				const radius = radiusMedia * verticalPixelRatio + correction;
				ctx.moveTo(centerX, centerY);
				ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
			}

			ctx.fill();
		};

		if (data.lineWidth > 0) {
			ctx.fillStyle = data.backColor;
			draw(data.radius + data.lineWidth);
		}

		ctx.fillStyle = data.lineColor;
		draw(data.radius);
	}
}
