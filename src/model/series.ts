import { IFormatter } from '../formatters/iformatter';
import { PercentageFormatter } from '../formatters/percentage-formatter';
import { PriceFormatter } from '../formatters/price-formatter';
import { VolumeFormatter } from '../formatters/volume-formatter';

import { ensureNotNull } from '../helpers/assertions';
import { IDestroyable } from '../helpers/idestroyable';
import { isInteger, merge } from '../helpers/strict-type-checks';

import { SeriesAreaPaneView } from '../views/pane/area-pane-view';
import { SeriesBarsPaneView } from '../views/pane/bars-pane-view';
import { SeriesCandlesticksPaneView } from '../views/pane/candlesticks-pane-view';
import { SeriesHistogramPaneView } from '../views/pane/histogram-pane-view';
import { IPaneView } from '../views/pane/ipane-view';
import { IUpdatablePaneView } from '../views/pane/iupdatable-pane-view';
import { SeriesLinePaneView } from '../views/pane/line-pane-view';
import { PanePriceAxisView } from '../views/pane/pane-price-axis-view';
import { SeriesHorizontalBaseLinePaneView } from '../views/pane/series-horizontal-base-line-pane-view';
import { SeriesPriceLinePaneView } from '../views/pane/series-price-line-pane-view';
import { IPriceAxisView } from '../views/price-axis/iprice-axis-view';
import { SeriesPriceAxisView } from '../views/price-axis/series-price-axis-view';

import { BarPrice } from './bar';
import { ChartModel } from './chart-model';
import { Coordinate } from './coordinate';
import { Palette } from './palette';
import { Pane } from './pane';
import { PlotRow } from './plot-data';
import { MinMax, PlotList, PlotRowSearchMode } from './plot-list';
import { PriceDataSource } from './price-data-source';
import { PriceRange } from './price-range';
import { PriceScale } from './price-scale';
import { SeriesBarColorer } from './series-bar-colorer';
import { Bar, barFunction, SeriesData, SeriesPlotIndex } from './series-data';
import {
	AreaStyleOptions,
	HistogramStyleOptions,
	LineStyleOptions,
	SeriesOptionsMap,
	SeriesPartialOptionsMap,
	SeriesType,
} from './series-options';
import { TimePointIndex } from './time-data';

export interface LastValueDataResult {
	noData: boolean;
}

export interface LastValueDataResultWithoutData extends LastValueDataResult {
	noData: true;
}

export interface LastValueDataResultWithData extends LastValueDataResult {
	noData: false;
	text: string;
	formattedPriceAbsolute: string;
	formattedPricePercentage: string;
	color: string;
	coordinate: Coordinate;
	floatCoordinate: Coordinate;
	index: TimePointIndex;
}

export interface LastValueDataResultWithRawPrice extends LastValueDataResultWithData {
	price: number;
}

export type LastValueDataResultWithoutRawPrice = LastValueDataResultWithoutData | LastValueDataResultWithData;

export type BarFunction = (bar: Bar['value']) => BarPrice;

export interface MarkerData {
	price: BarPrice;
	radius: number;
}

export class Series<T extends SeriesType = SeriesType> extends PriceDataSource implements IDestroyable {
	private readonly _seriesType: T;
	private _data: SeriesData = new SeriesData();
	private readonly _priceAxisViews: IPriceAxisView[];
	private readonly _panePriceAxisView: PanePriceAxisView;
	private _formatter!: IFormatter;
	private readonly _priceLineView: SeriesPriceLinePaneView = new SeriesPriceLinePaneView(this);
	private readonly _baseHorizontalLineView: SeriesHorizontalBaseLinePaneView = new SeriesHorizontalBaseLinePaneView(this);
	private _endOfData: boolean = false;
	private _paneView: IUpdatablePaneView | null = null;
	private _barColorerCache: SeriesBarColorer | null = null;
	private readonly _options: SeriesOptionsMap[T];
	private _barFunction: BarFunction;
	private _palette: Palette = new Palette();

