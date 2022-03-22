import { Coordinate } from '../model/coordinate';
import { SeriesItemsIndexesRange } from '../model/time-data';

import { LineStyle, LineType, LineWidth, setLineStyle } from './draw-line';
import { LineItem } from './line-renderer';
import { ScaledRenderer } from './scaled-renderer';
import { walkLine } from './walk-line';

export interface PaneRendererAreaDataBase {
	items: LineItem[];
	lineType: LineType;
	lineWidth: LineWidth;
	lineStyle: LineStyle;

	bottom: Coordinate;
	baseLevelCoordinate: Coordinate;

	barWidth: number;

	visibleRange: SeriesItemsIndexesRange | null;
}

export abstract class PaneRendererAreaBase<TData extends PaneRendererAreaDataBase> extends ScaledRenderer {
	protected _data: TData | null = null;

	public setData(data: TData): void {
		this._data = data;
	}

	protected _drawImpl(ctx: CanvasRenderingContext2D): void {
		if (this._data === null || this._data.items.length === 0 || this._data.visibleRange === null) {
			return;
		}

		ctx.lineCap = 'butt';
		ctx.lineJoin = 'round';
		ctx.lineWidth = this._data.lineWidth;
		setLineStyle(ctx, this._data.lineStyle);

		// walk lines with width=1 to have more accurate gradient's filling
		ctx.lineWidth = 1;

		ctx.beginPath();

		if (this._data.items.length === 1) {
			const point = this._data.items[0];
			const halfBarWidth = this._data.barWidth / 2;
			ctx.moveTo(point.x - halfBarWidth, this._data.baseLevelCoordinate);
			ctx.lineTo(point.x - halfBarWidth, point.y);
			ctx.lineTo(point.x + halfBarWidth, point.y);
			ctx.lineTo(point.x + halfBarWidth, this._data.baseLevelCoordinate);
		} else {
			ctx.moveTo(this._data.items[this._data.visibleRange.from].x, this._data.baseLevelCoordinate);
			ctx.lineTo(this._data.items[this._data.visibleRange.from].x, this._data.items[this._data.visibleRange.from].y);

			walkLine(ctx, this._data.items, this._data.lineType, this._data.visibleRange);

			if (this._data.visibleRange.to > this._data.visibleRange.from) {
				ctx.lineTo(this._data.items[this._data.visibleRange.to - 1].x, this._data.baseLevelCoordinate);
				ctx.lineTo(this._data.items[this._data.visibleRange.from].x, this._data.baseLevelCoordinate);
			}
		}
		ctx.closePath();

		ctx.fillStyle = this._fillStyle(ctx);
		ctx.fill();
	}

	protected abstract _fillStyle(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D['fillStyle'];
}

export interface PaneRendererAreaData extends PaneRendererAreaDataBase {
	topColor: string;
	bottomColor: string;
}

export class PaneRendererArea extends PaneRendererAreaBase<PaneRendererAreaData> {
	protected override _fillStyle(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D['fillStyle'] {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const data = this._data!;

		const gradient = ctx.createLinearGradient(0, 0, 0, data.bottom);
		gradient.addColorStop(0, data.topColor);
		gradient.addColorStop(1, data.bottomColor);
		return gradient;
	}
}
