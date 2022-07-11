import { Coordinate } from '../model/coordinate';
import { SeriesItemsIndexesRange } from '../model/time-data';

import { MediaCoordsRenderingScope } from './canvas-rendering-target';
import { LineStyle, LineType, LineWidth, setLineStyle } from './draw-line';
import { LineItem } from './line-renderer';
import { ScaledRenderer } from './scaled-renderer';
import { walkLine } from './walk-line';

export interface PaneRendererAreaDataBase {
	items: LineItem[];
	lineType: LineType;
	lineWidth: LineWidth;
	lineStyle: LineStyle;

	baseLevelCoordinate: Coordinate | null;

	barWidth: number;

	visibleRange: SeriesItemsIndexesRange | null;
}

export abstract class PaneRendererAreaBase<TData extends PaneRendererAreaDataBase> extends ScaledRenderer {
	protected _data: TData | null = null;

	public setData(data: TData): void {
		this._data = data;
	}

	protected _drawImpl(renderingScope: MediaCoordsRenderingScope): void {
		if (this._data === null || this._data.items.length === 0 || this._data.visibleRange === null) {
			return;
		}

		const ctx = renderingScope.context;
		const baseLevelCoordinate = this._data.baseLevelCoordinate ?? renderingScope.mediaSize.height;

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
			ctx.moveTo(point.x - halfBarWidth, baseLevelCoordinate);
			ctx.lineTo(point.x - halfBarWidth, point.y);
			ctx.lineTo(point.x + halfBarWidth, point.y);
			ctx.lineTo(point.x + halfBarWidth, baseLevelCoordinate);
		} else {
			ctx.moveTo(this._data.items[this._data.visibleRange.from].x, baseLevelCoordinate);
			ctx.lineTo(this._data.items[this._data.visibleRange.from].x, this._data.items[this._data.visibleRange.from].y);

			walkLine(ctx, this._data.items, this._data.lineType, this._data.visibleRange);

			if (this._data.visibleRange.to > this._data.visibleRange.from) {
				ctx.lineTo(this._data.items[this._data.visibleRange.to - 1].x, baseLevelCoordinate);
				ctx.lineTo(this._data.items[this._data.visibleRange.from].x, baseLevelCoordinate);
			}
		}
		ctx.closePath();

		ctx.fillStyle = this._fillStyle(renderingScope);
		ctx.fill();
	}

	protected abstract _fillStyle(renderingScope: MediaCoordsRenderingScope): CanvasRenderingContext2D['fillStyle'];
}

export interface PaneRendererAreaData extends PaneRendererAreaDataBase {
	topColor: string;
	bottomColor: string;
}

export class PaneRendererArea extends PaneRendererAreaBase<PaneRendererAreaData> {
	protected override _fillStyle(renderingScope: MediaCoordsRenderingScope): CanvasRenderingContext2D['fillStyle'] {
		const { context: ctx, mediaSize } = renderingScope;
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const data = this._data!;

		const gradient = ctx.createLinearGradient(0, 0, 0, mediaSize.height);
		gradient.addColorStop(0, data.topColor);
		gradient.addColorStop(1, data.bottomColor);
		return gradient;
	}
}
