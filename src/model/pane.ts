import { assert, ensureNotNull } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { IDestroyable } from '../helpers/idestroyable';
import { ISubscription } from '../helpers/isubscription';
import { clone } from '../helpers/strict-type-checks';

import { ChartModel } from './chart-model';
import { IDataSource } from './idata-source';
import { IPriceDataSource } from './iprice-data-source';
import { PriceDataSource } from './price-data-source';
import { PriceScale, PriceScaleMode, PriceScaleState } from './price-scale';
import { Series } from './series';
import { sortSources } from './sort-sources';
import { TimeScale } from './time-scale';

export const DEFAULT_STRETCH_FACTOR = 1000;

export type PriceScalePosition = 'left' | 'right' | 'overlay';

export type PreferredPriceScalePosition = 'left' | 'right' | 'overlay';

interface MinMaxOrderInfo {
	minZOrder: number;
	maxZOrder: number;
}

export class Pane implements IDestroyable {
	private readonly _timeScale: TimeScale;
	private readonly _model: ChartModel;

	private readonly _defaultNonOverlayPriceScale: PriceScale;
	private _dataSources: IDataSource[] = [];
	private _overlaySources: IDataSource[] = [];

	private _height: number = 0;
	private _width: number = 0;
	private _stretchFactor: number = DEFAULT_STRETCH_FACTOR;
	private _mainDataSource: IPriceDataSource | null = null;
	private _cachedOrderedSources: ReadonlyArray<IDataSource> | null = null;

	private _destroyed: Delegate = new Delegate();

	public constructor(timeScale: TimeScale, model: ChartModel) {
		this._timeScale = timeScale;
		this._model = model;

		this.model().mainPriceScaleOptionsChanged().subscribe(this.onPriceScaleOptionsChanged.bind(this), this);
		this._defaultNonOverlayPriceScale = this._createPriceScale();
	}

	public onPriceScaleOptionsChanged(): void {
		this._defaultNonOverlayPriceScale.applyOptions(this._model.options().priceScale);
	}

	public destroy(): void {
		this.model().mainPriceScaleOptionsChanged().unsubscribeAll(this);

		this._defaultNonOverlayPriceScale.modeChanged().unsubscribeAll(this);

		this._dataSources.forEach((source: IDataSource) => {
			if (source.destroy) {
				source.destroy();
			}
		});
		this._destroyed.fire();
	}

	public stretchFactor(): number {
		return this._stretchFactor;
	}

	public setStretchFactor(factor: number): void {
		this._stretchFactor = factor;
	}

	public model(): ChartModel {
		return this._model;
	}

	public width(): number {
		return this._width;
	}

	public height(): number {
		return this._height;
	}

	public setWidth(width: number): void {
		this._width = width;
		this.updateAllViews();
	}

	public setHeight(height: number): void {
		this._height = height;
		this._defaultNonOverlayPriceScale.setHeight(height);

		// process overlays
		this._dataSources.forEach((ds: IDataSource) => {
			if (this.isOverlay(ds)) {
				const priceScale = ds.priceScale();
				if (priceScale !== null) {
					priceScale.setHeight(height);
				}
			}
		});

		this.updateAllViews();
	}

	public dataSources(): ReadonlyArray<IDataSource> {
		return this._dataSources;
	}

	public isOverlay(source: IDataSource): boolean {
		const priceScale = source.priceScale();
		if (priceScale === null) {
			return true;
		}
		return this._defaultNonOverlayPriceScale !== priceScale;
	}

	public addDataSource(source: IDataSource, overlay: boolean, keepZorder: boolean): void {
		const zOrder = this._getZOrderMinMax().minZOrder - 1;
		this._insertDataSource(source, overlay, zOrder);
	}

