import { PricedValue } from '../model/price-scale';
import { SeriesItemsIndexesRange, TimedValue } from '../model/time-data';

import { LinePoint, LineStyle, LineType, LineWidth, setLineStyle } from './draw-line';
import { ScaledRenderer } from './scaled-renderer';
import { getControlPoints, walkLine } from './walk-line';

export type LineItem = TimedValue & PricedValue & LinePoint & { color?: string };

export interface PaneRendererLineDataBase {
	lineType: LineType;

	items: LineItem[];

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

		ctx.lineCap = 'butt';
		ctx.lineWidth = this._data.lineWidth;

		setLineStyle(ctx, this._data.lineStyle);

		ctx.strokeStyle = this._strokeStyle(ctx);
		ctx.lineJoin = 'round';

		if (this._data.items.length === 1) {
			ctx.beginPath();

			const point = this._data.items[0];
			ctx.moveTo(point.x - this._data.barWidth / 2, point.y);
			ctx.lineTo(point.x + this._data.barWidth / 2, point.y);

			if (point.color !== undefined) {
				ctx.strokeStyle = point.color;
			}

			ctx.stroke();
		} else {
			this._drawLine(ctx, this._data);
		}
	}

	protected _drawLine(ctx: CanvasRenderingContext2D, data: TData): void {
		ctx.beginPath();
		walkLine(ctx, data.items, data.lineType, data.visibleRange as SeriesItemsIndexesRange);
		ctx.stroke();
	}

	protected abstract _strokeStyle(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D['strokeStyle'];
}

export interface PaneRendererLineData extends PaneRendererLineDataBase {
	lineColor: string;
}

export class PaneRendererLine extends PaneRendererLineBase<PaneRendererLineData> {
	/**
	 * Similar to {@link walkLine}, but supports color changes
	 */
	protected override _drawLine(ctx: CanvasRenderingContext2D, data: PaneRendererLineData): void {
		const { items, visibleRange, lineType, lineColor } = data;
		if (items.length === 0 || visibleRange === null) {
			return;
		}

		ctx.beginPath();

		const firstItem = items[visibleRange.from];
		ctx.moveTo(firstItem.x, firstItem.y);

		let prevStrokeStyle = firstItem.color ?? lineColor;
		ctx.strokeStyle = prevStrokeStyle;

		const changeColor = (color: string) => {
			ctx.stroke();
			ctx.beginPath();
			ctx.strokeStyle = color;
			prevStrokeStyle = color;
		};

		for (let i = visibleRange.from + 1; i < visibleRange.to; ++i) {
			const currItem = items[i];
			const currentStrokeStyle = currItem.color ?? lineColor;

			switch (lineType) {
				case LineType.Simple:
					ctx.lineTo(currItem.x, currItem.y);
					break;
				case LineType.WithSteps:
					ctx.lineTo(currItem.x, items[i - 1].y);

					if (currentStrokeStyle !== prevStrokeStyle) {
						changeColor(currentStrokeStyle);
						ctx.lineTo(currItem.x, items[i - 1].y);
					}

					ctx.lineTo(currItem.x, currItem.y);
					break;
				case LineType.Curved: {
					const [cp1, cp2] = getControlPoints(items, i - 1, i);
					ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, currItem.x, currItem.y);
					break;
				}
			}

			if (lineType !== LineType.WithSteps && currentStrokeStyle !== prevStrokeStyle) {
				changeColor(currentStrokeStyle);
				ctx.moveTo(currItem.x, currItem.y);
			}
		}

		ctx.stroke();
	}

	protected override _strokeStyle(): CanvasRenderingContext2D['strokeStyle'] {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return this._data!.lineColor;
	}
}
