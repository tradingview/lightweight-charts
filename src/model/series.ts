import { IPriceFormatter } from '../formatters/iprice-formatter';
import { PercentageFormatter } from '../formatters/percentage-formatter';
import { PriceFormatter } from '../formatters/price-formatter';
import { VolumeFormatter } from '../formatters/volume-formatter';

import { ensureNotNull } from '../helpers/assertions';
import { IDestroyable } from '../helpers/idestroyable';
import { DeepPartial, isInteger, merge } from '../helpers/strict-type-checks';

import { SeriesAreaPaneView } from '../views/pane/area-pane-view';
import { SeriesBarsPaneView } from '../views/pane/bars-pane-view';
import { SeriesBaselinePaneView } from '../views/pane/baseline-pane-view';
import { SeriesCandlesticksPaneView } from '../views/pane/candlesticks-pane-view';
import { SeriesHistogramPaneView } from '../views/pane/histogram-pane-view';
import { IPaneView } from '../views/pane/ipane-view';
import { IUpdatablePaneView } from '../views/pane/iupdatable-pane-view';
import { SeriesLinePaneView } from '../views/pane/line-pane-view';
import { PanePriceAxisView } from '../views/pane/pane-price-axis-view';
import { SeriesHorizontalBaseLinePaneView } from '../views/pane/series-horizontal-base-line-pane-view';
import { SeriesLastPriceAnimationPaneView } from '../views/pane/series-last-price-animation-pane-view';
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
import { MismatchDirection } from './plot-list';
import { PriceDataSource } from './price-data-source';
import { PriceLineOptions } from './price-line-options';
import { PriceRangeImpl } from './price-range-impl';
import { PriceScale } from './price-scale';
import { SeriesBarColorer } from './series-bar-colorer';
import { createSeriesPlotList, SeriesPlotList, SeriesPlotRow } from './series-data';
import { InternalSeriesMarker, SeriesMarker } from './series-markers';
import {
	AreaStyleOptions,
	BaselineStyleOptions,
	HistogramStyleOptions,
	LineStyleOptions,
	SeriesOptionsCommon,
	SeriesOptionsMap,
	SeriesPartialOptionsMap,
	SeriesType,
} from './series-options';
import { TimePoint, TimePointIndex } from './time-data';

export interface LastValueDataResultWithoutData {
	noData: true;
}

export interface LastValueDataResultWithData {
	noData: false;

	price: number;
	text: string;
	formattedPriceAbsolute: string;
	formattedPricePercentage: string;
	color: string;
	coordinate: Coordinate;
	index: TimePointIndex;
}

export type LastValueDataResult = LastValueDataResultWithoutData | LastValueDataResultWithData;

export interface MarkerData {
	price: BarPrice;
	radius: number;
	borderColor: string | null;
	backgroundColor: string;
}

export interface SeriesDataAtTypeMap {
	Bar: BarPrices;
	Candlestick: BarPrices;
	Area: BarPrice;
	Baseline: BarPrice;
	Line: BarPrice;
	Histogram: BarPrice;
}

export interface SeriesUpdateInfo {
	lastBarUpdatedOrNewBarsAddedToTheRight: boolean;
}

// note that if would like to use `Omit` here - you can't due https://github.com/microsoft/TypeScript/issues/36981
export type SeriesOptionsInternal<T extends SeriesType = SeriesType> = SeriesOptionsMap[T];
export type SeriesPartialOptionsInternal<T extends SeriesType = SeriesType> = SeriesPartialOptionsMap[T];

