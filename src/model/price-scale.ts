import { IPriceFormatter } from '../formatters/iprice-formatter';
import { PercentageFormatter } from '../formatters/percentage-formatter';
import { PriceFormatter } from '../formatters/price-formatter';

import { ensureDefined, ensureNotNull } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { ISubscription } from '../helpers/isubscription';
import { DeepPartial, merge } from '../helpers/strict-type-checks';

import { BarCoordinates, BarPrice, BarPrices } from './bar';
import { Coordinate } from './coordinate';
import { FirstValue, IPriceDataSource } from './iprice-data-source';
import { LayoutOptions } from './layout-options';
import { LocalizationOptions } from './localization-options';
import { PriceRangeImpl } from './price-range-impl';
import {
	canConvertPriceRangeFromLog,
	convertPriceRangeFromLog,
	convertPriceRangeToLog,
	fromIndexedTo100,
	fromLog,
	fromPercent,
	LogFormula,
	logFormulaForPriceRange,
	logFormulasAreSame,
	toIndexedTo100,
	toIndexedTo100Range,
	toLog,
	toPercent,
	toPercentRange,
} from './price-scale-conversions';
import { PriceTickMarkBuilder } from './price-tick-mark-builder';
import { RangeImpl } from './range-impl';
import { sortSources } from './sort-sources';
import { SeriesItemsIndexesRange, TimePointIndex } from './time-data';

/**
 * Represents the price scale mode.
 */
export const enum PriceScaleMode {
	/**
	 * Price scale shows prices. Price range changes linearly.
	 */
	Normal,
	/**
	 * Price scale shows prices. Price range changes logarithmically.
	 */
	Logarithmic,
	/**
	 * Price scale shows percentage values according the first visible value of the price scale.
	 * The first visible value is 0% in this mode.
	 */
	Percentage,
	/**
	 * The same as percentage mode, but the first value is moved to 100.
	 */
	IndexedTo100,
}

export interface PriceScaleState {
	autoScale: boolean;
	isInverted: boolean;
	mode: PriceScaleMode;
}

export interface PriceMark {
	coord: Coordinate;
	label: string;
}

export interface PricedValue {
	price: BarPrice;
	y: Coordinate;
}

/** Defines margins of the price scale. */
export interface PriceScaleMargins {
	/**
	 * Top margin in percentages. Must be greater or equal to 0 and less than 1.
	 */
	top: number;
	/**
	 * Bottom margin in percentages. Must be greater or equal to 0 and less than 1.
	 */
	bottom: number;
}

/** Structure that describes price scale options */
export interface PriceScaleOptions {
	/**
	 * Autoscaling is a feature that automatically adjusts a price scale to fit the visible range of data.
	 * Note that overlay price scales are always auto-scaled.
	 *
	 * @defaultValue `true`
	 */
	autoScale: boolean;

	/**
	 * Price scale mode.
	 *
	 * @defaultValue {@link PriceScaleMode.Normal}
	 */
	mode: PriceScaleMode;

	/**
	 * Invert the price scale, so that a upwards trend is shown as a downwards trend and vice versa.
	 * Affects both the price scale and the data on the chart.
	 *
	 * @defaultValue `false`
	 */
	invertScale: boolean;

	/**
	 * Align price scale labels to prevent them from overlapping.
	 *
	 * @defaultValue `true`
	 */
	alignLabels: boolean;

	/**
	 * Price scale margins.
	 *
	 * @defaultValue `{ bottom: 0.1, top: 0.2 }`
	 * @example
	 * ```js
	 * chart.priceScale('right').applyOptions({
	 *     scaleMargins: {
	 *         top: 0.8,
	 *         bottom: 0,
	 *     },
	 * });
	 * ```
	 */
	scaleMargins: PriceScaleMargins;

	/**
	 * Set true to draw a border between the price scale and the chart area.
	 *
	 * @defaultValue `true`
	 */
	borderVisible: boolean;

	/**
	 * Price scale border color.
	 *
	 * @defaultValue `'#2B2B43'`
	 */
	borderColor: string;

	/**
	 * Price scale text color.
	 * If not provided {@link LayoutOptions.textColor} is used.
	 *
	 * @defaultValue `undefined`
	 */
	textColor?: string;

	/**
	 * Show top and bottom corner labels only if entire text is visible.
	 *
	 * @defaultValue `false`
	 */
	entireTextOnly: boolean;

