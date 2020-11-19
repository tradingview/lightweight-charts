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
import { SeriesMarkersPaneView } from '../views/pane/series-markers-pane-view';
import { SeriesPriceLinePaneView } from '../views/pane/series-price-line-pane-view';
import { IPriceAxisView } from '../views/price-axis/iprice-axis-view';
import { SeriesPriceAxisView } from '../views/price-axis/series-price-axis-view';

import { AutoscaleInfoImpl } from './autoscale-info-impl';
import { BarPrice, BarPrices } from './bar';
import { ChartModel } from './chart-model';
import { Coordinate } from './coordinate';
import { CustomPriceLine } from './custom-price-line';
import { isDefaultPriceScale } from './default-price-scale';
import { FirstValue } from './iprice-data-source';
import { Pane } from './pane';
import { PlotRowValueIndex } from './plot-data';
import { PlotRowSearchMode } from './plot-list';
import { PriceDataSource } from './price-data-source';
import { PriceLineOptions } from './price-line-options';
import { PriceRangeImpl } from './price-range-impl';
import { PriceScale } from './price-scale';
import { SeriesBarColorer } from './series-bar-colorer';
import { createSeriesPlotList, SeriesPlotList, SeriesPlotRow } from './series-data';
import { InternalSeriesMarker, SeriesMarker } from './series-markers';
import {
	AreaStyleOptions,
	HistogramStyleOptions,
	LineStyleOptions,
	SeriesOptionsMap,
	SeriesPartialOptionsMap,
	SeriesType,
} from './series-options';
import { TimePoint, TimePointIndex } from './time-data';

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
	index: TimePointIndex;
}

export interface LastValueDataResultWithRawPrice extends LastValueDataResultWithData {
	price: number;
}

export type LastValueDataResultWithoutRawPrice = LastValueDataResultWithoutData | LastValueDataResultWithData;

export interface MarkerData {
	price: BarPrice;
	radius: number;
	borderColor: string;
	backgroundColor: string;
}

export interface SeriesDataAtTypeMap {
	Bar: BarPrices;
	Candlestick: BarPrices;
	Area: BarPrice;
	Line: BarPrice;
	Histogram: BarPrice;
}

// TODO: uncomment following strings after fixing typescript bug
// https://github.com/microsoft/TypeScript/issues/36981
// export type SeriesOptionsInternal<T extends SeriesType = SeriesType> = Omit<SeriesPartialOptionsMap[T], 'overlay'>;
// export type SeriesPartialOptionsInternal<T extends SeriesType = SeriesType> = Omit<SeriesPartialOptionsMap[T], 'overlay'>;

export type SeriesOptionsInternal<T extends SeriesType = SeriesType> = SeriesOptionsMap[T];
export type SeriesPartialOptionsInternal<T extends SeriesType = SeriesType> = SeriesPartialOptionsMap[T];

export class Series<T extends SeriesType = SeriesType> extends PriceDataSource implements IDestroyable {
	private readonly _seriesType: T;
	private _data: SeriesPlotList<T> = createSeriesPlotList();
	private readonly _priceAxisViews: IPriceAxisView[];
	private readonly _panePriceAxisView: PanePriceAxisView;
	private _formatter!: IFormatter;
	private readonly _priceLineView: SeriesPriceLinePaneView = new SeriesPriceLinePaneView(this);
	private readonly _customPriceLines: CustomPriceLine[] = [];
	private readonly _baseHorizontalLineView: SeriesHorizontalBaseLinePaneView = new SeriesHorizontalBaseLinePaneView(this);
	private _paneView!: IUpdatablePaneView;
	private _barColorerCache: SeriesBarColorer | null = null;
	private readonly _options: SeriesOptionsInternal<T>;
	private _markers: SeriesMarker<TimePoint>[] = [];
	private _indexedMarkers: InternalSeriesMarker<TimePointIndex>[] = [];
	private _markersPaneView!: SeriesMarkersPaneView;

	public constructor(model: ChartModel, options: SeriesOptionsInternal<T>, seriesType: T) {
		super(model);
		this._options = options;
		this._seriesType = seriesType;

		const priceAxisView = new SeriesPriceAxisView(this);
		this._priceAxisViews = [priceAxisView];

		this._panePriceAxisView = new PanePriceAxisView(priceAxisView, this, model);

		this._recreateFormatter();

		this._recreatePaneViews();
	}

