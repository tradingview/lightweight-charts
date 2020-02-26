import { ensureNever } from '../helpers/assertions';

import { HoveredObject } from '../model/chart-model';
import { Coordinate } from '../model/coordinate';
import { SeriesMarkerShape, SeriesMarkerText } from '../model/series-markers';
import { TextWidthCache } from '../model/text-width-cache';
import { SeriesItemsIndexesRange, TimedValue } from '../model/time-data';

import { ScaledRenderer } from './scaled-renderer';
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
	text?: SeriesMarkerText;
}

export interface SeriesMarkerRendererData {
	items: SeriesMarkerRendererDataItem[];
	visibleRange: SeriesItemsIndexesRange | null;
}

export class SeriesMarkersRenderer extends ScaledRenderer {
	private _data: SeriesMarkerRendererData | null = null;
	private _textWidthCache: TextWidthCache = new TextWidthCache();

	public setData(data: SeriesMarkerRendererData): void {
		this._data = data;
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

	protected _drawImpl(ctx: CanvasRenderingContext2D, isHovered: boolean, hitTestData?: unknown): void {
		if (this._data === null || this._data.visibleRange === null) {
			return;
		}
		for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; i++) {
			const item = this._data.items[i];
			if (item.text !== undefined) {
				item.text.x = item.text.x - this._textWidthCache.measureText(ctx, item.text.content) / 2 as Coordinate;
				item.text.y = item.text.y + parseInt(ctx.font, 10) / 2 as Coordinate;
			}
			drawItem(item, ctx);
		}
	}
}

function drawItem(item: SeriesMarkerRendererDataItem, ctx: CanvasRenderingContext2D): void {
	switch (item.shape) {
		case 'arrowDown':
			drawArrow(false, ctx, item.x, item.y, item.color, item.size, item.text);
			return;
		case 'arrowUp':
			drawArrow(true, ctx, item.x, item.y, item.color, item.size, item.text);
			return;
		case 'circle':
			drawCircle(ctx, item.x, item.y, item.color, item.size, item.text);
			return;
		case 'square':
			drawSquare(ctx, item.x, item.y, item.color, item.size, item.text);
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
			return hitTestSquare(item.x, item.y, item.size, x, y);
	}

	ensureNever(item.shape);
}