	/**
	 * Indicates if this price scale visible. Ignored by overlay price scales.
	 *
	 * @defaultValue `true` for the right price scale and `false` for the left
	 */
	visible: boolean;

	/**
	 * Draw small horizontal line on price axis labels.
	 *
	 * @defaultValue `false`
	 */
	ticksVisible: boolean;
}

interface RangeCache {
	isValid: boolean;
	visibleBars: RangeImpl<TimePointIndex> | null;
}

// actually price should be BarPrice
type PriceTransformer = (price: BarPrice, baseValue: number) => number;

const percentageFormatter = new PercentageFormatter();
const defaultPriceFormatter = new PriceFormatter(100, 1);

interface MarksCache {
	marks: PriceMark[];
	firstValueIsNull: boolean;
}

export class PriceScale {
	private readonly _id: string;

	private readonly _layoutOptions: LayoutOptions;
	private readonly _localizationOptions: LocalizationOptions;
	private readonly _options: PriceScaleOptions;

	private _height: number = 0;
	private _internalHeightCache: number | null = null;

	private _priceRange: PriceRangeImpl | null = null;
	private _priceRangeSnapshot: PriceRangeImpl | null = null;
	private _invalidatedForRange: RangeCache = { isValid: false, visibleBars: null };

	private _marginAbove: number = 0;
	private _marginBelow: number = 0;

	private _markBuilder: PriceTickMarkBuilder;
	private _onMarksChanged: Delegate = new Delegate();

	private _modeChanged: Delegate<PriceScaleState, PriceScaleState> = new Delegate();

	private _dataSources: IPriceDataSource[] = [];
	private _cachedOrderedSources: IPriceDataSource[] | null = null;

	private _marksCache: MarksCache | null = null;

	private _scaleStartPoint: number | null = null;
	private _scrollStartPoint: number | null = null;
	private _formatter: IPriceFormatter = defaultPriceFormatter;

	private _logFormula: LogFormula = logFormulaForPriceRange(null);

	public constructor(id: string, options: PriceScaleOptions, layoutOptions: LayoutOptions, localizationOptions: LocalizationOptions) {
		this._id = id;
		this._options = options;
		this._layoutOptions = layoutOptions;
		this._localizationOptions = localizationOptions;
		this._markBuilder = new PriceTickMarkBuilder(this, 100, this._coordinateToLogical.bind(this), this._logicalToCoordinate.bind(this));
	}

	public id(): string {
		return this._id;
	}

	public options(): Readonly<PriceScaleOptions> {
		return this._options;
	}

	public applyOptions(options: DeepPartial<PriceScaleOptions>): void {
		merge(this._options, options);
		this.updateFormatter();

		if (options.mode !== undefined) {
			this.setMode({ mode: options.mode });
		}

		if (options.scaleMargins !== undefined) {
			const top = ensureDefined(options.scaleMargins.top);
			const bottom = ensureDefined(options.scaleMargins.bottom);

			if (top < 0 || top > 1) {
				throw new Error(`Invalid top margin - expect value between 0 and 1, given=${top}`);
			}

			if (bottom < 0 || bottom > 1 || top + bottom > 1) {
				throw new Error(`Invalid bottom margin - expect value between 0 and 1, given=${bottom}`);
			}

			if (top + bottom > 1) {
				throw new Error(`Invalid margins - sum of margins must be less than 1, given=${top + bottom}`);
			}

			this._invalidateInternalHeightCache();
			this._marksCache = null;
		}
	}

	public isAutoScale(): boolean {
		return this._options.autoScale;
	}

	public isLog(): boolean {
		return this._options.mode === PriceScaleMode.Logarithmic;
	}

	public isPercentage(): boolean {
		return this._options.mode === PriceScaleMode.Percentage;
	}

	public isIndexedTo100(): boolean {
		return this._options.mode === PriceScaleMode.IndexedTo100;
	}

	public mode(): PriceScaleState {
		return {
			autoScale: this._options.autoScale,
			isInverted: this._options.invertScale,
			mode: this._options.mode,
		};
	}