	public destroy(): void {
	}

	public priceLineColor(lastBarColor: string): string {
		return this._options.priceLineColor || lastBarColor;
	}

	public lastValueData(globalLast: boolean, withRawPrice?: false): LastValueDataResultWithoutRawPrice;
	public lastValueData(globalLast: boolean, withRawPrice: true): LastValueDataResultWithRawPrice;

	// returns object with:
	// formatted price
	// raw price (if withRawPrice)
	// coordinate
	// color
	// or { "noData":true } if last value could not be found
	// NOTE: should NEVER return null or undefined!
	public lastValueData(
		globalLast: boolean,
		withRawPrice?: boolean
	): LastValueDataResultWithoutRawPrice | LastValueDataResultWithRawPrice {
		const noDataRes: LastValueDataResultWithoutData = { noData: true };

		const priceScale = this.priceScale();

		if (this.model().timeScale().isEmpty() || priceScale.isEmpty() || this._data.isEmpty()) {
			return noDataRes;
		}

		const visibleBars = this.model().timeScale().visibleStrictRange();
		const firstValue = this.firstValue();
		if (visibleBars === null || firstValue === null) {
			return noDataRes;
		}

		// find range of bars inside range
		// TODO: make it more optimal
		let bar: SeriesPlotRow<T> | null;
		let lastIndex: TimePointIndex;
		if (globalLast) {
			const lastBar = this._data.last();
			if (lastBar === null) {
				return noDataRes;
			}

			bar = lastBar;
			lastIndex = lastBar.index;
		} else {
			const endBar = this._data.search(visibleBars.right(), PlotRowSearchMode.NearestLeft);
			if (endBar === null) {
				return noDataRes;
			}

			bar = this._data.valueAt(endBar.index);
			if (bar === null) {
				return noDataRes;
			}
			lastIndex = endBar.index;
		}

		const price = bar.value[PlotRowValueIndex.Close];
		const barColorer = this.barColorer();
		const style = barColorer.barStyle(lastIndex, { value: bar });
		const coordinate = priceScale.priceToCoordinate(price, firstValue.value);

		return {
			noData: false,
			price: withRawPrice ? price : undefined,
			text: priceScale.formatPrice(price, firstValue.value),
			formattedPriceAbsolute: priceScale.formatPriceAbsolute(price),
			formattedPricePercentage: priceScale.formatPricePercentage(price, firstValue.value),
			color: style.barColor,
			coordinate: coordinate,
			index: lastIndex,
		};
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

	public applyOptions(options: SeriesPartialOptionsInternal<T>): void {
		const targetPriceScaleId = options.priceScaleId;
		if (targetPriceScaleId !== undefined && targetPriceScaleId !== this._options.priceScaleId) {
			// series cannot do it itself, ask model
			this.model().moveSeriesToScale(this, targetPriceScaleId);
		}
		merge(this._options, options);

		// eslint-disable-next-line deprecation/deprecation
		if (this._priceScale !== null && options.scaleMargins !== undefined) {
			this._priceScale.applyOptions({
				// eslint-disable-next-line deprecation/deprecation
				scaleMargins: options.scaleMargins,
			});
		}

		if (options.priceFormat !== undefined) {
			this._recreateFormatter();
		}

		this.model().updateSource(this);

		// a series might affect crosshair by some options (like crosshair markers)
		// that's why we need to update crosshair as well
		this.model().updateCrosshair();
	}

	public clearData(): void {
		this._data.clear();

		// we must either re-create pane view on clear data
		// or clear all caches inside pane views
		// but currently we can't separate update/append last bar and full data replacement (update vs setData) in pane views invalidation
		// so let's just re-create all views
		this._recreatePaneViews();
	}

	public updateData(data: readonly SeriesPlotRow<T>[], clearData: boolean): void {
		if (clearData) {
			this._data.clear();
		}

		this._data.merge(data);

		this._recalculateMarkers();

		this._paneView.update('data');
		this._markersPaneView.update('data');

		const sourcePane = this.model().paneForSource(this);
		this.model().recalculatePane(sourcePane);
		this.model().updateSource(this);
		this.model().updateCrosshair();
		this.model().lightUpdate();
	}

	public setMarkers(data: SeriesMarker<TimePoint>[]): void {
		this._markers = data.map<SeriesMarker<TimePoint>>((item: SeriesMarker<TimePoint>) => ({ ...item }));
		this._recalculateMarkers();
		const sourcePane = this.model().paneForSource(this);
		this._markersPaneView.update('data');
		this.model().recalculatePane(sourcePane);
		this.model().updateSource(this);
		this.model().updateCrosshair();
		this.model().lightUpdate();
	}

	public indexedMarkers(): InternalSeriesMarker<TimePointIndex>[] {
		return this._indexedMarkers;
	}

	public createPriceLine(options: PriceLineOptions): CustomPriceLine {
		const result = new CustomPriceLine(this, options);
		this._customPriceLines.push(result);
		this.model().updateSource(this);
		return result;
	}

	public removePriceLine(line: CustomPriceLine): void {
		const index = this._customPriceLines.indexOf(line);
		if (index !== -1) {
			this._customPriceLines.splice(index, 1);
		}
		this.model().updateSource(this);
	}

	public seriesType(): T {
		return this._seriesType;
	}

	public firstValue(): FirstValue | null {
		const bar = this.firstBar();
		if (bar === null) {
			return null;
		}

		return {
			value: bar.value[PlotRowValueIndex.Close],
			timePoint: bar.time,
		};
	}

	public firstBar(): SeriesPlotRow<T> | null {
		const visibleBars = this.model().timeScale().visibleStrictRange();
		if (visibleBars === null) {
			return null;
		}

		const startTimePoint = visibleBars.left();
		return this._data.search(startTimePoint, PlotRowSearchMode.NearestRight);
	}

	public bars(): SeriesPlotList<T> {
		return this._data;
	}

	public dataAt(time: TimePointIndex): SeriesDataAtTypeMap[SeriesType] | null {
		const prices = this._data.valueAt(time);
		if (prices === null) {
			return null;
		}
		if (this._seriesType === 'Bar' || this._seriesType === 'Candlestick') {
			return {
				open: prices.value[PlotRowValueIndex.Open] as BarPrice,
				high: prices.value[PlotRowValueIndex.High] as BarPrice,
				low: prices.value[PlotRowValueIndex.Low] as BarPrice,
				close: prices.value[PlotRowValueIndex.Close] as BarPrice,
			};
		} else {
			return prices.value[PlotRowValueIndex.Close] as BarPrice;
		}
	}

	public paneViews(): readonly IPaneView[] {
		const res: IPaneView[] = [];

		if (!this._isOverlay()) {
			res.push(this._baseHorizontalLineView);
		}

		for (const customPriceLine of this._customPriceLines) {
			res.push(...customPriceLine.paneViews());
		}

		res.push(this._paneView);
		res.push(this._priceLineView);

		res.push(this._panePriceAxisView);
		res.push(this._markersPaneView);

		return res;
	}

	public priceAxisViews(pane: Pane, priceScale: PriceScale): readonly IPriceAxisView[] {
		const result = (priceScale === this._priceScale || this._isOverlay()) ? [...this._priceAxisViews] : [];
		for (const customPriceLine of this._customPriceLines) {
			result.push(customPriceLine.priceAxisView());
		}
		return result;
	}

	public autoscaleInfo(startTimePoint: TimePointIndex, endTimePoint: TimePointIndex): AutoscaleInfoImpl | null {
		if (this._options.autoscaleInfoProvider !== undefined) {
			const autoscaleInfo = this._options.autoscaleInfoProvider(() => {
				const res = this._autoscaleInfoImpl(startTimePoint, endTimePoint);
				return (res === null) ? null : res.toRaw();
			});

			return AutoscaleInfoImpl.fromRaw(autoscaleInfo);
		}
		return this._autoscaleInfoImpl(startTimePoint, endTimePoint);
	}

	public minMove(): number {
		return this._options.priceFormat.minMove;
	}

	public formatter(): IFormatter {
		return this._formatter;
	}

	public updateAllViews(): void {
		this._paneView.update();
		this._markersPaneView.update();

		for (const priceAxisView of this._priceAxisViews) {
			priceAxisView.update();
		}

		for (const customPriceLine of this._customPriceLines) {
			customPriceLine.update();
		}

		this._priceLineView.update();
		this._baseHorizontalLineView.update();
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
		const price = bar.value[PlotRowValueIndex.Close] as BarPrice;
		const radius = this._markerRadius();
		const borderColor = this._markerBorderColor();
		const backgroundColor = this._markerBackgroundColor(index);
		return { price, radius, borderColor, backgroundColor };
	}

	public title(): string {
		return this._options.title;
	}

	private _isOverlay(): boolean {
		const priceScale = this.priceScale();
		return !isDefaultPriceScale(priceScale.id());
	}

	private _autoscaleInfoImpl(startTimePoint: TimePointIndex, endTimePoint: TimePointIndex): AutoscaleInfoImpl | null {
		if (!isInteger(startTimePoint) || !isInteger(endTimePoint) || this._data.isEmpty()) {
			return null;
		}

		// TODO: refactor this
		// series data is strongly hardcoded to keep bars
		const plots = this._seriesType === 'Line' || this._seriesType === 'Area' || this._seriesType === 'Histogram'
			? [PlotRowValueIndex.Close]
			: [PlotRowValueIndex.Low, PlotRowValueIndex.High];

		const barsMinMax = this._data.minMaxOnRangeCached(startTimePoint, endTimePoint, plots);

		let range = barsMinMax !== null ? new PriceRangeImpl(barsMinMax.min, barsMinMax.max) : null;

		if (this.seriesType() === 'Histogram') {
			const base = (this._options as HistogramStyleOptions).base;
			const rangeWithBase = new PriceRangeImpl(base, base);
			range = range !== null ? range.merge(rangeWithBase) : rangeWithBase;
		}

		return new AutoscaleInfoImpl(range,	this._markersPaneView.autoScaleMargins());
	}

	private _markerRadius(): number {
		switch (this._seriesType) {
			case 'Line':
			case 'Area':
				return (this._options as (LineStyleOptions | AreaStyleOptions)).crosshairMarkerRadius;
		}

		return 0;
	}

	private _markerBorderColor(): string {
		switch (this._seriesType) {
			case 'Line':
			case 'Area': {
				const crosshairMarkerBorderColor = (this._options as (LineStyleOptions | AreaStyleOptions)).crosshairMarkerBorderColor;
				if (crosshairMarkerBorderColor.length !== 0) {
					return crosshairMarkerBorderColor;
				}
			}
		}

		return this.model().options().layout.backgroundColor;
	}

	private _markerBackgroundColor(index: TimePointIndex): string {
		switch (this._seriesType) {
			case 'Line':
			case 'Area': {
				const crosshairMarkerBackgroundColor = (this._options as (LineStyleOptions | AreaStyleOptions)).crosshairMarkerBackgroundColor;
				if (crosshairMarkerBackgroundColor.length !== 0) {
					return crosshairMarkerBackgroundColor;
				}
			}
		}

		return this.barColorer().barStyle(index).barColor;
	}

	private _recreateFormatter(): void {
		switch (this._options.priceFormat.type) {
			case 'custom': {
				this._formatter = { format: this._options.priceFormat.formatter };
				break;
			}
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
					this._options.priceFormat.minMove * priceScale
				);
			}
		}

