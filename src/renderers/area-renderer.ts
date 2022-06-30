import { Coordinate } from '../model/coordinate';
import { PricedValue } from '../model/price-scale';
import { AreaFillColorerStyle } from '../model/series-bar-colorer';
import { SeriesItemsIndexesRange, TimedValue } from '../model/time-data';

import { LinePoint, LineStyle, LineType, LineWidth, setLineStyle } from './draw-line';
import { ScaledRenderer } from './scaled-renderer';
import { getControlPoints } from './walk-line';

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

		if (items.length === 0 || visibleRange === null || visibleRange.from >= items.length) {
			return;
		}

		ctx.lineCap = 'butt';
		ctx.lineJoin = 'round';
		ctx.lineWidth = lineWidth;
		setLineStyle(ctx, lineStyle);

		// walk lines with width=1 to have more accurate gradient's filling
		ctx.lineWidth = 1;

		ctx.beginPath();

		const firstItem = items[visibleRange.from];
		let currentFillStyle = this._fillStyle(ctx, firstItem);
		let currentFillStyleFirstItem = firstItem;

		type TItem = TData['items'][0];

		if (visibleRange.to - visibleRange.from < 2) {
			const halfBarWidth = barWidth / 2;
			ctx.moveTo(firstItem.x - halfBarWidth, baseLevelCoordinate);
			ctx.lineTo(firstItem.x - halfBarWidth, firstItem.y);
			ctx.lineTo(firstItem.x + halfBarWidth, firstItem.y);
			ctx.lineTo(firstItem.x + halfBarWidth, baseLevelCoordinate);
		} else {
			const changeFillStyle = (fillStyle: CanvasRenderingContext2D['fillStyle'], currentItem: TItem) => {
				ctx.lineTo(currentItem.x, baseLevelCoordinate);
				ctx.lineTo(currentFillStyleFirstItem.x, baseLevelCoordinate);
				ctx.closePath();
				ctx.fillStyle = currentFillStyle;
				ctx.fill();
				ctx.beginPath();
				currentFillStyle = fillStyle;
				currentFillStyleFirstItem = currentItem;
			};

			let currentItem: TData['items'][0] | undefined;

			ctx.moveTo(firstItem.x, firstItem.y);
			for (let i = visibleRange.from + 1; i < visibleRange.to; ++i) {
				currentItem = items[i];
				const itemFillStyle = this._fillStyle(ctx, currentItem);

				switch (lineType) {
					case LineType.Simple:
						ctx.lineTo(currentItem.x, currentItem.y);
						break;
					case LineType.WithSteps:
						ctx.lineTo(currentItem.x, items[i - 1].y);

						if (itemFillStyle !== currentFillStyle) {
							changeFillStyle(itemFillStyle, currentItem);
							ctx.lineTo(currentItem.x, items[i - 1].y);
						}

						ctx.lineTo(currentItem.x, currentItem.y);
						break;
					case LineType.Curved: {
						const [cp1, cp2] = getControlPoints(items, i - 1, i);
						ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, currentItem.x, currentItem.y);
						break;
					}
				}

				if (lineType !== LineType.WithSteps && itemFillStyle !== currentFillStyle) {
					changeFillStyle(itemFillStyle, currentItem);
					ctx.moveTo(currentItem.x, currentItem.y);
				}
			}

			// visibleRange.to - visibleRange.from > 1 so currentItem should be initialized here
			ctx.lineTo((currentItem as TItem).x, baseLevelCoordinate);
			ctx.lineTo(currentFillStyleFirstItem.x, baseLevelCoordinate);
		}

		ctx.closePath();
		ctx.fillStyle = currentFillStyle;
		ctx.fill();
	}

	protected abstract _fillStyle(ctx: CanvasRenderingContext2D, item: TData['items'][0]): CanvasRenderingContext2D['fillStyle'];
}

export type AreaFillItem = AreaFillItemBase & AreaFillColorerStyle;
export interface PaneRendererAreaData extends PaneRendererAreaDataBase<AreaFillItem> {
}

interface AreaFillCache extends Record<keyof AreaFillColorerStyle, string> {
	fillStyle: CanvasRenderingContext2D['fillStyle'];
	bottom: Coordinate;
}

export class PaneRendererArea extends PaneRendererAreaBase<PaneRendererAreaData> {
	private _fillCache: AreaFillCache | null = null;

	protected override _fillStyle(ctx: CanvasRenderingContext2D, item: AreaFillItem): CanvasRenderingContext2D['fillStyle'] {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const data = this._data!;

		const { topColor, bottomColor } = item;
		const bottom = data.bottom;

		if (
			this._fillCache !== null &&
			this._fillCache.topColor === topColor &&
			this._fillCache.bottomColor === bottomColor &&
			this._fillCache.bottom === bottom
		) {
			return this._fillCache.fillStyle;
		}

		const fillStyle = ctx.createLinearGradient(0, 0, 0, bottom);
		fillStyle.addColorStop(0, topColor);
		fillStyle.addColorStop(1, bottomColor);

		this._fillCache = { topColor, bottomColor, fillStyle, bottom };

		return fillStyle;
	}
}