	// eslint-disable-next-line complexity
	public setMode(newMode: Partial<PriceScaleState>): void {
		const oldMode = this.mode();
		let priceRange: PriceRangeImpl | null = null;

		if (newMode.autoScale !== undefined) {
			this._options.autoScale = newMode.autoScale;
		}

		if (newMode.mode !== undefined) {
			this._options.mode = newMode.mode;
			if (newMode.mode === PriceScaleMode.Percentage || newMode.mode === PriceScaleMode.IndexedTo100) {
				this._options.autoScale = true;
			}
			// TODO: Remove after making rebuildTickMarks lazy
			this._invalidatedForRange.isValid = false;
		}

		// define which scale converted from
		if (oldMode.mode === PriceScaleMode.Logarithmic && newMode.mode !== oldMode.mode) {
			if (canConvertPriceRangeFromLog(this._priceRange, this._logFormula)) {
				priceRange = convertPriceRangeFromLog(this._priceRange, this._logFormula);

				if (priceRange !== null) {
					this.setPriceRange(priceRange);
				}
			} else {
				this._options.autoScale = true;
			}
		}

		// define which scale converted to
		if (newMode.mode === PriceScaleMode.Logarithmic && newMode.mode !== oldMode.mode) {
			priceRange = convertPriceRangeToLog(this._priceRange, this._logFormula);

			if (priceRange !== null) {
				this.setPriceRange(priceRange);
			}
		}

		const modeChanged = oldMode.mode !== this._options.mode;
		if (modeChanged && (oldMode.mode === PriceScaleMode.Percentage || this.isPercentage())) {
			this.updateFormatter();
		}

		if (modeChanged && (oldMode.mode === PriceScaleMode.IndexedTo100 || this.isIndexedTo100())) {
			this.updateFormatter();
		}

		if (newMode.isInverted !== undefined && oldMode.isInverted !== newMode.isInverted) {
			this._options.invertScale = newMode.isInverted;
			this._onIsInvertedChanged();
		}

		this._modeChanged.fire(oldMode, this.mode());
	}

	public modeChanged(): ISubscription<PriceScaleState, PriceScaleState> {
		return this._modeChanged;
	}

	public fontSize(): number {
		return this._layoutOptions.fontSize;
	}

	public height(): number {
		return this._height;
	}

	public setHeight(value: number): void {
		if (this._height === value) {
			return;
		}

		this._height = value;
		this._invalidateInternalHeightCache();
		this._marksCache = null;
	}

	public internalHeight(): number {
		if (this._internalHeightCache) {
			return this._internalHeightCache;
		}

		const res = this.height() - this._topMarginPx() - this._bottomMarginPx();
		this._internalHeightCache = res;
		return res;
	}

	public priceRange(): PriceRangeImpl | null {
		this._makeSureItIsValid();
		return this._priceRange;
	}

	public setPriceRange(newPriceRange: PriceRangeImpl | null, isForceSetValue?: boolean): void {
		const oldPriceRange = this._priceRange;

		if (!isForceSetValue &&
			!(oldPriceRange === null && newPriceRange !== null) &&
			(oldPriceRange === null || oldPriceRange.equals(newPriceRange))) {
			return;
		}

		this._marksCache = null;
		this._priceRange = newPriceRange;
	}

	public isEmpty(): boolean {
		this._makeSureItIsValid();
		return this._height === 0 || !this._priceRange || this._priceRange.isEmpty();
	}

	public invertedCoordinate(coordinate: number): number {
		return this.isInverted() ? coordinate : this.height() - 1 - coordinate;
	}

	public priceToCoordinate(price: number, baseValue: number): Coordinate {
		if (this.isPercentage()) {
			price = toPercent(price, baseValue);
		} else if (this.isIndexedTo100()) {
			price = toIndexedTo100(price, baseValue);
		}

		return this._logicalToCoordinate(price, baseValue);
	}

	public pointsArrayToCoordinates<T extends PricedValue>(points: T[], baseValue: number, visibleRange?: SeriesItemsIndexesRange): void {
		this._makeSureItIsValid();
		const bh = this._bottomMarginPx();
		const range = ensureNotNull(this.priceRange());
		const min = range.minValue();
		const max = range.maxValue();
		const ih = (this.internalHeight() - 1);
		const isInverted = this.isInverted();

		const hmm = ih / (max - min);

		const fromIndex = (visibleRange === undefined) ? 0 : visibleRange.from;
		const toIndex = (visibleRange === undefined) ? points.length : visibleRange.to;

		const transformFn = this._getCoordinateTransformer();
		for (let i = fromIndex; i < toIndex; i++) {
			const point = points[i];
			const price = point.price;

			if (isNaN(price)) {
				continue;
			}

			let logical = price;
			if (transformFn !== null) {
				logical = transformFn(point.price, baseValue) as BarPrice;
			}

			const invCoordinate = bh + hmm * (logical - min);
			const coordinate = isInverted ? invCoordinate : this._height - 1 - invCoordinate;
			point.y = coordinate as Coordinate;
		}
	}

