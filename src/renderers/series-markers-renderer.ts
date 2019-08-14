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
	size: Coordinate;
	shape: SeriesMarkerShape;
	color: string;
	internalId: number;
	externalId?: string;
}

export interface SeriesMarkerRendererData {
	items: SeriesMarkerRendererDataItem[];
	visibleRange: SeriesItemsIndexesRange | null;
}

export class SeriesMarkersRenderer implements IPaneRenderer {
	private _data: SeriesMarkerRendererData | null = null;

	public setData(data: SeriesMarkerRendererData): void {
		this._data = data;
	}

	public draw(ctx: CanvasRenderingContext2D, isHovered: boolean, hitTestData?: unknown): void {
		if (this._data === null || this._data.visibleRange === null) {
			return;
		}
		ctx.save();
		ctx.translate(0.5, 0.5);
		for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; i++) {
			const item = this._data.items[i];
			drawItem(item, ctx);
		}
		ctx.restore();
	}

	public hitTest(x: Coordinate, y: Coordinate): HoveredObject | null {
		if (this._data === null || this._data.visibleRange === null) {
			return null;
		}

		for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; i++) {
			const item = this._data.items[i];
			if (hitTestItem(item, x, y)) {
				return {
					hitTestData: item.internalId,
					externalId: item.externalId,
				};
			}
		}

		return null;
	}
}

function drawItem(item: SeriesMarkerRendererDataItem, ctx: CanvasRenderingContext2D): void {
	switch (item.shape) {
		case 'arrowDown':
			drawArrow(true, ctx, item.x, item.y, item.color, item.size);
			return;
		case 'arrowUp':
			drawArrow(false, ctx, item.x, item.y, item.color, item.size);
			return;
		case 'circle':
			drawCircle(ctx, item.x, item.y, item.color, item.size);
			return;
		case 'square':
			drawSquare(ctx, item.x, item.y, item.color, item.size);
			return;
	}

	ensureNever(item.shape);
}

function hitTestItem(item: SeriesMarkerRendererDataItem, x: Coordinate, y: Coordinate): boolean {
	switch (item.shape) {
		case 'arrowDown':
			return hitTestArrow(true, item.x, item.y, item.size, x, y);
		case 'arrowUp':
			return hitTestArrow(false, item.x, item.y, item.size, x, y);
		case 'circle':
			return hitTestCircle(item.x, item.y, item.size, x, y);
		case 'square':
			return hitTestSquare(item.x, item.y, item.size, x , y);
	}

	ensureNever(item.shape);
}
