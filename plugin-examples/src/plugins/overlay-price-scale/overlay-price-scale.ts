import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
	BarPrice,
	Coordinate,
	IChartApi,
	IPriceFormatter,
	ISeriesApi,
	ISeriesPrimitive,
	ISeriesPrimitivePaneRenderer,
	ISeriesPrimitivePaneView,
	SeriesAttachedParameter,
	SeriesType,
	Time,
} from 'lightweight-charts';

/*
	TODO: This is just a simple price scale which
	doesn't consider the actual minTick amount for
	series, and doesn't position the labels dynamically
	to line up to 'rounded' values.
*/

interface RendererData {
	priceFormatter: IPriceFormatter;
	coordinateToPrice: (coordinate: number) => BarPrice | null;
	priceToCoordinate: (price: number) => Coordinate | null;
	options: OverlayPriceScaleOptions;
}

interface Label {
	label: string;
	y: number;
}

const tickSpacing = 40;
const horizontalPadding = 3;
const verticalPadding = 2;
const sideMargin = 10;
const fontSize = 12;
const radius = 4;

class OverlayPriceScaleRenderer implements ISeriesPrimitivePaneRenderer {
	_data: RendererData | null = null;
	update(data: RendererData) {
		this._data = data;
	}

	draw(target: CanvasRenderingTarget2D) {
		target.useMediaCoordinateSpace(scope => {
			if (!this._data) return;
			const labels = this._calculatePriceScale(
				scope.mediaSize.height,
				this._data
			);
			const maxLabelLength = labels.reduce((answer: number, label: Label) => {
				return Math.max(answer, label.label.length);
			}, 0);
			const testLabelForWidth = ''.padEnd(maxLabelLength, '0');
			const ctx = scope.context;
			const isLeft = this._data.options.side === 'left';
			ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'top';
			const testDimensions = ctx.measureText(testLabelForWidth);
			const width = testDimensions.width;
			const x = isLeft
				? sideMargin
				: scope.mediaSize.width - sideMargin - width;
			const textX = x + horizontalPadding + Math.round(width / 2);
			labels.forEach(label => {
				ctx.beginPath();
				const topY = label.y - fontSize / 2;
				ctx.roundRect(
					x,
					topY,
					width + horizontalPadding * 2,
					fontSize + 2 * verticalPadding,
					radius
				);
				ctx.fillStyle = this._data!.options.backgroundColor;
				ctx.fill();
				ctx.beginPath();
				ctx.fillStyle = this._data!.options.textColor;
				ctx.fillText(label.label, textX, topY + verticalPadding, width);
			});
		});
	}

	_calculatePriceScale(height: number, data: RendererData) {
		const yPositions: number[] = [];
		const halfTick = Math.round(tickSpacing / 4);
		let pos = halfTick;
		while (pos <= height - halfTick) {
			yPositions.push(pos);
			pos += tickSpacing;
		}
		const labels = yPositions
			.map(y => {
				const price = data.coordinateToPrice(y);
				if (price === null) return null;
				const priceLabel = data.priceFormatter.format(price);
				return {
					label: priceLabel,
					y: y,
				};
			})
			.filter((item: Label | null): item is Label => Boolean(item));
		return labels;
	}
}

class OverlayPriceScaleView implements ISeriesPrimitivePaneView {
	_renderer: OverlayPriceScaleRenderer;
	constructor() {
		this._renderer = new OverlayPriceScaleRenderer();
	}

	renderer(): ISeriesPrimitivePaneRenderer {
		return this._renderer;
	}

	update(data: RendererData) {
		this._renderer.update(data);
	}
}

export interface OverlayPriceScaleOptions {
	textColor: string;
	backgroundColor: string;
	side: 'left' | 'right';
}

const defaultOptions: OverlayPriceScaleOptions = {
	textColor: 'rgb(0, 0, 0)',
	backgroundColor: 'rgba(255, 255, 255, 0.6)',
	side: 'left',
} as const;

export class OverlayPriceScale implements ISeriesPrimitive<Time> {
	_paneViews: OverlayPriceScaleView[];
	_chart: IChartApi | null = null;
	_series: ISeriesApi<SeriesType> | null = null;
	_requestUpdate?: () => void;
	_options: OverlayPriceScaleOptions;

	constructor(options: Partial<OverlayPriceScaleOptions>) {
		this._options = {
			...defaultOptions,
			...options,
		};
		this._paneViews = [new OverlayPriceScaleView()];
	}

	applyOptions(options: Partial<OverlayPriceScaleOptions>) {
		this._options = {
			...this._options,
			...options,
		};
		if (this._requestUpdate) this._requestUpdate();
	}

	attached({ chart, series, requestUpdate }: SeriesAttachedParameter<Time>) {
		this._chart = chart;
		this._series = series;
		this._requestUpdate = requestUpdate;
	}

	detached() {
		this._chart = null;
		this._series = null;
	}

	updateAllViews() {
		if (!this._series || !this._chart) return;
		const coordinateToPrice = (coordinate: number): BarPrice | null =>
			this._series!.coordinateToPrice(coordinate);
		const priceToCoordinate = (price: number): Coordinate | null =>
			this._series!.priceToCoordinate(price);
		const priceFormatter = this._series.priceFormatter();
		const options = this._options;
		const data: RendererData = {
			coordinateToPrice,
			priceToCoordinate,
			priceFormatter,
			options,
		};
		this._paneViews.forEach(pw => pw.update(data));
	}
	paneViews() {
		return this._paneViews;
	}
}
