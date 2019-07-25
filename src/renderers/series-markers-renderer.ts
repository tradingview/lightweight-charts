import { ensureDefined } from '../helpers/assertions';

import { Coordinate } from '../model/coordinate';
import { SeriesMarkerShape } from '../model/series-markers';
import { SeriesItemsIndexesRange, TimedValue } from '../model/time-data';

import { IPaneRenderer } from './ipane-renderer';

export interface SeriesMarkerRendererDataItem extends TimedValue {
	y: Coordinate;
	shape: SeriesMarkerShape;
	color: string;
	id?: string;
}

function ceilToEven(x: number): number {
	const ceiled = Math.ceil(x);
	return (ceiled % 2 !== 0) ? ceiled - 1 : ceiled;
}

function ceilToOdd(x: number): number {
	const ceiled = Math.ceil(x);
	return (ceiled % 2 === 0) ? ceiled - 1 : ceiled;
}

export function calculateShapeHeight(shape: SeriesMarkerShape, barSpacing: number): number {
	return ceilToEven(barSpacing);
}

export const shapesMargin = 4;

export interface SeriesMarkerRendererData {
	items: SeriesMarkerRendererDataItem[];
	visibleRange: SeriesItemsIndexesRange | null;
	barSpacing: number;
}

function circleItemRenderer(ctx: CanvasRenderingContext2D, x: Coordinate, y: Coordinate, color: string, barSpacing: number): void {
	const size = ceilToOdd(barSpacing * 0.8);
	const halfSize = (size - 1) / 2;
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(x, y, halfSize, 0, 2 * Math.PI, false);
	ctx.fill();
}

function squareItemRenderer(ctx: CanvasRenderingContext2D, x: Coordinate, y: Coordinate, color: string, barSpacing: number): void {
	const size = ceilToOdd(barSpacing * 0.7);
	const halfSize = (size - 1) / 2;
	const left = x - halfSize;
	const top = y - halfSize;
	ctx.fillStyle = color;
	ctx.fillRect(left, top, size, size);
}

function arrowRenderer(up: boolean, ctx: CanvasRenderingContext2D, x: Coordinate, y: Coordinate, color: string, barSpacing: number): void {
	ctx.fillStyle = color;
	if (barSpacing < 3) {
		// there is no reason to draw so small arrow
		ctx.fillRect(x, y, 1, 1);
		return;
	}
	ctx.beginPath();
	const arrowSize = ceilToOdd(barSpacing * 0.8);
	const halfArrowSize = (arrowSize - 1) / 2;
	const baseSize = ceilToOdd(barSpacing * 0.4);
	const halfBaseSize = (baseSize - 1) / 2;
	ctx.beginPath();
	if (up) {
		ctx.moveTo(x - halfArrowSize, y);
		ctx.lineTo(x, y - halfArrowSize);
		ctx.lineTo(x + halfArrowSize, y);
		ctx.lineTo(x + halfBaseSize, y);
		ctx.lineTo(x + halfBaseSize, y + halfArrowSize);
		ctx.lineTo(x - halfBaseSize, y + halfArrowSize);
		ctx.lineTo(x - halfBaseSize, y);
	} else {
		ctx.moveTo(x - halfArrowSize, y);
		ctx.lineTo(x, y + halfArrowSize);
		ctx.lineTo(x + halfArrowSize, y);
		ctx.lineTo(x + halfBaseSize, y);
		ctx.lineTo(x + halfBaseSize, y - halfArrowSize);
		ctx.lineTo(x - halfBaseSize, y - halfArrowSize);
		ctx.lineTo(x - halfBaseSize, y);
	}
	ctx.fill();
}

// x, y is the center
const shapeItemsRenderers: Map<SeriesMarkerShape, (ctx: CanvasRenderingContext2D, x: Coordinate, y: Coordinate, color: string, barSpacing: number) => void> = new Map([
	['circle', circleItemRenderer],
	['square', squareItemRenderer],
	['arrowUp', arrowRenderer.bind(null, true)],
	['arrowDown', arrowRenderer.bind(null, false)],
]);

export class SeriesMarkersRenderer implements IPaneRenderer {
	private _data: SeriesMarkerRendererData | null = null;

	public setData(data: SeriesMarkerRendererData): void {
		this._data = data;
	}

	public draw(ctx: CanvasRenderingContext2D, isHovered: boolean): void {
		if (this._data === null || this._data.visibleRange === null) {
			return;
		}
		ctx.save();
		ctx.translate(0.5, 0.5);
		for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; i++) {
			const item = this._data.items[i];
			ensureDefined(shapeItemsRenderers.get(item.shape))(ctx, item.x, item.y, item.color, this._data.barSpacing);
		}
		ctx.restore();
	}

	public hitTest(x: Coordinate, y: Coordinate): boolean {
		return false;
	}
}
