import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { IUpdatablePaneView, UpdateType } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { ISeries } from '../iseries';
import { PriceScale } from '../price-scale';
import { SeriesType } from '../series-options';
import { SeriesItemsIndexesRange, TimedValue, visibleTimedValues } from '../time-data';
import { ITimeScale } from '../time-scale';

export abstract class SeriesPaneViewBase<TSeriesType extends SeriesType, ItemType extends TimedValue, TRenderer extends IPaneRenderer> implements IUpdatablePaneView {
	protected readonly _series: ISeries<TSeriesType>;
	protected readonly _model: IChartModelBase;
	protected _invalidated: boolean = true;
	protected _dataInvalidated: boolean = true;
	protected _optionsInvalidated: boolean = true;
	protected _items: ItemType[] = [];
	protected _itemsVisibleRange: SeriesItemsIndexesRange | null = null;
	protected readonly abstract _renderer: TRenderer;
	private readonly _extendedVisibleRange: boolean;
	private _lastConflationKey: number = -1;
	// OPTIMIZATION: Track data state for incremental updates
	private _lastDataLength: number = 0;
	private _incrementalUpdatePossible: boolean = false;

	public constructor(series: ISeries<TSeriesType>, model: IChartModelBase, extendedVisibleRange: boolean) {
		this._series = series;
		this._model = model;
		this._extendedVisibleRange = extendedVisibleRange;
	}

	public update(updateType?: UpdateType): void {
		this._invalidated = true;
		if (updateType === 'data') {
			this._dataInvalidated = true;
			// OPTIMIZATION: Check if this could be an incremental update (last bar only)
			const currentLength = this._series.bars().size();
			this._incrementalUpdatePossible = currentLength === this._lastDataLength ||
				currentLength === this._lastDataLength + 1;
		}
		if (updateType === 'options') {
			this._optionsInvalidated = true;
		}
	}

	public renderer(): IPaneRenderer | null {
		if (!this._series.visible()) {
			return null;
		}

		this._makeValid();

		return this._itemsVisibleRange === null ? null : this._renderer;
	}

	protected abstract _fillRawPoints(): void;

	/**
	 * OPTIMIZATION: Incremental update for last bar only.
	 * Override in subclasses to provide optimized implementation.
	 * Returns true if incremental update was performed, false if full rebuild is needed.
	 */
	protected _updateLastPoint(): boolean {
		return false; // Default: not supported, do full rebuild
	}

	protected _updateOptions(): void {
		// OPTIMIZATION: For incremental updates, only update the last item
		if (this._incrementalUpdatePossible && this._items.length > 0) {
			const lastIndex = this._items.length - 1;
			const item = this._items[lastIndex];
			this._items[lastIndex] = {
				...item,
				...this._series.barColorer().barStyle(item.time),
			};
			return;
		}

		// Full update path
		this._items = this._items.map((item: ItemType) => ({
			...item,
			...this._series.barColorer().barStyle(item.time),
		}));
	}

	protected abstract _convertToCoordinates(priceScale: PriceScale, timeScale: ITimeScale, firstValue: number): void;

	protected _clearVisibleRange(): void {
		this._itemsVisibleRange = null;
	}

	protected abstract _prepareRendererData(): void;

	private _makeValid(): void {
		// If the conflation setting or factor changed (due to zoom/barSpacing),
		// we must rebuild raw items from series data.
		const timeScale = this._model.timeScale();
		const conflationEnabled = timeScale.options().enableConflation;
		const currentConflationKey = conflationEnabled ? timeScale.conflationFactor() : 0;
		if (currentConflationKey !== this._lastConflationKey) {
			this._dataInvalidated = true;
			this._incrementalUpdatePossible = false; // Force full rebuild on conflation change
			this._lastConflationKey = currentConflationKey;
		}

		if (this._dataInvalidated) {
			// OPTIMIZATION: Try incremental update first for last-bar-only changes
			if (this._incrementalUpdatePossible && this._updateLastPoint()) {
				// Incremental update succeeded
				this._lastDataLength = this._series.bars().size();
			} else {
				// Full rebuild
				this._fillRawPoints();
				this._lastDataLength = this._series.bars().size();
			}
			this._dataInvalidated = false;
			this._incrementalUpdatePossible = false;
		}

		if (this._optionsInvalidated) {
			this._updateOptions();
			this._optionsInvalidated = false;
		}

		if (this._invalidated) {
			this._makeValidImpl();
			this._invalidated = false;
		}
	}

	private _makeValidImpl(): void {
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

		if (this._series.bars().size() === 0) {
			return;
		}

		const firstValue = this._series.firstValue();
		if (firstValue === null) {
			return;
		}

		this._itemsVisibleRange = visibleTimedValues(this._items, visibleBars, this._extendedVisibleRange);
		this._convertToCoordinates(priceScale, timeScale, firstValue.value);

		this._prepareRendererData();
	}
}
