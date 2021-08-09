import { clamp } from '../helpers/mathex';

import { Coordinate } from '../model/coordinate';
import { SeriesItemsIndexesRange } from '../model/time-data';

import { LineStyle, LineType, LineWidth, setLineStyle } from './draw-line';
import { LineItem } from './line-renderer';
import { ScaledRenderer } from './scaled-renderer';
import { walkLine } from './walk-line';

export interface PaneRendererAreaBaselineData {
	items: LineItem[];
	lineType: LineType;
	lineWidth: LineWidth;
	lineStyle: LineStyle;

	topLineColor: string;
	bottomLineColor: string;
	topFillColor1: string;
	topFillColor2: string;
	bottomFillColor1: string;
	bottomFillColor2: string;

	bottom: Coordinate;
	baseLine: Coordinate;

	barWidth: number;

	visibleRange: SeriesItemsIndexesRange | null;
}

export class PaneRendererAreaBaseline extends ScaledRenderer {
	protected _data: PaneRendererAreaBaselineData | null = null;
	protected _baseLine: Coordinate | null = null;

	public setData(data: PaneRendererAreaBaselineData): void {
		this._data = data;
		this._baseLine = Math.min(this._data.bottom, this._data.baseLine) as Coordinate;
	}

	protected _drawImpl(ctx: CanvasRenderingContext2D): void {
		this._drawArea(ctx);
		this._drawLine(ctx);
	}

	private _drawArea(ctx: CanvasRenderingContext2D): void {
		if (this._data === null || this._data.items.length === 0 || this._data.visibleRange === null || this._baseLine === null) {
			return;
		}
		const gradient = ctx.createLinearGradient(0, 0, 0, this._data.bottom);
		const baseLinePercent = this._baseLine / this._data.bottom;
		gradient.addColorStop(0, this._data.topFillColor1);
		gradient.addColorStop(clamp(baseLinePercent, 0, 1), this._data.topFillColor2);
		gradient.addColorStop(clamp(baseLinePercent + 0.01, 0, 1), this._data.bottomFillColor1); // Add small size
		gradient.addColorStop(1, this._data.bottomFillColor2);

		ctx.lineCap = 'butt';
		ctx.lineJoin = 'round';
		ctx.strokeStyle = gradient;
		ctx.lineWidth = this._data.lineWidth;
		setLineStyle(ctx, this._data.lineStyle);

		// walk lines with width=1 to have more accurate gradient's filling
		ctx.lineWidth = 1;

		ctx.beginPath();

		if (this._data.items.length === 1) {
			const point = this._data.items[0];
			const halfBarWidth = this._data.barWidth / 2;
			ctx.moveTo(point.x - halfBarWidth, this._baseLine);
			ctx.lineTo(point.x - halfBarWidth, point.y);
			ctx.lineTo(point.x + halfBarWidth, point.y);
			ctx.lineTo(point.x + halfBarWidth, this._baseLine);
		} else {
			ctx.moveTo(this._data.items[this._data.visibleRange.from].x, this._baseLine);
			ctx.lineTo(this._data.items[this._data.visibleRange.from].x, this._data.items[this._data.visibleRange.from].y);

			walkLine(ctx, this._data.items, this._data.lineType, this._data.visibleRange);

			if (this._data.visibleRange.to > this._data.visibleRange.from) {
				ctx.lineTo(this._data.items[this._data.visibleRange.to - 1].x, this._baseLine);
				ctx.lineTo(this._data.items[this._data.visibleRange.from].x, this._baseLine);
			}
		}
		ctx.closePath();

		ctx.fillStyle = gradient;
		ctx.fill();
	}

	private _drawLine(ctx: CanvasRenderingContext2D): void {
		if (this._data === null || this._data.items.length === 0 || this._data.visibleRange === null || this._baseLine === null) {
			return;
		}
		ctx.lineCap = 'butt';
		ctx.lineWidth = this._data.lineWidth;

		const gradient = ctx.createLinearGradient(0, 0, 0, this._data.bottom);
		const baseLinePercent = this._baseLine / this._data.bottom;
		gradient.addColorStop(0, this._data.topLineColor);
		gradient.addColorStop(clamp(baseLinePercent, 0, 1), this._data.topLineColor);
		gradient.addColorStop(clamp(baseLinePercent + 0.01, 0, 1), this._data.bottomLineColor); // Add small size
		gradient.addColorStop(1, this._data.bottomLineColor);
		setLineStyle(ctx, this._data.lineStyle);

		ctx.strokeStyle = gradient;
		ctx.lineJoin = 'round';

		ctx.beginPath();
		if (this._data.items.length === 1) {
			const point = this._data.items[0];
			ctx.moveTo(point.x - this._data.barWidth / 2, point.y);
			ctx.lineTo(point.x + this._data.barWidth / 2, point.y);
		} else {
			walkLine(ctx, this._data.items, this._data.lineType, this._data.visibleRange);
		}

		ctx.stroke();
	}
}