export class Series<T extends SeriesType = SeriesType> extends PriceDataSource implements IDestroyable {
	private readonly _seriesType: T;
	private _data: SeriesPlotList<T> = createSeriesPlotList();
	private readonly _priceAxisViews: IPriceAxisView[];
	private readonly _panePriceAxisView: PanePriceAxisView;
	private _formatter!: IPriceFormatter;
	private readonly _priceLineView: SeriesPriceLinePaneView = new SeriesPriceLinePaneView(this);
	private readonly _customPriceLines: CustomPriceLine[] = [];
	private readonly _baseHorizontalLineView: SeriesHorizontalBaseLinePaneView = new SeriesHorizontalBaseLinePaneView(this);
	private _paneView!: IUpdatablePaneView;
	private readonly _lastPriceAnimationPaneView: SeriesLastPriceAnimationPaneView | null = null;
	private _barColorerCache: SeriesBarColorer | null = null;
	private readonly _options: SeriesOptionsInternal<T>;
	private _markers: readonly SeriesMarker<TimePoint>[] = [];
	private _indexedMarkers: InternalSeriesMarker<TimePointIndex>[] = [];
	private _markersPaneView!: SeriesMarkersPaneView;
	private _animationTimeoutId: TimerId | null = null;

	public constructor(model: ChartModel, options: SeriesOptionsInternal<T>, seriesType: T) {
		super(model);
		this._options = options;
		this._seriesType = seriesType;

		const priceAxisView = new SeriesPriceAxisView(this);
		this._priceAxisViews = [priceAxisView];

		this._panePriceAxisView = new PanePriceAxisView(priceAxisView, this, model);

		if (seriesType === 'Area' || seriesType === 'Line' || seriesType === 'Baseline') {
			this._lastPriceAnimationPaneView = new SeriesLastPriceAnimationPaneView(this as Series<'Area'> | Series<'Line'> | Series<'Baseline'>);
		}

		this._recreateFormatter();

		this._recreatePaneViews();
	}

	public destroy(): void {
		if (this._animationTimeoutId !== null) {
			clearTimeout(this._animationTimeoutId);
		}
	}

	public priceLineColor(lastBarColor: string): string {
		return this._options.priceLineColor || lastBarColor;
	}

	public lastValueData(globalLast: boolean): LastValueDataResult {
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
			const endBar = this._data.search(visibleBars.right(), MismatchDirection.NearestLeft);
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
			price,
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
		return this._options as SeriesOptionsMap[T];
	}

	public applyOptions(options: SeriesPartialOptionsInternal<T> | DeepPartial<SeriesOptionsCommon>): void {
		const targetPriceScaleId = options.priceScaleId;
		if (targetPriceScaleId !== undefined && targetPriceScaleId !== this._options.priceScaleId) {
			// series cannot do it itself, ask model
			this.model().moveSeriesToScale(this, targetPriceScaleId);
		}
		const previousPaneIndex = this._options.pane ?? 0;
		merge(this._options, options);

		if (options.priceFormat !== undefined) {
			this._recreateFormatter();

			// updated formatter might affect rendering  and as a consequence of this the width of price axis might be changed
			// thus we need to force the chart to do a full update to apply changes correctly
			// full update is quite heavy operation in terms of performance
			// but updating formatter looks like quite rare so forcing a full update here shouldn't affect the performance a lot
			this.model().fullUpdate();
		}

		if (options.pane && previousPaneIndex !== options.pane) {
			this.model().moveSeriesToPane(this, previousPaneIndex, options.pane);
		}

		this.model().updateSource(this);

		// a series might affect crosshair by some options (like crosshair markers)
		// that's why we need to update crosshair as well
		this.model().updateCrosshair();

		this._paneView.update('options');
	}

	public setData(data: readonly SeriesPlotRow<T>[], updateInfo?: SeriesUpdateInfo): void {
		this._data.setData(data);

		this._recalculateMarkers();

		this._paneView.update('data');
		this._markersPaneView.update('data');

		if (this._lastPriceAnimationPaneView !== null) {
			if (updateInfo && updateInfo.lastBarUpdatedOrNewBarsAddedToTheRight) {
				this._lastPriceAnimationPaneView.onNewRealtimeDataReceived();
			} else if (data.length === 0) {
				this._lastPriceAnimationPaneView.onDataCleared();
			}
		}

		const sourcePane = this.model().paneForSource(this);
		this.model().recalculatePane(sourcePane);
		this.model().updateSource(this);
		this.model().updateCrosshair();
		this.model().lightUpdate();
	}

