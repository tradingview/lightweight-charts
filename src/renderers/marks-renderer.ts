import { MediaCoordinatesRenderingScope } from 'fancy-canvas';

import { SeriesItemsIndexesRange } from '../model/time-data';

import { LineItemBase } from './line-renderer-base';
import { MediaCoordinatesPaneRenderer } from './media-coordinates-pane-renderer';

export interface MarksRendererData {
	items: LineItemBase[];
	lineColor: string;
	lineWidth: number;
	backColor: string;
	radius: number;
	visibleRange: SeriesItemsIndexesRange | null;
}

export class PaneRendererMarks extends MediaCoordinatesPaneRenderer {
	protected _data: MarksRendererData | null = null;

	public setData(data: MarksRendererData): void {
		this._data = data;
	}

	protected _drawImpl({ context: ctx }: MediaCoordinatesRenderingScope): void {
		if (this._data === null || this._data.visibleRange === null) {
			return;
		}

		const visibleRange = this._data.visibleRange;
		const data = this._data;

		const draw = (radius: number) => {
			ctx.beginPath();

			for (let i = visibleRange.to - 1; i >= visibleRange.from; --i) {
				const point = data.items[i];
				ctx.moveTo(point.x, point.y);
				ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
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
