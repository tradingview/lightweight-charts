import { PricedValue } from '../model/price-scale';
import { SeriesItemsIndexesRange, TimedValue } from '../model/time-data';

import { LinePoint, LineStyle, LineType, LineWidth, setLineStyle } from './draw-line';
import { ScaledRenderer } from './scaled-renderer';
import { walkInterpolatedCurveBetweenPoints } from './walk-curve';
import { walkLine } from './walk-line';

export type LineItem = TimedValue & PricedValue & LinePoint & { color?: string };

export interface PaneRendererLineDataBase {
	lineType: LineType;

	items: LineItem[];

	barWidth: number;

	lineWidth: LineWidth;
	lineStyle: LineStyle;
	lineTension: number;

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
		walkLine(ctx, data.items, data.lineType, data.lineTension, data.visibleRange as SeriesItemsIndexesRange);
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
		const { items, visibleRange, lineType, lineColor, lineTension } = data;
		if (items.length === 0 || visibleRange === null) {
			return;
		}

		ctx.beginPath();

		if (lineTension > 0 && lineType === LineType.Simple) {
			this._walkCurveWithColorChange(ctx, data.items, lineTension, visibleRange, lineColor);
		} else {
			this._walkLineWithColorChange(ctx, items, lineType, lineColor, visibleRange);
		}

		ctx.stroke();
	}

	protected override _strokeStyle(): CanvasRenderingContext2D['strokeStyle'] {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return this._data!.lineColor;
	}

	private _walkLineWithColorChange(ctx: CanvasRenderingContext2D, items: LineItem[], lineType: LineType, lineColor: string, visibleRange: SeriesItemsIndexesRange): void {
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
			const prevItem = items[i - 1];

			const currentStrokeStyle = currItem.color ?? lineColor;

			if (lineType === LineType.WithSteps) {
				ctx.lineTo(currItem.x, prevItem.y);

				if (currentStrokeStyle !== prevStrokeStyle) {
					changeColor(currentStrokeStyle);
					ctx.moveTo(currItem.x, prevItem.y);
				}
			}

			ctx.lineTo(currItem.x, currItem.y);

			if (lineType !== LineType.WithSteps && currentStrokeStyle !== prevStrokeStyle) {
				changeColor(currentStrokeStyle);
				ctx.moveTo(currItem.x, currItem.y);
			}
		}
	}

	private _walkCurveWithColorChange(
		ctx: CanvasRenderingContext2D,
		points: readonly LineItem[],
		lineTension: number,
		visibleRange: SeriesItemsIndexesRange,
		lineColor: string
	): void {
		const from = visibleRange.from;
		const to = visibleRange.to;

		let prevStrokeStyle = points[from].color ?? lineColor;
		ctx.strokeStyle = prevStrokeStyle;

		const changeColor = (color: string) => {
			ctx.stroke();
			ctx.beginPath();
			ctx.strokeStyle = color;
			prevStrokeStyle = color;
		};

		ctx.moveTo(points[from].x, points[from].y);

		// A curved line with only two points is a special case: we draw a straight line.
		if (to - from === 2) {
			ctx.lineTo(points[to - 1].x, points[to - 1].y);
			return;
		}

		walkInterpolatedCurveBetweenPoints(ctx, lineTension, points[from], points[from], points[from + 1], points[from + 2]);

		for (let i = from + 1; i < to - 2; i++) {
			const currentStrokeStyle = points[i].color ?? lineColor;

			if (currentStrokeStyle !== prevStrokeStyle) {
				changeColor(currentStrokeStyle);
			}

			walkInterpolatedCurveBetweenPoints(ctx, lineTension, points[i - 1], points[i], points[i + 1], points[i + 2]);
		}

		const currentStrokeStyle = points[to - 2].color ?? lineColor;

		if (currentStrokeStyle !== prevStrokeStyle) {
			changeColor(currentStrokeStyle);
		}

		walkInterpolatedCurveBetweenPoints(ctx, lineTension, points[to - 3], points[to - 2], points[to - 1], points[to - 1]);
	}
}