		if (this._priceScale !== null) {
			this._priceScale.updateFormatter();
		}
	}

	private _recalculateMarkers(): void {
		const timeScale = this.model().timeScale();
		if (timeScale.isEmpty() || this._data.size() === 0) {
			this._indexedMarkers = [];
			return;
		}

		const firstDataIndex = ensureNotNull(this._data.firstIndex());

		this._indexedMarkers = this._markers.map<InternalSeriesMarker<TimePointIndex>>((marker: SeriesMarker<TimePoint>, index: number) => {
			// the first find index on the time scale (across all series)
			const timePointIndex = ensureNotNull(timeScale.timeToIndex(marker.time, true));

			// and then search that index inside the series data
			const searchMode = timePointIndex < firstDataIndex ? PlotRowSearchMode.NearestRight : PlotRowSearchMode.NearestLeft;
			const seriesDataIndex = ensureNotNull(this._data.search(timePointIndex, searchMode)).index;
			return {
				time: seriesDataIndex,
				position: marker.position,
				shape: marker.shape,
				color: marker.color,
				id: marker.id,
				internalId: index,
				text: marker.text,
				size: marker.size,
			};
		});
	}

	private _recreatePaneViews(): void {
		this._markersPaneView = new SeriesMarkersPaneView(this, this.model());

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
}
