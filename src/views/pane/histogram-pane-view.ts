import { ensureNotNull } from '../../helpers/assertions';

import { BarPrice } from '../../model/bar';
import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { PriceScale } from '../../model/price-scale';
import { Series } from '../../model/series';
import { Bar, SeriesPlotIndex } from '../../model/series-data';
import { TimedValue, TimePointIndex, visibleTimedValues } from '../../model/time-data';
import { TimeScale } from '../../model/time-scale';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { HistogramItem, PaneRendererHistogram, PaneRendererHistogramData } from '../../renderers/histogram-renderer';
import { IPaneRenderer } from '../../renderers/ipane-renderer';

import { SeriesPaneViewBase } from './series-pane-view-base';

function createEmptyHistogramData(barSpacing: number, lineWidth: number, color: string): PaneRendererHistogramData {
	return {
		items: [],
		barSpacing,
		lineWidth,
		histogramBase: NaN,
		color,
		visibleRange: null,
	};
}

function createRawItem(time: TimePointIndex, price: BarPrice): HistogramItem {
	return {
		time: time,
		price: price,
		x: NaN as Coordinate,
		y: NaN as Coordinate,
	};
}

const showSpacingMinimalBarWidth = 5;

export class SeriesHistogramPaneView extends SeriesPaneViewBase<'Histogram', TimedValue> {
	private _compositeRenderer: CompositeRenderer = new CompositeRenderer();
	private _paletteData: PaneRendererHistogramData[] = [];
	private _paletteRenderers: PaneRendererHistogram[] = [];
	private _colorIndexes: Int32Array = new Int32Array(0);
	private _sourceIndexes: Int32Array = new Int32Array(0);

	public constructor(series: Series<'Histogram'>, model: ChartModel) {
		super(series, model, false);
	}

	public renderer(height: number, width: number): IPaneRenderer {
		this._makeValid();
		return this._compositeRenderer;
	}

	protected _fillRawPoints(): void {
		const barSpacing = this._model.timeScale().barSpacing();
		const palette = this._series.palette();
		// resize arrays
		this._paletteRenderers.length = palette.size();
		this._paletteData.length = palette.size();

		const targetIndexes = new Int32Array(palette.size());
		const histogramStyleProps = this._series.options();

		const barValueGetter = this._series.barFunction();
		this._colorIndexes = new Int32Array(this._series.bars().size());
		let targetColorIndex = 0;

		this._items.length = this._series.bars().size();
		let itemIndex = 0;

		this._series.bars().each((index: TimePointIndex, bar: Bar) => {
			const value = barValueGetter(bar.value);
			const colorIndex = bar.value[SeriesPlotIndex.Color] as number;
			const item = createRawItem(index, value);
			const color = palette.colorByIndex(colorIndex);
			const data = this._paletteData[colorIndex] || createEmptyHistogramData(barSpacing, histogramStyleProps.lineWidth, color);
			const targetIndex = targetIndexes[colorIndex]++;
			if (targetIndex < data.items.length) {
				data.items[targetIndex] = item;
			} else {
				data.items.push(item);
			}
			this._items[itemIndex++] = { time: index, x: 0 as Coordinate };
			this._paletteData[colorIndex] = data;
			this._colorIndexes[targetColorIndex++] = colorIndex;
			return false;
		});

		// update renderers
		this._paletteRenderers.length = this._paletteData.length;
		if (this._sourceIndexes.length !== this._paletteData.length) {
			this._sourceIndexes = new Int32Array(this._paletteData.length);
		}
		this._paletteData.forEach((element: PaneRendererHistogramData, index: number) => {
			element.items.length = targetIndexes[index];
			const renderer = this._paletteRenderers[index] || new PaneRendererHistogram();
			renderer.setData(element);
			this._paletteRenderers[index] = renderer;
		});
		this._compositeRenderer.setRenderers(this._paletteRenderers);
	}

	protected _convertToCoordinates(priceScale: PriceScale, timeScale: TimeScale, firstValue: number): void {
		if (this._itemsVisibleRange === null) {
			return;
		}

		const barSpacing = timeScale.barSpacing();
		const visibleBars = ensureNotNull(timeScale.visibleBars());
		const histogramBase = priceScale.priceToCoordinate(this._series.options().base, firstValue);

		this._paletteData.forEach((data: PaneRendererHistogramData, colorIndex: number) => {
			timeScale.indexesToCoordinates(data.items);
			priceScale.pointsArrayToCoordinates(data.items, firstValue);
			data.histogramBase = histogramBase;
			data.visibleRange = visibleTimedValues(data.items, visibleBars, false);
			this._sourceIndexes[colorIndex] = data.visibleRange.from;
		});

		// now calculate left and right

		let prevItem: HistogramItem | null = null;
		for (let i = this._itemsVisibleRange.from; i < this._itemsVisibleRange.to; ++i) {
			const colorIndex = this._colorIndexes[i];
			const data = this._paletteData[colorIndex];
			const sourceIndex = this._sourceIndexes[colorIndex]++;
			const item = data.items[sourceIndex];
			item.left = Math.floor(item.x - barSpacing * 0.5) as Coordinate;
			item.right = Math.ceil(item.left + barSpacing) as Coordinate;
			if (prevItem !== null) {
				const itemsSpacing = item.right - item.left > showSpacingMinimalBarWidth ? 1 : 0;
				prevItem.right = (item.left - itemsSpacing) as Coordinate;
			}
			prevItem = item;
		}
	}
}
