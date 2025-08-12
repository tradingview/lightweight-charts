import { BitmapCoordinatesRenderingScope, CanvasRenderingTarget2D } from 'fancy-canvas';

import { ensureNever } from '../../helpers/assertions';
import { makeFont } from '../../helpers/make-font';

import { Coordinate } from '../../model/coordinate';
import { IPrimitivePaneRenderer, PrimitiveHoveredItem } from '../../model/ipane-primitive';
import { TextWidthCache } from '../../model/text-width-cache';
import { SeriesItemsIndexesRange, TimedValue } from '../../model/time-data';

import { SeriesMarkerZOrder } from './options';
import { drawArrow, hitTestArrow } from './series-markers-arrow';
import { drawCircle, hitTestCircle } from './series-markers-circle';
import { drawSquare, hitTestSquare } from './series-markers-square';
import { drawText, hitTestText } from './series-markers-text';
import { SeriesMarkerShape } from './types';
import { BitmapShapeItemCoordinates } from './utils';

export interface SeriesMarkerText {
	content: string;
	x: Coordinate;
	y: Coordinate;
	width: number;
	height: number;
}

export interface SeriesMarkerRendererDataItem extends TimedValue {
	y: Coordinate;
	size: number;
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

export class SeriesMarkersRenderer implements IPrimitivePaneRenderer {
	private _data: SeriesMarkerRendererData | null = null;
	private _textWidthCache: TextWidthCache = new TextWidthCache();
	private _fontSize: number = -1;
	private _fontFamily: string = '';
	private _font: string = '';
	private _zOrder: SeriesMarkerZOrder = 'normal';

	public setData(data: SeriesMarkerRendererData): void {
		this._data = data;
	}

	public setParams(fontSize: number, fontFamily: string, zOrder: SeriesMarkerZOrder): void {
		if (this._fontSize !== fontSize || this._fontFamily !== fontFamily) {
			this._fontSize = fontSize;
			this._fontFamily = fontFamily;
			this._font = makeFont(fontSize, fontFamily);
			this._textWidthCache.reset();
		}
		this._zOrder = zOrder;
	}

	public hitTest(x: number, y: number): PrimitiveHoveredItem | null {
		if (this._data === null || this._data.visibleRange === null) {
			return null;
		}

		for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; i++) {
			const item = this._data.items[i];
			if (item && hitTestItem(item, x as Coordinate, y as Coordinate)) {
				return {
					zOrder: 'normal',
					externalId: item.externalId ?? '',
				};
			}
		}

		return null;
	}

	public draw(target: CanvasRenderingTarget2D): void {
		if (this._zOrder === 'aboveSeries') {
			return;
		}
		target.useBitmapCoordinateSpace((scope: BitmapCoordinatesRenderingScope) => {
			this._drawImpl(scope);
		});
	}

	public drawBackground(target: CanvasRenderingTarget2D): void {
		if (this._zOrder !== 'aboveSeries') {
			return;
		}
		target.useBitmapCoordinateSpace((scope: BitmapCoordinatesRenderingScope) => {
			this._drawImpl(scope);
		});
	}

	protected _drawImpl({ context: ctx, horizontalPixelRatio, verticalPixelRatio }: BitmapCoordinatesRenderingScope): void {
		if (this._data === null || this._data.visibleRange === null) {
			return;
		}

		ctx.textBaseline = 'middle';
		ctx.font = this._font;
		for (let index = this._data.visibleRange.from; index < this._data.visibleRange.to; index++) {
			const item = this._data.items[index];
			if (item.text !== undefined) {
				item.text.width = this._textWidthCache.measureText(ctx, item.text.content);
				item.text.height = this._fontSize;
				item.text.x = item.x - item.text.width / 2 as Coordinate;
			}
			drawItem(item, ctx, horizontalPixelRatio, verticalPixelRatio);
		}
	}
}

function bitmapShapeItemCoordinates(item: SeriesMarkerRendererDataItem, horizontalPixelRatio: number, verticalPixelRatio: number): BitmapShapeItemCoordinates {
	const tickWidth = Math.max(1, Math.floor(horizontalPixelRatio));
	const correction = (tickWidth % 2) / 2;
	return {
		x: Math.round(item.x * horizontalPixelRatio) + correction,
		y: item.y * verticalPixelRatio,
		pixelRatio: horizontalPixelRatio,
	};
}

function drawItem(item: SeriesMarkerRendererDataItem, ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, horizontalPixelRatio: number, verticalPixelRatio: number): void {
	ctx.fillStyle = item.color;
	if (item.text !== undefined) {
		drawText(ctx, item.text.content, item.text.x, item.text.y, horizontalPixelRatio, verticalPixelRatio);
	}

	drawShape(item, ctx, bitmapShapeItemCoordinates(item, horizontalPixelRatio, verticalPixelRatio));
}

function drawShape(item: SeriesMarkerRendererDataItem, ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, coordinates: BitmapShapeItemCoordinates): void {
	if (item.size === 0) {
		return;
	}

	switch (item.shape) {
		case 'arrowDown':
			drawArrow(false, ctx, coordinates, item.size);
			return;
		case 'arrowUp':
			drawArrow(true, ctx, coordinates, item.size);
			return;
		case 'circle':
			drawCircle(ctx, coordinates, item.size);
			return;
		case 'square':
			drawSquare(ctx, coordinates, item.size);
			return;
	}

	ensureNever(item.shape);
}

function hitTestItem(item: SeriesMarkerRendererDataItem, x: Coordinate, y: Coordinate): boolean {
	if (item.text !== undefined && hitTestText(item.text.x, item.text.y, item.text.width, item.text.height, x, y)) {
		return true;
	}

	return hitTestShape(item, x, y);
}

function hitTestShape(item: SeriesMarkerRendererDataItem, x: Coordinate, y: Coordinate): boolean {
	if (item.size === 0) {
		return false;
	}

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
}