	public constructor(model: ChartModel, options: SeriesOptionsMap[T], seriesType: T) {
		super(model);
		this._options = options;
		this._seriesType = seriesType;

		this.createPaneView();

		const priceAxisView = new SeriesPriceAxisView(this, { model: model });
		this._priceAxisViews = [priceAxisView];

		this._panePriceAxisView = new PanePriceAxisView(priceAxisView, this, model);

		this._recreateFormatter();
		this._updateBarFunction();
		this._barFunction = this.barFunction(); // redundant
	}

	public destroy(): void {
	}

	public endOfData(): boolean {
		return this._endOfData;
	}

	public priceLineColor(lastBarColor: string): string {
		return this._options.priceLineColor || lastBarColor;
	}

	public lastValueData(plot: SeriesPlotIndex | undefined, globalLast: boolean, withRawPrice?: false): LastValueDataResultWithoutRawPrice;
	public lastValueData(plot: SeriesPlotIndex | undefined, globalLast: boolean, withRawPrice: true): LastValueDataResultWithRawPrice;

	// returns object with:
	// formatted price
	// raw price (if withRawPrice)
	// coordinate
	// color
	// or { "noData":true } if last value could not be found
	// NOTE: should NEVER return null or undefined!
	public lastValueData(
		plot: SeriesPlotIndex | undefined,
		globalLast: boolean,
		withRawPrice?: boolean
	): LastValueDataResultWithoutRawPrice | LastValueDataResultWithRawPrice {
		const noDataRes: LastValueDataResultWithoutData = { noData: true };

		const priceScale = this.priceScale();

		if (this.model().timeScale().isEmpty() || priceScale.isEmpty() || this.data().isEmpty()) {
			return noDataRes;
		}

		const visibleBars = this.model().timeScale().visibleBars();
		const firstValue = this.firstValue();
		if (visibleBars === null || firstValue === null) {
			return noDataRes;
		}

		// find range of bars inside range
		// TODO: make it more optimal
		let bar: Bar | null;
		let lastIndex: TimePointIndex;
		if (globalLast) {
			const lastBar = this.data().bars().last();
			if (lastBar === null) {
				return noDataRes;
			}

			bar = lastBar;
			lastIndex = lastBar.index;
		} else {
			const endBar = this.data().bars().search(visibleBars.lastBar(), PlotRowSearchMode.NearestLeft);
			if (endBar === null) {
				return noDataRes;
			}

			bar = this.data().bars().valueAt(endBar.index);
			if (bar === null) {
				return noDataRes;
			}
			lastIndex = endBar.index;
		}

		const price = plot !== undefined ? bar.value[plot] as number : this._barFunction(bar.value);
		const barColorer = this.barColorer();
		const style = barColorer.barStyle(lastIndex, { value: bar });
		const floatCoordinate = priceScale.priceToCoordinate(price, firstValue, true);

		return {
			noData: false,
			price: withRawPrice ? price : undefined,
			text: priceScale.formatPrice(price, firstValue),
			formattedPriceAbsolute: priceScale.formatPriceAbsolute(price),
			formattedPricePercentage: priceScale.formatPricePercentage(price, firstValue),
			color: style.barColor,
			floatCoordinate: floatCoordinate,
			coordinate: Math.round(floatCoordinate) as Coordinate,
			index: lastIndex,
		};
	}

	public data(): SeriesData {
		return this._data;
	}

	public createPaneView(): void {
		this._paneView = null;
		switch (this._seriesType) {
			case 'Bar': {
				this._paneView = new SeriesBarsPaneView(this as Series<'Bar'>, this.model());
				break;
			}

			case 'Candlestick': {
				this._paneView = new SeriesCandlesticksPaneView(this as Series<'Candlestick'>, this.model());
				break;
			}

			case 'Line': {
				this._paneView = new SeriesLinePaneView(this as Series<'Line'>, this.model());
				break;
			}

			case 'Area': {
				this._paneView = new SeriesAreaPaneView(this as Series<'Area'>, this.model());
				break;
			}

			case 'Histogram': {
				this._paneView = new SeriesHistogramPaneView(this as Series<'Histogram'>, this.model());
				break;
			}

			default: throw Error('Unknown chart style assigned: ' + this._seriesType);
		}
	}

