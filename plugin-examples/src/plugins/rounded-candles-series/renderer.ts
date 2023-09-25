import {
	CanvasRenderingTarget2D,
	BitmapCoordinatesRenderingScope,
} from 'fancy-canvas';
import {
	ICustomSeriesPaneRenderer,
	PaneRendererCustomData,
	PriceToCoordinateConverter,
	Range,
	Time,
} from 'lightweight-charts';
import {
	RoundedCandleSeriesOptions,
} from './rounded-candles-series';
import { RoundedCandleSeriesData } from './data';
import { candlestickWidth } from '../../helpers/dimensions/candles';
import { gridAndCrosshairMediaWidth } from '../../helpers/dimensions/crosshair-width';
import { positionsBox, positionsLine } from '../../helpers/dimensions/positions';

interface BarItem {
	openY: number;
	highY: number;
	lowY: number;
	closeY: number;
	x: number;
	isUp: boolean;
}

export class RoundedCandleSeriesRenderer<TData extends RoundedCandleSeriesData>
	implements ICustomSeriesPaneRenderer
{
	_data: PaneRendererCustomData<Time, TData> | null = null;
	_options: RoundedCandleSeriesOptions | null = null;

	draw(
		target: CanvasRenderingTarget2D,
		priceConverter: PriceToCoordinateConverter
	): void {
		target.useBitmapCoordinateSpace(scope =>
			this._drawImpl(scope, priceConverter)
		);
	}

	update(
		data: PaneRendererCustomData<Time, TData>,
		options: RoundedCandleSeriesOptions
	): void {
		this._data = data;
		this._options = options;
	}

	_drawImpl(
		renderingScope: BitmapCoordinatesRenderingScope,
		priceToCoordinate: PriceToCoordinateConverter
	): void {
		if (
			this._data === null ||
			this._data.bars.length === 0 ||
			this._data.visibleRange === null ||
			this._options === null
		) {
			return;
		}

		let lastClose = -Infinity;
		const bars: BarItem[] = this._data.bars.map(bar => {
			const isUp = bar.originalData.close >= lastClose;
			lastClose = bar.originalData.close ?? lastClose;
			const openY = priceToCoordinate(bar.originalData.open as number) ?? 0;
			const highY = priceToCoordinate(bar.originalData.high as number) ?? 0;
			const lowY = priceToCoordinate(bar.originalData.low as number) ?? 0;
			const closeY = priceToCoordinate(bar.originalData.close as number) ?? 0;
			return {
				openY,
				highY,
				lowY,
				closeY,
				x: bar.x,
				isUp,
			};
		});

		const radius = this._options.radius(this._data.barSpacing);
		this._drawWicks(renderingScope, bars, this._data.visibleRange);
		this._drawCandles(renderingScope, bars, this._data.visibleRange, radius);
	}

	private _drawWicks(
		renderingScope: BitmapCoordinatesRenderingScope,
		bars: readonly BarItem[],
		visibleRange: Range<number>
	): void {
		if (this._data === null || this._options === null) {
			return;
		}

		const {
			context: ctx,
			horizontalPixelRatio,
			verticalPixelRatio,
		} = renderingScope;

		const wickWidth = gridAndCrosshairMediaWidth(horizontalPixelRatio);

		for (let i = visibleRange.from; i < visibleRange.to; i++) {
			const bar = bars[i];
			ctx.fillStyle = bar.isUp
				? this._options.wickUpColor
				: this._options.wickDownColor;

			const verticalPositions = positionsBox(bar.lowY, bar.highY, verticalPixelRatio);
			const linePositions = positionsLine(bar.x, horizontalPixelRatio, wickWidth);
			ctx.fillRect(linePositions.position, verticalPositions.position, linePositions.length, verticalPositions.length);
		}
	}

	private _drawCandles(
		renderingScope: BitmapCoordinatesRenderingScope,
		bars: readonly BarItem[],
		visibleRange: Range<number>,
		radius: number
	): void {
		if (this._data === null || this._options === null) {
			return;
		}

		const {
			context: ctx,
			horizontalPixelRatio,
			verticalPixelRatio,
		} = renderingScope;

		// we want this in media width therefore using 1
		// positionsLine will adjust for pixelRatio
		const candleBodyWidth = candlestickWidth(this._data.barSpacing, 1);

		for (let i = visibleRange.from; i < visibleRange.to; i++) {
			const bar = bars[i];

			const verticalPositions = positionsBox(Math.min(bar.openY, bar.closeY), Math.max(bar.openY, bar.closeY), verticalPixelRatio);
			const linePositions = positionsLine(bar.x, horizontalPixelRatio, candleBodyWidth);

			ctx.fillStyle = bar.isUp
				? this._options.upColor
				: this._options.downColor;

			// roundRect might need to polyfilled for older browsers
			if (ctx.roundRect) {
				ctx.beginPath();
				ctx.roundRect(linePositions.position, verticalPositions.position, linePositions.length, verticalPositions.length, radius);
				ctx.fill();
			} else {
				ctx.fillRect(linePositions.position, verticalPositions.position, linePositions.length, verticalPositions.length);
			}
		}
	}
}