	public removeDataSource(source: IDataSource): void {
		const index = this._dataSources.indexOf(source);
		assert(index !== -1, 'removeDataSource: invalid data source');

		this._dataSources.splice(index, 1);
		if (source === this._mainDataSource) {
			this._mainDataSource = null;
		}

		const overlayIndex = this._overlaySources.indexOf(source);
		if (overlayIndex !== -1) {
			this._overlaySources.splice(overlayIndex, 1);
		}

		const priceScale = source.priceScale();
		// if source has owner, it returns owner's price scale
		// and it does not have source in their list
		if (priceScale && priceScale.dataSources().indexOf(source) >= 0) {
			priceScale.removeDataSource(source);
		}

		if (priceScale && priceScale.mainSource() === null) {
			const dataSourceCount = priceScale.dataSources().length;
			assert(dataSourceCount === 0, 'Invalid priceScale state: empty mainSource but non-empty data sources=' + dataSourceCount);

			if (priceScale !== this._defaultNonOverlayPriceScale) {
				priceScale.modeChanged().unsubscribeAll(this);
			}
		}

		if (source instanceof PriceDataSource) {
			this._processMainSourceChange();
		}

		if (priceScale && source instanceof PriceDataSource) {
			priceScale.invalidateSourcesCache();
			this.recalculatePriceScale(priceScale);
		}

		this._cachedOrderedSources = null;
	}

	public priceScalePosition(): PriceScalePosition {
		const position = this._model.options().priceScale.position;
		return position === 'none' ? 'overlay' : position;
	}

	public startScalePrice(priceScale: PriceScale, x: number): void {
		priceScale.startScale(x);
	}

	public scalePriceTo(priceScale: PriceScale, x: number): void {
		priceScale.scaleTo(x);

		// TODO: be more smart and update only affected views
		this.updateAllViews();
	}

	public endScalePrice(priceScale: PriceScale): void {
		priceScale.endScale();
	}

	public startScrollPrice(priceScale: PriceScale, x: number): void {
		priceScale.startScroll(x);
	}

	public scrollPriceTo(priceScale: PriceScale, x: number): void {
		priceScale.scrollTo(x);
		this.updateAllViews();
	}

	public endScrollPrice(priceScale: PriceScale): void {
		priceScale.endScroll();
	}

	public setPriceAutoScale(priceScale: PriceScale, autoScale: boolean): void {
		priceScale.setMode({
			autoScale: autoScale,
		});

		if (this._timeScale.isEmpty()) {
			priceScale.setPriceRange(null);
			return;
		}

		this.recalculatePriceScale(priceScale);
	}

	public updateAllViews(): void {
		this._dataSources.forEach((source: IDataSource) => {
			source.updateAllViews();
		});
	}

	public defaultPriceScale(): PriceScale {
		const mainDataSource = this.mainDataSource();
		let res = mainDataSource !== null ? mainDataSource.priceScale() : null;

		// Every Pane MUST have a price scale! This is mostly a fix of broken charts with empty panes...
		if (res === null) {
			res = this._defaultNonOverlayPriceScale;
		}

		return res;
	}

	public mainDataSource(): IPriceDataSource | null {
		return this._mainDataSource;
	}

	public recalculatePriceScale(priceScale: PriceScale | null): void {
		if (priceScale === null || !priceScale.isAutoScale()) {
			return;
		}

		this._recalculatePriceScaleImpl(priceScale);
	}

	public resetPriceScale(priceScale: PriceScale): void {
		const visibleBars = this._timeScale.visibleBars();
		priceScale.setMode({ autoScale: true });
		if (visibleBars !== null) {
			priceScale.recalculatePriceRange(visibleBars);
		}
		this.updateAllViews();
	}

	public momentaryAutoScale(): void {
		this._recalculatePriceScaleImpl(this._defaultNonOverlayPriceScale);
	}

	public recalculate(): void {
		this.recalculatePriceScale(this._defaultNonOverlayPriceScale);

		this._dataSources.forEach((ds: IDataSource) => {
			if (this.isOverlay(ds)) {
				this.recalculatePriceScale(ds.priceScale());
			}
		});

		this.updateAllViews();
		this._model.lightUpdate();
	}

	public isEmpty(): boolean {
		return this._mainDataSource === null;
	}

	public containsSeries(): boolean {
		return this._dataSources.some((ds: IDataSource) => ds instanceof Series);
	}

	public orderedSources(): ReadonlyArray<IDataSource> {
		if (this._cachedOrderedSources === null) {
			this._cachedOrderedSources = sortSources(this._dataSources);
		}

		return this._cachedOrderedSources;
	}