	public setMarkers(data: readonly SeriesMarker<TimePoint>[]): void {
		this._markers = data;
		this._recalculateMarkers();
		const sourcePane = this.model().paneForSource(this);
		this._markersPaneView.update('data');
		this.model().recalculatePane(sourcePane);
		this.model().updateSource(this);
		this.model().updateCrosshair();
		this.model().lightUpdate();
	}

	public markers(): readonly SeriesMarker<TimePoint>[] {
		return this._markers;
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
		return this._data.search(startTimePoint, MismatchDirection.NearestRight);
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

	public topPaneViews(pane: Pane): readonly IPaneView[] {
		const animationPaneView = this._lastPriceAnimationPaneView;
		if (animationPaneView === null || !animationPaneView.visible()) {
			return [];
		}

		if (this._animationTimeoutId === null && animationPaneView.animationActive()) {
			this._animationTimeoutId = setTimeout(
				() => {
					this._animationTimeoutId = null;
					this.model().cursorUpdate();
				},
				0
			);
		}

		animationPaneView.invalidateStage();
		return [animationPaneView];
	}

	public paneViews(): readonly IPaneView[] {
		const res: IPaneView[] = [];

		if (!this._isOverlay()) {
			res.push(this._baseHorizontalLineView);
		}

		res.push(
			this._paneView,
			this._priceLineView,
			this._markersPaneView
		);

		const priceLineViews = this._customPriceLines.map((line: CustomPriceLine) => line.paneView());
		res.push(...priceLineViews);

		return res;
	}

	public override labelPaneViews(pane?: Pane): readonly IPaneView[] {
		return [
			this._panePriceAxisView,
			...this._customPriceLines.map((line: CustomPriceLine) => line.labelPaneView()),
		];
	}

	public override priceAxisViews(pane: Pane, priceScale: PriceScale): readonly IPriceAxisView[] {
		if (priceScale !== this._priceScale && !this._isOverlay()) {
			return [];
		}
		const result = [...this._priceAxisViews];
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

	public formatter(): IPriceFormatter {
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
		this._lastPriceAnimationPaneView?.update();
	}

	public override priceScale(): PriceScale {
		return ensureNotNull(super.priceScale());
	}

	public markerDataAtIndex(index: TimePointIndex): MarkerData | null {
		const getValue = (this._seriesType === 'Line' || this._seriesType === 'Area' || this._seriesType === 'Baseline') &&
			(this._options as (LineStyleOptions | AreaStyleOptions | BaselineStyleOptions)).crosshairMarkerVisible;

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

	public override visible(): boolean {
		return this._options.visible;
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
		const plots = this._seriesType === 'Line' || this._seriesType === 'Area' || this._seriesType === 'Baseline' || this._seriesType === 'Histogram'
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
			case 'Baseline':
				return (this._options as (LineStyleOptions | AreaStyleOptions | BaselineStyleOptions)).crosshairMarkerRadius;
		}

		return 0;
	}

	private _markerBorderColor(): string | null {
		switch (this._seriesType) {
			case 'Line':
			case 'Area':
			case 'Baseline': {
				const crosshairMarkerBorderColor = (this._options as (LineStyleOptions | AreaStyleOptions | BaselineStyleOptions)).crosshairMarkerBorderColor;
				if (crosshairMarkerBorderColor.length !== 0) {
					return crosshairMarkerBorderColor;
				}
			}
		}

		return null;
	}

	private _markerBackgroundColor(index: TimePointIndex): string {
		switch (this._seriesType) {
			case 'Line':
			case 'Area':
			case 'Baseline': {
				const crosshairMarkerBackgroundColor = (this._options as (LineStyleOptions | AreaStyleOptions | BaselineStyleOptions)).crosshairMarkerBackgroundColor;
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
			const searchMode = timePointIndex < firstDataIndex ? MismatchDirection.NearestRight : MismatchDirection.NearestLeft;
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

			case 'Baseline': {
				this._paneView = new SeriesBaselinePaneView(this as Series<'Baseline'>, this.model());
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
