import { ChartModel } from '../../model/chart-model';
import { PriceScale } from '../../model/price-scale';
import { Series } from '../../model/series';
import { SeriesType } from '../../model/series-options';
import { SeriesItemsIndexesRange, TimedValue, visibleTimedValues } from '../../model/time-data';
import { TimeScale } from '../../model/time-scale';
import { IPaneRenderer } from '../../renderers/ipane-renderer';

import { IUpdatablePaneView, UpdateType } from './iupdatable-pane-view';

export abstract class SeriesPaneViewBase<TSeriesType extends SeriesType, ItemType extends TimedValue> implements IUpdatablePaneView {
	protected readonly _series: Series<TSeriesType>;
	protected readonly _model: ChartModel;
	protected _invalidated: boolean = true;
	protected _dataInvalidated: boolean = true;
	protected _items: ItemType[] = [];
	protected _itemsVisibleRange: SeriesItemsIndexesRange | null = null;
	private readonly _extendedVisibleRange: boolean;

	public constructor(series: Series<TSeriesType>, model: ChartModel, extendedVisibleRange: boolean) {
		this._series = series;
		this._model = model;
		this._extendedVisibleRange = extendedVisibleRange;
	}

	public update(updateType?: UpdateType): void {
		this._invalidated = true;
		if (updateType === 'data') {
			this._dataInvalidated = true;
		}
	}

	public abstract renderer(height: number, width: number): IPaneRenderer;

	protected _makeValid(): void {
		if (this._dataInvalidated) {
			this._fillRawPoints();
			this._dataInvalidated = false;
		}

		if (this._invalidated) {
			this._updatePoints();
			this._invalidated = false;
		}
	}

	protected abstract _fillRawPoints(): void;

	protected abstract _convertToCoordinates(priceScale: PriceScale, timeScale: TimeScale, firstValue: number): void;

	protected _clearVisibleRange(): void {
		this._itemsVisibleRange = null;
	}

	protected _updatePoints(): void {
		const priceScale = this._series.priceScale();
		const timeScale = this._model.timeScale();

		this._clearVisibleRange();

		if (timeScale.isEmpty() || priceScale.isEmpty()) {
			return;
		}

		const visibleBars = timeScale.visibleStrictRange();
		if (visibleBars === null) {
			return;
		}

		if (this._series.data().bars().size() === 0) {
			return;
		}

		const firstValue = this._series.firstValue();
		if (firstValue === null) {
			return;
		}

		this._itemsVisibleRange = visibleTimedValues(this._items, visibleBars, this._extendedVisibleRange);
		this._convertToCoordinates(priceScale, timeScale, firstValue.value);
	}
}