	public onDestroyed(): ISubscription {
		return this._destroyed;
	}

	private _findSuitableScale(source: IPriceDataSource, preferredScale: PreferredPriceScalePosition): PriceScale {
		if (preferredScale !== 'overlay') {
			return this._defaultNonOverlayPriceScale;
		}

		return this._createPriceScale(true);
	}

	private _recalculatePriceScaleImpl(priceScale: PriceScale): void {
		// TODO: can use this checks
		const sourceForAutoScale = priceScale.sourcesForAutoScale();

		if (sourceForAutoScale && sourceForAutoScale.length > 0 && !this._timeScale.isEmpty()) {
			const visibleBars = this._timeScale.visibleBars();
			if (visibleBars !== null) {
				priceScale.recalculatePriceRange(visibleBars);
			}
		}

		priceScale.updateAllViews();
	}

	private _getZOrderMinMax(): MinMaxOrderInfo {
		const sources = this.orderedSources();
		if (sources.length === 0) {
			return { minZOrder: 0, maxZOrder: 0 };
		}

		let minZOrder = 0;
		let maxZOrder = 0;
		for (let j = 0; j < sources.length; j++) {
			const ds = sources[j];
			const zOrder = ds.zorder();
			if (zOrder !== null) {
				if (zOrder < minZOrder) {
					minZOrder = zOrder;
				}

				if (zOrder > maxZOrder) {
					maxZOrder = zOrder;
				}
			}
		}

		return { minZOrder: minZOrder, maxZOrder: maxZOrder };
	}

	private _insertDataSource(source: IDataSource, overlay: boolean, zOrder: number): void {
		let priceScalePosition: PreferredPriceScalePosition = 'overlay';
		let priceScale: PriceScale | null = null;
		if (!overlay) {
			const optionsPosition = this.model().options().priceScale.position;
			priceScalePosition = optionsPosition === 'none' ? 'overlay' : optionsPosition;
		}

		if (source instanceof PriceDataSource) {
			priceScale = this._findSuitableScale(source, priceScalePosition);
		}

		this._dataSources.push(source);
		if (overlay) {
			this._overlaySources.push(source);
		}

		if (priceScale !== null) {
			priceScale.addDataSource(source);
			source.setPriceScale(priceScale);
		}

		source.setZorder(zOrder);
		this._processMainSourceChange();

		if (source instanceof PriceDataSource) {
			this.recalculatePriceScale(priceScale);
		}

		this._cachedOrderedSources = null;
	}

	private _onPriceScaleModeChanged(priceScale: PriceScale, oldMode: PriceScaleState, newMode: PriceScaleState): void {
		if (oldMode.mode === newMode.mode) {
			return;
		}

		// momentary auto scale if we toggle percentage/indexedTo100 mode
		this._recalculatePriceScaleImpl(priceScale);
	}

	private _processMainSourceChange(): void {
		if (this._mainDataSource === null || this._overlaySources.indexOf(this._mainDataSource) !== -1) {
			// first check non-overlay sources
			for (const source of this._dataSources) {
				if (source instanceof PriceDataSource && !this.isOverlay(source)) {
					this._setMainSource(source);
					return;
				}
			}
			// then check overlay sources
			for (const source of this._overlaySources) {
				if (source instanceof PriceDataSource) {
					this._setMainSource(source);
					return;
				}
			}
		}
	}

	private _setMainSource(source: IPriceDataSource): void {
		const priceScale = ensureNotNull(source.priceScale());
		this.defaultPriceScale().modeChanged().unsubscribeAll(this);
		priceScale.modeChanged().subscribe(this._onPriceScaleModeChanged.bind(this, priceScale), this);
		this._mainDataSource = source;
	}

	private _createPriceScale(overlay?: boolean): PriceScale {
		const priceScaleOptions = clone(this._model.options().priceScale);

		if (overlay) {
			// overlay scales should be normal with auto scale enabled
			priceScaleOptions.autoScale = true;
			priceScaleOptions.mode = PriceScaleMode.Normal;
		}

		const priceScale = new PriceScale(
			priceScaleOptions,
			this._model.options().layout,
			this._model.options().localization
		);
		priceScale.setHeight(this.height());
		return priceScale;
	}
}
