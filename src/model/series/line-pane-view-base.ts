import { undefinedIfNull } from '../../helpers/strict-type-checks';

import { IPaneRenderer } from '../../renderers/ipane-renderer';

import { BarPrice } from '../bar';
import { IChartModelBase } from '../chart-model';
import { Coordinate } from '../coordinate';
import { ISeries } from '../iseries';
import { PlotRowValueIndex } from '../plot-data';
import { PricedValue, PriceScale } from '../price-scale';
import { ISeriesBarColorer } from '../series-bar-colorer';
import { SeriesPlotRow } from '../series-data';
import { TimedValue, TimePointIndex } from '../time-data';
import { ITimeScale } from '../time-scale';
import { SeriesPaneViewBase } from './series-pane-view-base';

export abstract class LinePaneViewBase<
	TSeriesType extends 'Line' | 'Area' | 'Baseline' | 'Histogram',
	ItemType extends PricedValue & TimedValue,
	TRenderer extends IPaneRenderer
> extends SeriesPaneViewBase<TSeriesType, ItemType, TRenderer> {
	public constructor(series: ISeries<TSeriesType>, model: IChartModelBase) {
		super(series, model, true);
	}

	protected _convertToCoordinates(priceScale: PriceScale, timeScale: ITimeScale, firstValue: number): void {
		timeScale.indexesToCoordinates(this._items, undefinedIfNull(this._itemsVisibleRange));
		priceScale.pointsArrayToCoordinates(this._items, firstValue, undefinedIfNull(this._itemsVisibleRange));
	}

	protected abstract _createRawItem(time: TimePointIndex, price: BarPrice, colorer: ISeriesBarColorer<TSeriesType>): ItemType;

	protected _createRawItemBase(time: TimePointIndex, price: BarPrice): PricedValue & TimedValue {
		return {
			time: time,
			price: price,
			x: NaN as Coordinate,
			y: NaN as Coordinate,
		};
	}

	protected _fillRawPoints(): void {
		const colorer = this._series.barColorer();
		this._items = this._series.conflatedBars().rows().map((row: SeriesPlotRow<TSeriesType>) => {
			const isConflated = (row.originalDataCount ?? 1) > 1;
			let value: BarPrice;

			if (isConflated) {
				const high = row.value[PlotRowValueIndex.High];
				const low = row.value[PlotRowValueIndex.Low];
				const close = row.value[PlotRowValueIndex.Close];

				const highMove = Math.abs(high - close);
				const lowMove = Math.abs(low - close);

				// in case of conflation we want to show more extreme price to represent the range
				// and we choose the one which is further from the close price
				value = (highMove > lowMove) ? high as BarPrice : low as BarPrice;
			} else {
				value = row.value[PlotRowValueIndex.Close] as BarPrice;
			}

			return this._createRawItem(row.index, value, colorer);
		});
	}
}