	public barColorer(): SeriesBarColorer {
		if (this._barColorerCache !== null) {
			return this._barColorerCache;
		}

		this._barColorerCache = new SeriesBarColorer(this);
		return this._barColorerCache;
	}

	public options(): Readonly<SeriesOptionsMap[T]> {
		return this._options;
	}

	public applyOptions(options: SeriesPartialOptionsMap[T]): void {
		const overlay = this._options.overlay;
		merge(this._options, options);
		this._options.overlay = overlay;

		if (overlay && this._priceScale !== null && options.scaleMargins !== undefined) {
			this._priceScale.applyOptions({
				scaleMargins: this._options.scaleMargins,
			});
		}

		this._recreateFormatter();
		this.model().updateSource(this);
	}

	public setData(data: ReadonlyArray<PlotRow<Bar['time'], Bar['value']>>, updatePalette: boolean, palette?: Palette): void {
		this._data.clear();
		this._data.bars().merge(data);
		if (updatePalette) {
			this._palette = (palette === undefined) ? new Palette() : palette;
		}
		if (this._paneView !== null) {
			this._paneView.update('data');
		}
		const sourcePane = this.model().paneForSource(this);
		this.model().recalculatePane(sourcePane);
		this.model().updateSource(this);
		this.model().updateCrosshair();
		this.model().lightUpdate();
	}

	public updateData(data: ReadonlyArray<PlotRow<Bar['time'], Bar['value']>>): void {
		this._data.bars().merge(data);
		if (this._paneView !== null) {
			this._paneView.update('data');
		}
		const sourcePane = this.model().paneForSource(this);
		this.model().recalculatePane(sourcePane);
		this.model().updateSource(this);
		this.model().updateCrosshair();
		this.model().lightUpdate();
	}

	public palette(): Palette {
		return this._palette;
	}

	public seriesType(): SeriesType {
		return this._seriesType;
	}

	public firstValue(): number | null {
		const bar = this.firstBar();
		if (bar === null) {
			return null;
		}

		return this._barFunction(bar.value);
	}

	public firstBar(): Bar | null {
		const visibleBars = this.model().timeScale().visibleBars();
		if (visibleBars === null) {
			return null;
		}

		const startTimePoint = visibleBars.firstBar();
		return this.data().search(startTimePoint, PlotRowSearchMode.NearestRight);
	}

	public bars(): PlotList<Bar['time'], Bar['value']> {
		return this._data.bars();
	}

	public nearestIndex(index: TimePointIndex, options?: PlotRowSearchMode): TimePointIndex | null {
		const res = this.nearestData(index, options);
		return res ? res.index : null;
	}

	public nearestData(index: TimePointIndex, options?: PlotRowSearchMode): PlotRow<Bar['time'], Bar['value']> | null {
		if (!isInteger(index)) {
			return null;
		}

		return this.data().search(index, options);
	}

	public paneViews(): ReadonlyArray<IPaneView> {
		if (!this.isVisible()) {
			return [];
		}
		const res: IPaneView[] = [];

		if (this.priceScale() === this.model().mainPriceScale()) {
			res.push(this._baseHorizontalLineView);
		}
		res.push(ensureNotNull(this._paneView));
		res.push(this._priceLineView);

		res.push(this._panePriceAxisView);
		return res;
	}

	public priceAxisViews(pane: Pane, priceScale: PriceScale): ReadonlyArray<IPriceAxisView> {
		return this._priceAxisViews;
	}

