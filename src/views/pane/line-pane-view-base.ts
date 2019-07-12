import { undefinedIfNull } from '../../helpers/strict-type-checks';

import { BarPrice } from '../../model/bar';
import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { PricedValue, PriceScale } from '../../model/price-scale';
import { Series } from '../../model/series';
import { SeriesBarColorer } from '../../model/series-bar-colorer';
import { Bar } from '../../model/series-data';
import { TimedValue, TimePointIndex } from '../../model/time-data';
import { TimeScale } from '../../model/time-scale';

import { SeriesPaneViewBase } from './series-pane-view-base';

export abstract class LinePaneViewBase<TSeriesType extends 'Line' | 'Area', ItemType extends PricedValue & TimedValue> extends SeriesPaneViewBase<TSeriesType, ItemType> {
	protected constructor(series: Series<TSeriesType>, model: ChartModel) {
		super(series, model, true);
	}

	protected _convertToCoordinates(priceScale: PriceScale, timeScale: TimeScale, firstValue: number): void {
		timeScale.indexesToCoordinates(this._items, undefinedIfNull(this._itemsVisibleRange));
		priceScale.pointsArrayToCoordinates(this._items, firstValue, undefinedIfNull(this._itemsVisibleRange));
	}

	protected abstract _createRawItem(time: TimePointIndex, price: BarPrice, colorer: SeriesBarColorer): ItemType;

	protected _createRawItemBase(time: TimePointIndex, price: BarPrice): PricedValue & TimedValue {
		return {
			time: time,
			price: price,
			x: NaN as Coordinate,
			y: NaN as Coordinate,
		};
	}

	protected _fillRawPoints(): void {
		const barValueGetter = this._series.barFunction();
		const newItems: ItemType[] = [];
		const colorer = this._series.barColorer();
		this._series.bars().each((index: TimePointIndex, bar: Bar) => {
			const value = barValueGetter(bar.value);
			const item = this._createRawItem(index, value, colorer);
			newItems.push(item);
			return false;
		});
		this._items = newItems;
	}
}
