import { Coordinate } from '../model/coordinate';
import { PricedValue } from '../model/price-scale';
import { SeriesItemsIndexesRange, TimedValue } from '../model/time-data';

import { LinePoint, LineStyle, LineType, LineWidth, setLineStyle } from './draw-line';
import { ScaledRenderer } from './scaled-renderer';
import { getControlPoints } from './walk-line';

export type AreaItem = TimedValue & PricedValue & LinePoint & { lineColor?: string; topColor?: string; bottomColor?: string };
export interface PaneRendererAreaDataBase {
	items: AreaItem[];
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

		const { items, visibleRange, barWidth, lineWidth, lineStyle, lineType, baseLevelCoordinate } = this._data;

		ctx.lineCap = 'butt';
		ctx.lineJoin = 'round';
		ctx.lineWidth = lineWidth;
		setLineStyle(ctx, lineStyle);

		// walk lines with width=1 to have more accurate gradient's filling
		ctx.lineWidth = 1;

		ctx.beginPath();

		const firstItem = items[visibleRange.from];
		ctx.moveTo(firstItem.x, firstItem.y);

		let currentFillStyle = this._fillStyle(ctx, firstItem);
		let currentFillStyleFirstItem = firstItem;

		const changeFillStyle = (fillStyle: CanvasRenderingContext2D['fillStyle'], currentItem: AreaItem) => {
			ctx.lineTo(currentItem.x, baseLevelCoordinate);
			ctx.lineTo(currentFillStyleFirstItem.x, baseLevelCoordinate);
			ctx.closePath();
			ctx.fillStyle = currentFillStyle;
			ctx.fill();
			ctx.beginPath();
			currentFillStyle = fillStyle;
			currentFillStyleFirstItem = currentItem;
		};

		if (visibleRange.from === visibleRange.to) {
			const halfBarWidth = barWidth / 2;
			ctx.moveTo(firstItem.x - halfBarWidth, baseLevelCoordinate);
			ctx.lineTo(firstItem.x - halfBarWidth, firstItem.y);
			ctx.lineTo(firstItem.x + halfBarWidth, firstItem.y);
			ctx.lineTo(firstItem.x + halfBarWidth, baseLevelCoordinate);
		} else {
			let currentItem: AreaItem | undefined;
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

			if (visibleRange.to > visibleRange.from) {
				// visibleRange.from !== visibleRange.to so currentItem should be initialized here
				ctx.lineTo((currentItem as AreaItem).x, baseLevelCoordinate);
				ctx.lineTo(currentFillStyleFirstItem.x, baseLevelCoordinate);
			}
		}

		ctx.closePath();
		ctx.fillStyle = currentFillStyle;
		ctx.fill();
	}

	protected abstract _fillStyle(ctx: CanvasRenderingContext2D, item: AreaItem): CanvasRenderingContext2D['fillStyle'];
}

export interface PaneRendererAreaData extends PaneRendererAreaDataBase {
	topColor: string;
	bottomColor: string;
}

interface FillStyleCache {
	topColor: string;
	bottomColor: string;
	fillStyle: CanvasRenderingContext2D['fillStyle'];
}

export class PaneRendererArea extends PaneRendererAreaBase<PaneRendererAreaData> {
	private _fillStyleCache: FillStyleCache | null = null;

	protected override _fillStyle(ctx: CanvasRenderingContext2D, item: AreaItem): CanvasRenderingContext2D['fillStyle'] {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const data = this._data!;

		const topColor = item.topColor ?? data.topColor;
		const bottomColor = item.bottomColor ?? data.bottomColor;

		if (
			this._fillStyleCache !== null &&
			this._fillStyleCache.topColor === topColor &&
			this._fillStyleCache.bottomColor === bottomColor
		) {
			return this._fillStyleCache.fillStyle;
		}

		const fillStyle = ctx.createLinearGradient(0, 0, 0, data.bottom);
		fillStyle.addColorStop(0, topColor);
		fillStyle.addColorStop(1, bottomColor);

		this._fillStyleCache = { topColor, bottomColor, fillStyle };

		return fillStyle;
	}
}