	public barPricesToCoordinates<T extends BarPrices & BarCoordinates>(pricesList: T[], baseValue: number, visibleRange?: SeriesItemsIndexesRange): void {
		this._makeSureItIsValid();
		const bh = this._bottomMarginPx();
		const range = ensureNotNull(this.priceRange());
		const min = range.minValue();
		const max = range.maxValue();
		const ih = (this.internalHeight() - 1);
		const isInverted = this.isInverted();

		const hmm = ih / (max - min);

		const fromIndex = (visibleRange === undefined) ? 0 : visibleRange.from;
		const toIndex = (visibleRange === undefined) ? pricesList.length : visibleRange.to;

		const transformFn = this._getCoordinateTransformer();
		for (let i = fromIndex; i < toIndex; i++) {
			const bar = pricesList[i];

			let openLogical = bar.open;
			let highLogical = bar.high;
			let lowLogical = bar.low;
			let closeLogical = bar.close;

			if (transformFn !== null) {
				openLogical = transformFn(bar.open, baseValue) as BarPrice;
				highLogical = transformFn(bar.high, baseValue) as BarPrice;
				lowLogical = transformFn(bar.low, baseValue) as BarPrice;
				closeLogical = transformFn(bar.close, baseValue) as BarPrice;
			}

			let invCoordinate = bh + hmm * (openLogical - min);
			let coordinate = isInverted ? invCoordinate : this._height - 1 - invCoordinate;
			bar.openY = coordinate as Coordinate;

			invCoordinate = bh + hmm * (highLogical - min);
			coordinate = isInverted ? invCoordinate : this._height - 1 - invCoordinate;
			bar.highY = coordinate as Coordinate;

			invCoordinate = bh + hmm * (lowLogical - min);
			coordinate = isInverted ? invCoordinate : this._height - 1 - invCoordinate;
			bar.lowY = coordinate as Coordinate;

			invCoordinate = bh + hmm * (closeLogical - min);
			coordinate = isInverted ? invCoordinate : this._height - 1 - invCoordinate;
			bar.closeY = coordinate as Coordinate;
		}
	}

	public coordinateToPrice(coordinate: Coordinate, baseValue: number): BarPrice {
		const logical = this._coordinateToLogical(coordinate, baseValue);
		return this.logicalToPrice(logical, baseValue);
	}

	public logicalToPrice(logical: number, baseValue: number): BarPrice {
		let value = logical;
		if (this.isPercentage()) {
			value = fromPercent(value, baseValue);
		} else if (this.isIndexedTo100()) {
			value = fromIndexedTo100(value, baseValue);
		}
		return value as BarPrice;
	}

	public dataSources(): readonly IPriceDataSource[] {
		return this._dataSources;
	}

	public orderedSources(): readonly IPriceDataSource[] {
		if (this._cachedOrderedSources) {
			return this._cachedOrderedSources;
		}

		let sources: IPriceDataSource[] = [];
		for (let i = 0; i < this._dataSources.length; i++) {
			const ds = this._dataSources[i];
			if (ds.zorder() === null) {
				ds.setZorder(i + 1);
			}

			sources.push(ds);
		}

		sources = sortSources(sources);
		this._cachedOrderedSources = sources;
		return this._cachedOrderedSources;
	}

	public addDataSource(source: IPriceDataSource): void {
		if (this._dataSources.indexOf(source) !== -1) {
			return;
		}

		this._dataSources.push(source);
		this.updateFormatter();
		this.invalidateSourcesCache();
	}

	public removeDataSource(source: IPriceDataSource): void {
		const index = this._dataSources.indexOf(source);
		if (index === -1) {
			throw new Error('source is not attached to scale');
		}

		this._dataSources.splice(index, 1);

		if (this._dataSources.length === 0) {
			this.setMode({
				autoScale: true,
			});

			// if no sources on price scale let's clear price range cache as well as enabling auto scale
			this.setPriceRange(null);
		}

		this.updateFormatter();
		this.invalidateSourcesCache();
	}

