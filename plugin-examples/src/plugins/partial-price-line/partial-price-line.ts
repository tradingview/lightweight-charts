import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
	BarData,
	IChartApi,
	ISeriesApi,
	ISeriesPrimitive,
	ISeriesPrimitivePaneRenderer,
	ISeriesPrimitivePaneView,
	LineData,
	LineStyleOptions,
	MismatchDirection,
	SeriesAttachedParameter,
	SeriesType,
	Time,
	WhitespaceData,
} from 'lightweight-charts';
import { positionsLine } from '../../helpers/dimensions/positions';

class PartialPriceLineRenderer implements ISeriesPrimitivePaneRenderer {
	_price: number | null = null;
	_x: number | null = null;
	_color: string = '#000000';
	update(priceY: number | null, color: string, x: number | null) {
		this._price = priceY;
		this._color = color;
		this._x = x;
	}

	draw(target: CanvasRenderingTarget2D) {
		target.useBitmapCoordinateSpace(scope => {
			if (this._price === null || this._x === null) return;
			const xPosition = Math.round(this._x * scope.horizontalPixelRatio);
			const yPosition = positionsLine(this._price, scope.verticalPixelRatio, scope.verticalPixelRatio);
			const yCentre = yPosition.position + yPosition.length / 2;
			const ctx = scope.context;
			ctx.beginPath();
			ctx.setLineDash([
				4 * scope.verticalPixelRatio,
				2 * scope.verticalPixelRatio,
			]);
			ctx.moveTo(xPosition, yCentre);
			ctx.lineTo(scope.bitmapSize.width, yCentre);
			ctx.strokeStyle = this._color;
			ctx.lineWidth = scope.verticalPixelRatio;
			ctx.stroke();
		});
	}
}

class PartialPriceLineView implements ISeriesPrimitivePaneView {
	_renderer: PartialPriceLineRenderer;
	constructor() {
		this._renderer = new PartialPriceLineRenderer();
	}

	renderer(): ISeriesPrimitivePaneRenderer {
		return this._renderer;
	}

	update(priceY: number | null, color: string, x: number | null) {
		this._renderer.update(priceY, color, x);
	}
}

export class PartialPriceLine implements ISeriesPrimitive<Time> {
	_paneViews: PartialPriceLineView[];
	_chart: IChartApi | null = null;
	_series: ISeriesApi<SeriesType> | null = null;

	constructor() {
		this._paneViews = [new PartialPriceLineView()];
	}

	attached({ chart, series } : SeriesAttachedParameter<Time>) {
		this._chart = chart;
		this._series = series;
		this._series.applyOptions({
			priceLineVisible: false,
		});
	}
	detached() {
		this._chart = null;
		this._series = null;
	}

	updateAllViews() {
		if (!this._series || !this._chart) return;
		const seriesOptions = this._series.options();
		let color =
			seriesOptions.priceLineColor ||
			(seriesOptions as LineStyleOptions).color ||
			'#000000';
		const lastValue = this._series.dataByIndex(
			100000,
			MismatchDirection.NearestLeft
		);
		let price: number | null = null;
		let x: number | null = null;
		if (lastValue) {
			if ((lastValue as BarData).color !== undefined) {
				color = (lastValue as BarData).color!;
			}
			price = getValue(lastValue);
			x = this._chart.timeScale().timeToCoordinate(lastValue.time);
		}
		const priceY =
			price !== null ? (this._series.priceToCoordinate(price) as number) : null;
		this._paneViews.forEach(pw => pw.update(priceY, color, x));
	}
	paneViews() {
		return this._paneViews;
	}
}

function getValue(data: LineData | BarData | WhitespaceData): number | null {
	if ((data as LineData).value !== undefined) return (data as LineData).value;
	if ((data as BarData).close !== undefined) return (data as BarData).close;
	return null;
}
