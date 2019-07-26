import { ensureNever } from '../helpers/assertions';

import { HoveredObject } from '../model/chart-model';
import { Coordinate } from '../model/coordinate';
import { SeriesMarkerShape } from '../model/series-markers';
import { SeriesItemsIndexesRange, TimedValue } from '../model/time-data';

import { IPaneRenderer } from './ipane-renderer';
import { drawArrow, hitTestArrow } from './series-markers-arrow';
import { drawCircle, hitTestCircle } from './series-markers-circle';
import { drawSquare, hitTestSquare } from './series-markers-square';

export interface SeriesMarkerRendererDataItem extends TimedValue {
	y: Coordinate;
	shape: SeriesMarkerShape;
	color: string;
	id: string;
	externalId?: string;
}

export const shapesMargin = 4;

export interface SeriesMarkerRendererData {
	items: SeriesMarkerRendererDataItem[];
	visibleRange: SeriesItemsIndexesRange | null;
	barSpacing: number;
}

export class SeriesMarkersRenderer implements IPaneRenderer {
	private _data: SeriesMarkerRendererData | null = null;

	public setData(data: SeriesMarkerRendererData): void {
		this._data = data;
	}

	public draw(ctx: CanvasRenderingContext2D, isHovered: boolean, objectId?: string): void {
		if (this._data === null || this._data.visibleRange === null) {
			return;
		}
		ctx.save();
		ctx.translate(0.5, 0.5);
		for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; i++) {
			const item = this._data.items[i];
			drawItem(item, ctx, item.color, this._data.barSpacing);
		}
		ctx.restore();
	}

	public hitTest(x: Coordinate, y: Coordinate): HoveredObject | null {
		if (this._data === null || this._data.visibleRange === null) {
			return null;
		}

		for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; i++) {
			const item = this._data.items[i];
			if (hitTestItem(item, this._data.barSpacing, x, y)) {
				return {
					id: item.id,
					externalId: item.externalId,
				};
			}
		}

		return null;
	}
}

function drawItem(item: SeriesMarkerRendererDataItem, ctx: CanvasRenderingContext2D, color: string, barSpacing: number): void {
	switch (item.shape) {
		case 'arrowDown':
			drawArrow(true, ctx, item.x, item.y, color, barSpacing);
			return;
		case 'arrowUp':
			drawArrow(false, ctx, item.x, item.y, color, barSpacing);
			return;
		case 'circle':
			drawCircle(ctx, item.x, item.y, color, barSpacing);
			return;
		case 'square':
			drawSquare(ctx, item.x, item.y, color, barSpacing);
			return;
	}

	ensureNever(item.shape);
}

function hitTestItem(item: SeriesMarkerRendererDataItem, barSpacing: number, x: Coordinate, y: Coordinate): boolean {
	switch (item.shape) {
		case 'arrowDown':
			return hitTestArrow(true, item.x, item.y, barSpacing, x, y);
		case 'arrowUp':
			return hitTestArrow(false, item.x, item.y, barSpacing, x, y);
		case 'circle':
			return hitTestCircle(item.x, item.y, barSpacing, x, y);
		case 'square':
			return hitTestSquare(item.x, item.y, barSpacing, x , y);
	}

	ensureNever(item.shape);
}