	public firstValue(): number | null {
		// TODO: cache the result
		let result: FirstValue | null = null;

		for (const source of this._dataSources) {
			const firstValue = source.firstValue();
			if (firstValue === null) {
				continue;
			}

			if (result === null || firstValue.timePoint < result.timePoint) {
				result = firstValue;
			}
		}

		return result === null ? null : result.value;
	}

	public isInverted(): boolean {
		return this._options.invertScale;
	}

	public marks(): PriceMark[] {
		const firstValueIsNull = this.firstValue() === null;

		// do not recalculate marks if firstValueIsNull is true because in this case we'll always get empty result
		// this could happen in case when a series had some data and then you set empty data to it (in a simplified case)
		// we could display an empty price scale, but this is not good from UX
		// so in this case we need to keep an previous marks to display them on the scale
		// as one of possible examples for this situation could be the following:
		// let's say you have a study/indicator attached to a price scale and then you decide to stop it, i.e. remove its data because of its visibility
		// a user will see the previous marks on the scale until you turn on your study back or remove it from the chart completely
		if (this._marksCache !== null && (firstValueIsNull || this._marksCache.firstValueIsNull === firstValueIsNull)) {
			return this._marksCache.marks;
		}

		this._markBuilder.rebuildTickMarks();
		const marks = this._markBuilder.marks();
		this._marksCache = { marks, firstValueIsNull };
		this._onMarksChanged.fire();

		return marks;
	}

	public onMarksChanged(): ISubscription {
		return this._onMarksChanged;
	}

	public startScale(x: number): void {
		if (this.isPercentage() || this.isIndexedTo100()) {
			return;
		}

		if (this._scaleStartPoint !== null || this._priceRangeSnapshot !== null) {
			return;
		}

		if (this.isEmpty()) {
			return;
		}

		// invert x
		this._scaleStartPoint = this._height - x;
		this._priceRangeSnapshot = ensureNotNull(this.priceRange()).clone();
	}

	public scaleTo(x: number): void {
		if (this.isPercentage() || this.isIndexedTo100()) {
			return;
		}

		if (this._scaleStartPoint === null) {
			return;
		}

		this.setMode({
			autoScale: false,
		});

		// invert x
		x = this._height - x;

		if (x < 0) {
			x = 0;
		}

		let scaleCoeff = (this._scaleStartPoint + (this._height - 1) * 0.2) / (x + (this._height - 1) * 0.2);
		const newPriceRange = ensureNotNull(this._priceRangeSnapshot).clone();

		scaleCoeff = Math.max(scaleCoeff, 0.1);
		newPriceRange.scaleAroundCenter(scaleCoeff);
		this.setPriceRange(newPriceRange);
	}

	public endScale(): void {
		if (this.isPercentage() || this.isIndexedTo100()) {
			return;
		}

		this._scaleStartPoint = null;
		this._priceRangeSnapshot = null;
	}

	public startScroll(x: number): void {
		if (this.isAutoScale()) {
			return;
		}

		if (this._scrollStartPoint !== null || this._priceRangeSnapshot !== null) {
			return;
		}

		if (this.isEmpty()) {
			return;
		}

		this._scrollStartPoint = x;
		this._priceRangeSnapshot = ensureNotNull(this.priceRange()).clone();
	}

	public scrollTo(x: number): void {
		if (this.isAutoScale()) {
			return;
		}

		if (this._scrollStartPoint === null) {
			return;
		}

		const priceUnitsPerPixel = ensureNotNull(this.priceRange()).length() / (this.internalHeight() - 1);
		let pixelDelta = x - this._scrollStartPoint;

		if (this.isInverted()) {
			pixelDelta *= -1;
		}

		const priceDelta = pixelDelta * priceUnitsPerPixel;
		const newPriceRange = ensureNotNull(this._priceRangeSnapshot).clone();

		newPriceRange.shift(priceDelta);
		this.setPriceRange(newPriceRange, true);
		this._marksCache = null;
	}

	public endScroll(): void {
		if (this.isAutoScale()) {
			return;
		}

		if (this._scrollStartPoint === null) {
			return;
		}

		this._scrollStartPoint = null;
		this._priceRangeSnapshot = null;
	}

	public formatter(): IPriceFormatter {
		if (!this._formatter) {
			this.updateFormatter();
		}

		return this._formatter;
	}

