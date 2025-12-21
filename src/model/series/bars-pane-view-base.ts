import { undefinedIfNull } from '../../helpers/strict-type-checks';

import { BarPrice } from '../bar';
import { IChartModelBase } from '../chart-model';
import { Coordinate } from '../coordinate';
import { ISeries } from '../iseries';
import { PlotRowValueIndex } from '../plot-data';
import { PriceScale } from '../price-scale';
import { ISeriesBarColorer } from '../series-bar-colorer';
import { SeriesPlotRow } from '../series-data';
import { TimePointIndex } from '../time-data';
import { ITimeScale } from '../time-scale';
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

	/**
	 * OPTIMIZATION: Incremental update for last bar only.
	 * This avoids recreating the entire items array for tick updates.
	 */
	protected override _updateLastPoint(): boolean {
		const rows = this._series.conflatedBars().rows();
		if (rows.length === 0) {
			return false;
		}

		const colorer = this._series.barColorer();
		const lastRow = rows[rows.length - 1];

		if (this._items.length === rows.length) {
			// Update existing last item in-place
			const lastIndex = this._items.length - 1;
			const existingItem = this._items[lastIndex];

			// Only update if it's the same time point
			if (existingItem.time === lastRow.index) {
				// Update OHLC values in-place
				existingItem.open = lastRow.value[PlotRowValueIndex.Open] as BarPrice;
				existingItem.high = lastRow.value[PlotRowValueIndex.High] as BarPrice;
				existingItem.low = lastRow.value[PlotRowValueIndex.Low] as BarPrice;
				existingItem.close = lastRow.value[PlotRowValueIndex.Close] as BarPrice;
				// Coordinates will be recalculated in _convertToCoordinates

				// Update colors
				const style = colorer.barStyle(lastRow.index);
				Object.assign(existingItem, style);

				return true;
			}
		} else if (this._items.length === rows.length - 1) {
			// Append new item (new bar added)
			const newItem = this._createRawItem(lastRow.index, lastRow, colorer);
			this._items.push(newItem);
			return true;
		}

		return false;
	}
}
