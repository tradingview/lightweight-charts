import { undefinedIfNull } from '../../helpers/strict-type-checks';

import { BarPrice } from '../../model/bar';
import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { PlotRowValueIndex } from '../../model/plot-data';
import { CloudPricedValue, PriceScale } from '../../model/price-scale';
import { Series } from '../../model/series';
import { SeriesBarColorer } from '../../model/series-bar-colorer';
import { SeriesPlotRow } from '../../model/series-data';
import { TimedValue, TimePointIndex } from '../../model/time-data';
import { TimeScale } from '../../model/time-scale';

import { SeriesPaneViewBase } from './series-pane-view-base';

export abstract class CloudAreaPaneViewBase<TSeriesType extends 'CloudArea', ItemType extends TimedValue & CloudPricedValue> extends SeriesPaneViewBase<TSeriesType, ItemType> {
	protected constructor(series: Series<TSeriesType>, model: ChartModel) {
		super(series, model, true);
	}

	protected _convertToCoordinates(priceScale: PriceScale, timeScale: TimeScale, firstValue: number): void {
		timeScale.indexesToCoordinates(this._items, undefinedIfNull(this._itemsVisibleRange));
		priceScale.cloudPointsArrayToCoordinates(this._items, firstValue, undefinedIfNull(this._itemsVisibleRange));
	}

	protected abstract _createRawItem(time: TimePointIndex, price: BarPrice, price2: BarPrice, colorer: SeriesBarColorer): ItemType;

	protected _createRawItemBase(time: TimePointIndex, higherPrice: BarPrice, lowerPrice: BarPrice): TimedValue & CloudPricedValue {
		return {
			time: time,
			higherPrice: higherPrice,
			lowerPrice: lowerPrice,
			x: NaN as Coordinate,
			higherY: NaN as Coordinate,
			lowerY: NaN as Coordinate,
		};
	}

	protected _fillRawPoints(): void {
		const colorer = this._series.barColorer();
		this._items = this._series.bars().rows().map((row: SeriesPlotRow<TSeriesType>) => {
			const higherValue = row.value[PlotRowValueIndex.High] as BarPrice;
			const lowerValue = row.value[PlotRowValueIndex.Low] as BarPrice;
			return this._createRawItem(row.index, higherValue, lowerValue, colorer);
		});
	}
}
