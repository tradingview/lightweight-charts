import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';

import { Coordinate } from '../model/coordinate';
import { PricedValue } from '../model/price-scale';
import { SeriesItemsIndexesRange, TimedValue } from '../model/time-data';

import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
import { LinePoint, LineStyle, LineType, LineWidth, setLineStyle } from './draw-line';
import { walkLine } from './walk-line';

export type AreaFillItemBase = TimedValue & PricedValue & LinePoint;
export interface PaneRendererAreaDataBase<TItem extends AreaFillItemBase = AreaFillItemBase> {
	items: TItem[];
	lineType: LineType;
	lineWidth: LineWidth;
	lineStyle: LineStyle;

	baseLevelCoordinate: Coordinate | null;
	invertFilledArea: boolean;

	barWidth: number;

	visibleRange: SeriesItemsIndexesRange | null;
}

function finishStyledArea(
	baseLevelCoordinate: Coordinate,
	scope: BitmapCoordinatesRenderingScope,
	style: CanvasRenderingContext2D['fillStyle'],
	areaFirstItem: LinePoint,
	newAreaFirstItem: LinePoint
): void {
	const { context, horizontalPixelRatio, verticalPixelRatio } = scope;
	context.lineTo(newAreaFirstItem.x * horizontalPixelRatio, baseLevelCoordinate * verticalPixelRatio);
	context.lineTo(areaFirstItem.x * horizontalPixelRatio, baseLevelCoordinate * verticalPixelRatio);
	context.closePath();
	context.fillStyle = style;
	context.fill();
}

export abstract class PaneRendererAreaBase<TData extends PaneRendererAreaDataBase> extends BitmapCoordinatesPaneRenderer {
	protected _data: TData | null = null;

	public setData(data: TData): void {
		this._data = data;
	}

	protected _drawImpl(renderingScope: BitmapCoordinatesRenderingScope): void {
		if (this._data === null) {
			return;
		}

		const { items, visibleRange, barWidth, lineWidth, lineStyle, lineType } = this._data;
		const baseLevelCoordinate =
			this._data.baseLevelCoordinate ??
				(this._data.invertFilledArea ? 0 : renderingScope.mediaSize.height) as Coordinate;

		if (visibleRange === null) {
			return;
		}

		const ctx = renderingScope.context;

		ctx.lineCap = 'butt';
		ctx.lineJoin = 'round';
		ctx.lineWidth = lineWidth;
		setLineStyle(ctx, lineStyle);

		// walk lines with width=1 to have more accurate gradient's filling
		ctx.lineWidth = 1;

		walkLine(renderingScope, items, lineType, visibleRange, barWidth, this._fillStyle.bind(this), finishStyledArea.bind(null, baseLevelCoordinate));
	}

	protected abstract _fillStyle(renderingScope: BitmapCoordinatesRenderingScope, item: TData['items'][0]): CanvasRenderingContext2D['fillStyle'];
}
