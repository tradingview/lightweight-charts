import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';

import { PricedValue } from '../model/price-scale';
import { SeriesItemsIndexesRange, TimedValue } from '../model/time-data';

import { BitmapCoordinatesPaneRenderer } from './bitmap-coordinates-pane-renderer';
import { LinePoint, LineStyle, LineType, LineWidth, setLineStyle } from './draw-line';
import { drawSeriesPointMarkers } from './draw-series-point-markers';
import { walkLine } from './walk-line';

export type LineItemBase = TimedValue & PricedValue & LinePoint;

export interface PaneRendererLineDataBase<TItem extends LineItemBase = LineItemBase> {
	lineType?: LineType;

	items: TItem[];

	barWidth: number;

	lineWidth: LineWidth;
	lineStyle: LineStyle;

	visibleRange: SeriesItemsIndexesRange | null;

	pointMarkersRadius?: number;
}

function finishStyledArea(scope: BitmapCoordinatesRenderingScope, style: CanvasRenderingContext2D['strokeStyle']): void {
	const ctx = scope.context;
	ctx.strokeStyle = style;
	ctx.stroke();
}

export abstract class PaneRendererLineBase<TData extends PaneRendererLineDataBase> extends BitmapCoordinatesPaneRenderer {
	protected _data: TData | null = null;

	public setData(data: TData): void {
		this._data = data;
	}

	protected _drawImpl(renderingScope: BitmapCoordinatesRenderingScope): void {
		if (this._data === null) {
			return;
		}

		const { items, visibleRange, barWidth, lineType, lineWidth, lineStyle, pointMarkersRadius } = this._data;

		if (visibleRange === null) {
			return;
		}

		const ctx = renderingScope.context;

		ctx.lineCap = 'butt';
		ctx.lineWidth = lineWidth * renderingScope.verticalPixelRatio;

		setLineStyle(ctx, lineStyle);

		ctx.lineJoin = 'round';

		const styleGetter = this._strokeStyle.bind(this);

		if (lineType !== undefined) {
			walkLine(renderingScope, items, lineType, visibleRange, barWidth, styleGetter, finishStyledArea);
		}

		if (pointMarkersRadius) {
			drawSeriesPointMarkers(renderingScope, items, pointMarkersRadius, visibleRange, styleGetter);
		}
	}

	protected abstract _strokeStyle(renderingScope: BitmapCoordinatesRenderingScope, item: TData['items'][0]): CanvasRenderingContext2D['strokeStyle'];
}