	public formatPrice(price: number, firstValue: number): string {
		switch (this._options.mode) {
			case PriceScaleMode.Percentage:
				return this.formatter().format(toPercent(price, firstValue));
			case PriceScaleMode.IndexedTo100:
				return this.formatter().format(toIndexedTo100(price, firstValue));
			default:
				return this._formatPrice(price as BarPrice);
		}
	}

	public formatLogical(logical: number): string {
		switch (this._options.mode) {
			case PriceScaleMode.Percentage:
			case PriceScaleMode.IndexedTo100:
				return this.formatter().format(logical);
			default:
				return this._formatPrice(logical as BarPrice);
		}
	}

	public formatPriceAbsolute(price: number): string {
		return this._formatPrice(price as BarPrice, ensureNotNull(this._formatterSource()).formatter());
	}

	public formatPricePercentage(price: number, baseValue: number): string {
		price = toPercent(price, baseValue);
		return percentageFormatter.format(price);
	}

	public sourcesForAutoScale(): readonly IPriceDataSource[] {
		return this._dataSources;
	}

	public recalculatePriceRange(visibleBars: RangeImpl<TimePointIndex>): void {
		this._invalidatedForRange = {
			visibleBars: visibleBars,
			isValid: false,
		};
	}

	public updateAllViews(): void {
		this._dataSources.forEach((s: IPriceDataSource) => s.updateAllViews());
	}

	public updateFormatter(): void {
		this._marksCache = null;
		const formatterSource = this._formatterSource();
		let base = 100;
		if (formatterSource !== null) {
			base = Math.round(1 / formatterSource.minMove());
		}

		this._formatter = defaultPriceFormatter;
		if (this.isPercentage()) {
			this._formatter = percentageFormatter;
			base = 100;
		} else if (this.isIndexedTo100()) {
			this._formatter = new PriceFormatter(100, 1);
			base = 100;
		} else {
			if (formatterSource !== null) {
				// user
				this._formatter = formatterSource.formatter();
			}
		}

		this._markBuilder = new PriceTickMarkBuilder(
			this,
			base,
			this._coordinateToLogical.bind(this),
			this._logicalToCoordinate.bind(this)
		);

		this._markBuilder.rebuildTickMarks();
	}

	public invalidateSourcesCache(): void {
		this._cachedOrderedSources = null;
	}

	/**
	 * @returns The {@link IPriceDataSource} that will be used as the "formatter source" (take minMove for formatter).
	 */
	private _formatterSource(): IPriceDataSource | null {
		return this._dataSources[0] || null;
	}

	private _topMarginPx(): number {
		return this.isInverted()
			? this._options.scaleMargins.bottom * this.height() + this._marginBelow
			: this._options.scaleMargins.top * this.height() + this._marginAbove;
	}

	private _bottomMarginPx(): number {
		return this.isInverted()
			? this._options.scaleMargins.top * this.height() + this._marginAbove
			: this._options.scaleMargins.bottom * this.height() + this._marginBelow;
	}

	private _makeSureItIsValid(): void {
		if (!this._invalidatedForRange.isValid) {
			this._invalidatedForRange.isValid = true;
			this._recalculatePriceRangeImpl();
		}
	}

	private _invalidateInternalHeightCache(): void {
		this._internalHeightCache = null;
	}

	private _logicalToCoordinate(logical: number, baseValue: number): Coordinate {
		this._makeSureItIsValid();
		if (this.isEmpty()) {
			return 0 as Coordinate;
		}

		logical = this.isLog() && logical ? toLog(logical, this._logFormula) : logical;
		const range = ensureNotNull(this.priceRange());
		const invCoordinate = this._bottomMarginPx() +
			(this.internalHeight() - 1) * (logical - range.minValue()) / range.length();
		const coordinate = this.invertedCoordinate(invCoordinate);
		return coordinate as Coordinate;
	}

	private _coordinateToLogical(coordinate: number, baseValue: number): number {
		this._makeSureItIsValid();
		if (this.isEmpty()) {
			return 0;
		}

		const invCoordinate = this.invertedCoordinate(coordinate);
		const range = ensureNotNull(this.priceRange());
		const logical = range.minValue() + range.length() *
			((invCoordinate - this._bottomMarginPx()) / (this.internalHeight() - 1));
		return this.isLog() ? fromLog(logical, this._logFormula) : logical;
	}

	private _onIsInvertedChanged(): void {
		this._marksCache = null;
		this._markBuilder.rebuildTickMarks();
	}

