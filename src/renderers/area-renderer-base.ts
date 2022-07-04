import { Coordinate } from '../model/coordinate';
import { PricedValue } from '../model/price-scale';
import { SeriesItemsIndexesRange, TimedValue } from '../model/time-data';

import { LinePoint, LineStyle, LineType, LineWidth, setLineStyle } from './draw-line';
import { ScaledRenderer } from './scaled-renderer';
import { walkLine } from './walk-line';

export type AreaFillItemBase = TimedValue & PricedValue & LinePoint;
export interface PaneRendererAreaDataBase<TItem extends AreaFillItemBase = AreaFillItemBase> {
	items: TItem[];
	lineType: LineType;
	lineWidth: LineWidth;
	lineStyle: LineStyle;

	bottom: Coordinate;
	baseLevelCoordinate: Coordinate;

	barWidth: number;

	visibleRange: SeriesItemsIndexesRange | null;
}

function finishStyledArea(
	baseLevelCoordinate: Coordinate,
	ctx: CanvasRenderingContext2D,
	style: CanvasRenderingContext2D['fillStyle'],
	areaFirstItem: LinePoint,
	newAreaFirstItem: LinePoint
): void {
	ctx.lineTo(newAreaFirstItem.x, baseLevelCoordinate);
	ctx.lineTo(areaFirstItem.x, baseLevelCoordinate);
	ctx.closePath();
	ctx.fillStyle = style;
	ctx.fill();
}

export abstract class PaneRendererAreaBase<TData extends PaneRendererAreaDataBase> extends ScaledRenderer {
	protected _data: TData | null = null;

	public setData(data: TData): void {
		this._data = data;
	}

	protected _drawImpl(ctx: CanvasRenderingContext2D): void {
		if (this._data === null) {
			return;
		}

		const { items, visibleRange, barWidth, lineWidth, lineStyle, lineType, baseLevelCoordinate } = this._data;

		if (visibleRange === null) {
			return;
		}

		ctx.lineCap = 'butt';
		ctx.lineJoin = 'round';
		ctx.lineWidth = lineWidth;
		setLineStyle(ctx, lineStyle);

		// walk lines with width=1 to have more accurate gradient's filling
		ctx.lineWidth = 1;

		walkLine(ctx, items, lineType, visibleRange, barWidth, this._fillStyle.bind(this), finishStyledArea.bind(null, baseLevelCoordinate));
	}

	protected abstract _fillStyle(ctx: CanvasRenderingContext2D, item: TData['items'][0]): CanvasRenderingContext2D['fillStyle'];
}
