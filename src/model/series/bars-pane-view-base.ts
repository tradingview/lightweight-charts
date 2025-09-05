import { undefinedIfNull } from '../../helpers/strict-type-checks';

import { BarPrice } from '../../model/bar';
import { IChartModelBase } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { ISeries } from '../../model/iseries';
import { PlotRowValueIndex } from '../../model/plot-data';
import { PriceScale } from '../../model/price-scale';
import { ISeriesBarColorer } from '../../model/series-bar-colorer';
import { SeriesPlotRow } from '../../model/series-data';
import { TimePointIndex } from '../../model/time-data';
import { ITimeScale } from '../../model/time-scale';
import { BarCandlestickItemBase } from '../../renderers/bars-renderer';
import { IPaneRenderer } from '../../renderers/ipane-renderer';

import { SeriesPaneViewBase } from './series-pane-view-base';

export abstract class BarsPaneViewBase<TSeriesType extends 'Bar' | 'Candlestick', ItemType extends BarCandlestickItemBase, TRenderer extends IPaneRenderer> extends SeriesPaneViewBase<TSeriesType, ItemType, TRenderer> {
	public constructor(series: ISeries<TSeriesType>, model: IChartModelBase) {
		super(series, model, false);
	}

	protected _convertToCoordinates(priceScale: PriceScale, timeScale: ITimeScale, firstValue: number): void {
		timeScale.indexesToCoordinates(this._items, undefinedIfNull(this._itemsVisibleRange));
		priceScale.barPricesToCoordinates(this._items, firstValue, undefinedIfNull(this._itemsVisibleRange));
	}

	protected abstract _createRawItem(time: TimePointIndex, bar: SeriesPlotRow<TSeriesType>, colorer: ISeriesBarColorer<TSeriesType>): ItemType;

	protected _createDefaultItem(time: TimePointIndex, bar: SeriesPlotRow<TSeriesType>, colorer: ISeriesBarColorer<TSeriesType>): BarCandlestickItemBase {
		return {
			time: time,
			open: bar.value[PlotRowValueIndex.Open] as BarPrice,
			high: bar.value[PlotRowValueIndex.High] as BarPrice,
			low: bar.value[PlotRowValueIndex.Low] as BarPrice,
			close: bar.value[PlotRowValueIndex.Close] as BarPrice,
			x: NaN as Coordinate,
			openY: NaN as Coordinate,
			highY: NaN as Coordinate,
			lowY: NaN as Coordinate,
			closeY: NaN as Coordinate,
		};
	}

	protected _fillRawPoints(): void {
		const colorer = this._series.barColorer();

		this._items = this._series.conflatedBars().rows().map((row: SeriesPlotRow<TSeriesType>) => this._createRawItem(row.index, row, colorer));
	}
}