	// eslint-disable-next-line complexity
	private _recalculatePriceRangeImpl(): void {
		const visibleBars = this._invalidatedForRange.visibleBars;
		if (visibleBars === null) {
			return;
		}

		let priceRange: PriceRangeImpl | null = null;
		const sources = this.sourcesForAutoScale();

		let marginAbove = 0;
		let marginBelow = 0;

		for (const source of sources) {
			if (!source.visible()) {
				continue;
			}

			const firstValue = source.firstValue();
			if (firstValue === null) {
				continue;
			}

			const autoScaleInfo = source.autoscaleInfo(visibleBars.left(), visibleBars.right());
			let sourceRange = autoScaleInfo && autoScaleInfo.priceRange();

			if (sourceRange !== null) {
				switch (this._options.mode) {
					case PriceScaleMode.Logarithmic:
						sourceRange = convertPriceRangeToLog(sourceRange, this._logFormula);
						break;
					case PriceScaleMode.Percentage:
						sourceRange = toPercentRange(sourceRange, firstValue.value);
						break;
					case PriceScaleMode.IndexedTo100:
						sourceRange = toIndexedTo100Range(sourceRange, firstValue.value);
						break;
				}

				if (priceRange === null) {
					priceRange = sourceRange;
				} else {
					priceRange = priceRange.merge(ensureNotNull(sourceRange));
				}

				if (autoScaleInfo !== null) {
					const margins = autoScaleInfo.margins();
					if (margins !== null) {
						marginAbove = Math.max(marginAbove, margins.above);
						marginBelow = Math.max(marginAbove, margins.below);
					}
				}
			}
		}

		if (marginAbove !== this._marginAbove || marginBelow !== this._marginBelow) {
			this._marginAbove = marginAbove;
			this._marginBelow = marginBelow;
			this._marksCache = null;
			this._invalidateInternalHeightCache();
		}

		if (priceRange !== null) {
			// keep current range is new is empty
			if (priceRange.minValue() === priceRange.maxValue()) {
				const formatterSource = this._formatterSource();
				const minMove = formatterSource === null || this.isPercentage() || this.isIndexedTo100() ? 1 : formatterSource.minMove();

				// if price range is degenerated to 1 point let's extend it by 10 min move values
				// to avoid incorrect range and empty (blank) scale (in case of min tick much greater than 1)
				const extendValue = 5 * minMove;

				if (this.isLog()) {
					priceRange = convertPriceRangeFromLog(priceRange, this._logFormula);
				}

				priceRange = new PriceRangeImpl(priceRange.minValue() - extendValue, priceRange.maxValue() + extendValue);

				if (this.isLog()) {
					priceRange = convertPriceRangeToLog(priceRange, this._logFormula);
				}
			}

			if (this.isLog()) {
				const rawRange = convertPriceRangeFromLog(priceRange, this._logFormula);
				const newLogFormula = logFormulaForPriceRange(rawRange);
				if (!logFormulasAreSame(newLogFormula, this._logFormula)) {
					const rawSnapshot = this._priceRangeSnapshot !== null ? convertPriceRangeFromLog(this._priceRangeSnapshot, this._logFormula) : null;
					this._logFormula = newLogFormula;
					priceRange = convertPriceRangeToLog(rawRange, newLogFormula);
					if (rawSnapshot !== null) {
						this._priceRangeSnapshot = convertPriceRangeToLog(rawSnapshot, newLogFormula);
					}
				}
			}

			this.setPriceRange(priceRange);
		} else {
			// reset empty to default
			if (this._priceRange === null) {
				this.setPriceRange(new PriceRangeImpl(-0.5, 0.5));
				this._logFormula = logFormulaForPriceRange(null);
			}
		}

		this._invalidatedForRange.isValid = true;
	}

	private _getCoordinateTransformer(): PriceTransformer | null {
		if (this.isPercentage()) {
			return toPercent;
		} else if (this.isIndexedTo100()) {
			return toIndexedTo100;
		} else if (this.isLog()) {
			return (price: number) => toLog(price, this._logFormula);
		}

		return null;
	}

	private _formatPrice(price: BarPrice, fallbackFormatter?: IPriceFormatter): string {
		if (this._localizationOptions.priceFormatter === undefined) {
			if (fallbackFormatter === undefined) {
				fallbackFormatter = this.formatter();
			}

			return fallbackFormatter.format(price);
		}

		return this._localizationOptions.priceFormatter(price);
	}
}
