import { PricedValue } from '../model/price-scale';
import { LineStrokeColorerStyle } from '../model/series-bar-colorer';
import { SeriesItemsIndexesRange, TimedValue } from '../model/time-data';

import { LinePoint, LineStyle, LineType, LineWidth, setLineStyle } from './draw-line';
import { ScaledRenderer } from './scaled-renderer';
import { getControlPoints } from './walk-line';

export type LineItemBase = TimedValue & PricedValue & LinePoint;

export interface PaneRendererLineDataBase<TItem extends LineItemBase = LineItemBase> {
	lineType: LineType;

	items: TItem[];

	barWidth: number;

	lineWidth: LineWidth;
	lineStyle: LineStyle;

	visibleRange: SeriesItemsIndexesRange | null;
}

export abstract class PaneRendererLineBase<TData extends PaneRendererLineDataBase> extends ScaledRenderer {
	protected _data: TData | null = null;

	public setData(data: TData): void {
		this._data = data;
	}

	protected _drawImpl(ctx: CanvasRenderingContext2D): void {
		if (this._data === null || this._data.items.length === 0 || this._data.visibleRange === null) {
			return;
		}

		const { items, visibleRange, barWidth, lineType, lineWidth, lineStyle } = this._data;

		ctx.lineCap = 'butt';
		ctx.lineWidth = lineWidth;

		setLineStyle(ctx, lineStyle);

		ctx.lineJoin = 'round';

		const firstItem = items[visibleRange.from];
		let currentStrokeStyle = this._strokeStyle(ctx, firstItem);
		ctx.beginPath();

		if (visibleRange.from === visibleRange.to) {
			ctx.beginPath();

			ctx.moveTo(firstItem.x - barWidth / 2, firstItem.y);
			ctx.lineTo(firstItem.x + barWidth / 2, firstItem.y);
		} else {
			const changeStrokeStyle = (strokeStyle: CanvasRenderingContext2D['strokeStyle']) => {
				ctx.strokeStyle = currentStrokeStyle;
				ctx.stroke();
				ctx.beginPath();
				currentStrokeStyle = strokeStyle;
			};

			ctx.moveTo(firstItem.x, firstItem.y);

			for (let i = visibleRange.from + 1; i < visibleRange.to; ++i) {
				const currentItem = items[i];
				const itemStrokeStyle = this._strokeStyle(ctx, currentItem);

				switch (lineType) {
					case LineType.Simple:
						ctx.lineTo(currentItem.x, currentItem.y);
						break;
					case LineType.WithSteps:
						ctx.lineTo(currentItem.x, items[i - 1].y);

						if (currentStrokeStyle !== itemStrokeStyle) {
							changeStrokeStyle(itemStrokeStyle);
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

				if (lineType !== LineType.WithSteps && currentStrokeStyle !== itemStrokeStyle) {
					changeStrokeStyle(itemStrokeStyle);
					ctx.moveTo(currentItem.x, currentItem.y);
				}
			}

			ctx.strokeStyle = currentStrokeStyle;
			ctx.stroke();
		}
	}

	protected abstract _strokeStyle(ctx: CanvasRenderingContext2D, item: TData['items'][0]): CanvasRenderingContext2D['strokeStyle'];
}

export type LineStrokeItem = LineItemBase & Partial<LineStrokeColorerStyle>;
export interface PaneRendererLineData extends PaneRendererLineDataBase<LineStrokeItem>, LineStrokeColorerStyle {
}

export class PaneRendererLine extends PaneRendererLineBase<PaneRendererLineData> {
	protected override _strokeStyle(ctx: CanvasRenderingContext2D, item: LineStrokeItem): CanvasRenderingContext2D['strokeStyle'] {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return item.lineColor ?? this._data!.lineColor;
	}
}