	public priceRange(startTimePoint: TimePointIndex, endTimePoint: TimePointIndex): PriceRange | null {
		if (!isInteger(startTimePoint)) {
			return null;
		}

		if (!isInteger(endTimePoint)) {
			return null;
		}

		if (this.data().isEmpty()) {
			return null;
		}

		// TODO: refactor this
		// series data is strongly hardcoded to keep bars
		const priceSource = (this._seriesType === 'Line' || this._seriesType === 'Area' || this._seriesType === 'Histogram') ? 'close' : null;
		let barsMinMax: MinMax | null;
		if (priceSource !== null) {
			barsMinMax = this.data().bars().minMaxOnRangeCached(startTimePoint, endTimePoint, [{ name: priceSource, offset: 0 }]);
		} else {
			barsMinMax = this.data().bars().minMaxOnRangeCached(startTimePoint, endTimePoint, [{ name: 'low', offset: 0 }, { name: 'high', offset: 0 }]);
		}

		let range =
			barsMinMax !== null ?
				barsMinMax.min === barsMinMax.max ?
					new PriceRange(barsMinMax.min - 0.5, barsMinMax.max + 0.5) : // special case: range consists of the only point
					new PriceRange(barsMinMax.min, barsMinMax.max) :
				new PriceRange(-0.5, 0.5);

		if (this.seriesType() === 'Histogram') {
			const base = (this._options as HistogramStyleOptions).base;
			range = range.merge(new PriceRange(base, base));
		}

		return range;
	}

	public base(): number {
		return Math.round(1 / this._options.priceFormat.minMove);
	}

	public formatter(): IFormatter {
		return this._formatter;
	}

	public barFunction(): BarFunction {
		return this._barFunction;
	}

	public updateAllViews(): void {
		if (this._paneView === null) {
			return;
		}

		this._paneView.update();

		const priceAxisViewsLength = this._priceAxisViews.length;
		for (let i = 0; i < priceAxisViewsLength; i++) {
			this._priceAxisViews[i].update();
		}
		this._priceLineView.update();
		this._baseHorizontalLineView.update();
	}

	public setPriceScale(priceScale: PriceScale): void {
		if (this._priceScale === priceScale) {
			return;
		}

		this._priceScale = priceScale;
	}

	public priceScale(): PriceScale {
		return ensureNotNull(this._priceScale);
	}

	public markerDataAtIndex(index: TimePointIndex): MarkerData | null {
		const getValue = (this._seriesType === 'Line' || this._seriesType === 'Area') &&
			(this._options as (LineStyleOptions | AreaStyleOptions)).crosshairMarkerVisible;

		if (!getValue) {
			return null;
		}
		const bar = this._data.valueAt(index);
		if (bar === null) {
			return null;
		}
		const price = this._barFunction(bar.value);
		const radius = this._markerRadius();
		return { price, radius };
	}

	public title(): string {
		return this._options.title;
	}

	private _markerRadius(): number {
		switch (this._seriesType) {
			case 'Line':
			case 'Area':
				return (this._options as (LineStyleOptions | AreaStyleOptions)).crosshairMarkerRadius;
		}

		return 0;
	}

	private _recreateFormatter(): void {
		switch (this._options.priceFormat.type) {
			case 'volume': {
				this._formatter = new VolumeFormatter(this._options.priceFormat.precision);
				break;
			}
			case 'percent': {
				this._formatter = new PercentageFormatter(this._options.priceFormat.precision);
				break;
			}
			default: {
				const priceScale = Math.pow(10, this._options.priceFormat.precision);
				this._formatter = new PriceFormatter(
					priceScale,
					this._options.priceFormat.minMove * priceScale,
					false,
					undefined
				);
			}
		}

		if (this._priceScale !== null) {
			this._priceScale.updateFormatter();
		}
	}

	private _updateBarFunction(): void {
		const priceSource = 'close';
		this._barFunction = barFunction(priceSource);
	}
}
