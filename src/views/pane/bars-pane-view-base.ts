import { undefinedIfNull } from '../../helpers/strict-type-checks';

import { BarPrice } from '../../model/bar';
import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { PriceScale } from '../../model/price-scale';
import { Series } from '../../model/series';
import { SeriesBarColorer } from '../../model/series-bar-colorer';
import { Bar, SeriesPlotIndex } from '../../model/series-data';
import { TimePointIndex } from '../../model/time-data';
import { TimeScale } from '../../model/time-scale';
import { BarCandlestickItemBase } from '../../renderers/bars-renderer';

import { SeriesPaneViewBase } from './series-pane-view-base';

export abstract class BarsPaneViewBase<TSeriesType extends 'Bar' | 'Candlestick', ItemType extends BarCandlestickItemBase> extends SeriesPaneViewBase<TSeriesType, ItemType> {
	public constructor(series: Series<TSeriesType>, model: ChartModel) {
		super(series, model, false);
	}

	protected _convertToCoordinates(priceScale: PriceScale, timeScale: TimeScale, firstValue: number): void {
		timeScale.indexesToCoordinates(this._items, undefinedIfNull(this._itemsVisibleRange));
		priceScale.barPricesToCoordinates(this._items, firstValue, undefinedIfNull(this._itemsVisibleRange));
	}

	protected abstract _createRawItem(time: TimePointIndex, bar: Bar, colorer: SeriesBarColorer): ItemType;

	protected _createDefaultItem(time: TimePointIndex, bar: Bar, colorer: SeriesBarColorer): BarCandlestickItemBase {
		return {
			time: time,
			open: bar.value[SeriesPlotIndex.Open] as BarPrice,
			high: bar.value[SeriesPlotIndex.High] as BarPrice,
			low: bar.value[SeriesPlotIndex.Low] as BarPrice,
			close: bar.value[SeriesPlotIndex.Close] as BarPrice,
			x: NaN as Coordinate,
			openY: NaN as Coordinate,
			highY: NaN as Coordinate,
			lowY: NaN as Coordinate,
			closeY: NaN as Coordinate,
		};
	}

	protected _fillRawPoints(): void {
		const newItems: ItemType[] = [];
		const colorer = this._series.barColorer();

		this._series.bars().each((index: TimePointIndex, bar: Bar) => {
			const item = this._createRawItem(index, bar, colorer);
			newItems.push(item);
			return false;
		});

		this._items = newItems;
	}

}
