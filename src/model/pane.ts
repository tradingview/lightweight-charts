import { assert, ensureDefined, ensureNotNull } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { IDestroyable } from '../helpers/idestroyable';
import { ISubscription } from '../helpers/isubscription';
import { clone, DeepPartial, uid } from '../helpers/strict-type-checks';

import { ChartModel, ChartOptions } from './chart-model';
import { IDataSource } from './idata-source';
import { IPriceDataSource } from './iprice-data-source';
import { PriceDataSource } from './price-data-source';
import { PriceScale, PriceScaleOptions, PriceScaleState } from './price-scale';
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

	private _dataSources: IDataSource[] = [];
	private _overlaySourcesByScaleId: Map<string, IDataSource[]> = new Map();

	private _height: number = 0;
	private _width: number = 0;
	private _stretchFactor: number = DEFAULT_STRETCH_FACTOR;
	private _mainDataSource: IPriceDataSource | null = null;
	private _cachedOrderedSources: ReadonlyArray<IDataSource> | null = null;

	private _destroyed: Delegate = new Delegate();

	private _leftPriceScale: PriceScale;
	private _rightPriceScale: PriceScale;

	public constructor(timeScale: TimeScale, model: ChartModel) {
		this._timeScale = timeScale;
		this._model = model;

		const options = model.options();

		this._leftPriceScale = this._createPriceScale('left', options.leftPriceScale);
		this._rightPriceScale = this._createPriceScale('right', options.rightPriceScale);
		this.applyScaleOptions(options);
	}

	public applyScaleOptions(options: DeepPartial<ChartOptions>): void {
		if (options.leftPriceScale) {
			this._leftPriceScale.applyOptions(options.leftPriceScale);
		}
		if (options.rightPriceScale) {
			this._rightPriceScale.applyOptions(options.rightPriceScale);
		}
		if (options.localization) {
			this._leftPriceScale.updateFormatter();
			this._rightPriceScale.updateFormatter();
			// TODO: update formatters for all overlay scales
		}
	}

	public priceScaleById(id: string): PriceScale | null {
		switch (id) {
			case 'left': {
				return this._leftPriceScale;
			}
			case 'right': {
				return this._rightPriceScale;
			}
		}
		if (this._overlaySourcesByScaleId.has(id)) {
			return ensureDefined(this._overlaySourcesByScaleId.get(id))[0].priceScale();
		}
		return null;
	}

	public destroy(): void {
		this.model().priceScalesOptionsChanged().unsubscribeAll(this);
		this._timeScale.barSpacingChanged().unsubscribeAll(this);

		this._leftPriceScale.modeChanged().unsubscribeAll(this);
		this._rightPriceScale.modeChanged().unsubscribeAll(this);

		this._dataSources.forEach((source: IDataSource) => {
			if (source.destroy) {
				source.destroy();
			}
		});
		this._destroyed.fire();
	}

	public generateUniquePriceScaleId(): string {
		while (true) {
			const newId = uid();
			if (!this._overlaySourcesByScaleId.has(newId)) {
				return newId;
			}
		}
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

		this._leftPriceScale.setHeight(height);
		this._rightPriceScale.setHeight(height);

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
		return this._leftPriceScale !== priceScale && this._rightPriceScale !== priceScale;
	}

	public addDataSource(source: IDataSource, targetScaleId: string, keepZorder: boolean): void {
		const zOrder = this._getZOrderMinMax().minZOrder - 1;
		this._insertDataSource(source, targetScaleId, zOrder);
	}

	// tslint:disable-next-line: cyclomatic-complexity
	public removeDataSource(source: IDataSource): void {
		const index = this._dataSources.indexOf(source);
		assert(index !== -1, 'removeDataSource: invalid data source');

		this._dataSources.splice(index, 1);
		if (source === this._mainDataSource) {
			this._mainDataSource = null;
		}

		const priceScaleId = ensureNotNull(source.priceScale()).id();
		if (this._overlaySourcesByScaleId.has(priceScaleId)) {
			const overlaySources = ensureDefined(this._overlaySourcesByScaleId.get(priceScaleId));
			const overlayIndex = overlaySources.indexOf(source);
			if (overlayIndex !== -1) {
				overlaySources.splice(overlayIndex, 1);
				if (overlaySources.length === 0) {
					this._overlaySourcesByScaleId.delete(priceScaleId);
				}
			}
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

			if (priceScale !== this._leftPriceScale && priceScale !== this._rightPriceScale) {
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

	public priceScalePosition(priceScale: PriceScale): PriceScalePosition {
		if (priceScale === this._leftPriceScale) {
			return 'left';
		}
		if (priceScale === this._rightPriceScale) {
			return 'right';
		}

		return 'overlay';
	}

	public leftPriceScale(): PriceScale | null {
		return this._leftPriceScale;
	}

	public rightPriceScale(): PriceScale | null {
		return this._rightPriceScale;
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
			res = this._model.options().rightPriceScale.visible ? this._rightPriceScale : this._leftPriceScale;
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
		this._recalculatePriceScaleImpl(this._leftPriceScale);
		this._recalculatePriceScaleImpl(this._rightPriceScale);
	}

	public recalculate(): void {
		this.recalculatePriceScale(this._leftPriceScale);
		this.recalculatePriceScale(this._rightPriceScale);

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

	private _insertDataSource(source: IDataSource, priceScaleId: string, zOrder: number): void {
		let priceScale: PriceScale | null = null;

		if (source instanceof PriceDataSource) {
			priceScale = this.priceScaleById(priceScaleId);
		}

		if (priceScale === null) {
			priceScale = this._createPriceScale(priceScaleId, this._model.options().overlayPriceScales);
		}

		this._dataSources.push(source);
		if (priceScaleId !== 'left' && priceScaleId !== 'right') {
			const overlaySources = this._overlaySourcesByScaleId.get(priceScaleId) || [];
			overlaySources.push(source);
			this._overlaySourcesByScaleId.set(priceScaleId, overlaySources);
		}

		priceScale.addDataSource(source);
		source.setPriceScale(priceScale);

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
		if (this._mainDataSource === null || this.isOverlay(this._mainDataSource)) {
			// first check non-overlay sources
			for (const source of this._dataSources) {
				if (source instanceof PriceDataSource && !this.isOverlay(source)) {
					this._setMainSource(source);
					return;
				}
			}
			// then check overlay sources
			const values = Array.from(this._overlaySourcesByScaleId.values());
			for (const sources of values) {
				for (const source of sources) {
					if (source instanceof PriceDataSource) {
						this._setMainSource(source);
						return;
					}
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

	private _createPriceScale(id: string, options: PriceScaleOptions): PriceScale {
		const priceScale = new PriceScale(
			id,
			clone(options),
			this._model.options().layout,
			this._model.options().localization
		);
		priceScale.setHeight(this.height());
		return priceScale;
	}
}
