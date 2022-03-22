import { ensureNotNull } from '../helpers/assertions';
import { notNull } from '../helpers/strict-type-checks';

import { LineStyle, LineWidth } from '../renderers/draw-line';
import { CrosshairMarksPaneView } from '../views/pane/crosshair-marks-pane-view';
import { CrosshairPaneView } from '../views/pane/crosshair-pane-view';
import { IPaneView } from '../views/pane/ipane-view';
import { CrosshairPriceAxisView } from '../views/price-axis/crosshair-price-axis-view';
import { IPriceAxisView } from '../views/price-axis/iprice-axis-view';
import { PriceAxisView } from '../views/price-axis/price-axis-view';
import { CrosshairTimeAxisView } from '../views/time-axis/crosshair-time-axis-view';
import { ITimeAxisView } from '../views/time-axis/itime-axis-view';

import { BarPrice } from './bar';
import { ChartModel } from './chart-model';
import { Coordinate } from './coordinate';
import { DataSource } from './data-source';
import { Pane } from './pane';
import { PriceScale } from './price-scale';
import { Series } from './series';
import { TimePoint, TimePointIndex } from './time-data';

export interface CrosshairPriceAndCoordinate {
	price: number;
	coordinate: number;
}

export interface CrosshairTimeAndCoordinate {
	time: TimePoint | null;
	coordinate: number;
}

export type PriceAndCoordinateProvider = (priceScale: PriceScale) => CrosshairPriceAndCoordinate;
export type TimeAndCoordinateProvider = () => CrosshairTimeAndCoordinate;

/**
 * Represents the crosshair mode.
 */
export const enum CrosshairMode {
	/**
	 * This mode allows crosshair to move freely on the chart.
	 */
	Normal,
	/**
	 * This mode sticks crosshair's horizontal line to the price value of a single-value series or to the close price of OHLC-based series.
	 */
	Magnet,
}

/** Structure describing a crosshair line (vertical or horizontal) */
export interface CrosshairLineOptions {
	/**
	 * Crosshair line color.
	 *
	 * @defaultValue `'#758696'`
	 */
	color: string;

	/**
	 * Crosshair line width.
	 *
	 * @defaultValue `1`
	 */
	width: LineWidth;

	/**
	 * Crosshair line style.
	 *
	 * @defaultValue {@link LineStyle.LargeDashed}
	 */
	style: LineStyle;

	/**
	 * Display the crosshair line.
	 *
	 * Note that disabling crosshair lines does not disable crosshair marker on Line and Area series.
	 * It can be disabled by using `crosshairMarkerVisible` option of a relevant series.
	 *
	 * @see {@link LineStyleOptions.crosshairMarkerVisible}
	 * @see {@link AreaStyleOptions.crosshairMarkerVisible}
	 * @see {@link BaselineStyleOptions.crosshairMarkerVisible}
	 * @defaultValue `true`
	 */
	visible: boolean;

	/**
	 * Display the crosshair label on the relevant scale.
	 *
	 * @defaultValue `true`
	 */
	labelVisible: boolean;

	/**
	 * Crosshair label background color.
	 *
	 * @defaultValue `'#4c525e'`
	 */
	labelBackgroundColor: string;
}

/** Structure describing crosshair options  */
export interface CrosshairOptions {
	/**
	 * Crosshair mode
	 *
	 * @defaultValue {@link CrosshairMode.Magnet}
	 */
	mode: CrosshairMode;

	/**
	 * Vertical line options.
	 */
	vertLine: CrosshairLineOptions;

	/**
	 * Horizontal line options.
	 */
	horzLine: CrosshairLineOptions;
}

type RawPriceProvider = () => BarPrice;
type RawCoordinateProvider = () => Coordinate;
type RawIndexProvider = () => TimePointIndex;

export class Crosshair extends DataSource {
	private _pane: Pane | null = null;
	private _price: number = NaN;
	private _index: TimePointIndex = 0 as TimePointIndex;
	private _visible: boolean = true;
	private readonly _model: ChartModel;
	private _priceAxisViews: Map<PriceScale, CrosshairPriceAxisView> = new Map();
	private readonly _timeAxisView: CrosshairTimeAxisView;
	private readonly _markersPaneView: CrosshairMarksPaneView;
	private _subscribed: boolean = false;
	private readonly _currentPosPriceProvider: PriceAndCoordinateProvider;
	private readonly _options: CrosshairOptions;
	private readonly _paneView: CrosshairPaneView;

	private _x: Coordinate = NaN as Coordinate;
	private _y: Coordinate = NaN as Coordinate;

	private _originX: Coordinate = NaN as Coordinate;
	private _originY: Coordinate = NaN as Coordinate;

	public constructor(model: ChartModel, options: CrosshairOptions) {
		super();
		this._model = model;
		this._options = options;
		this._markersPaneView = new CrosshairMarksPaneView(model, this);

		const valuePriceProvider = (rawPriceProvider: RawPriceProvider, rawCoordinateProvider: RawCoordinateProvider) => {
			return (priceScale: PriceScale) => {
				const coordinate = rawCoordinateProvider();
				const rawPrice = rawPriceProvider();
				if (priceScale === ensureNotNull(this._pane).defaultPriceScale()) {
					// price must be defined
					return { price: rawPrice, coordinate: coordinate };
				} else {
					// always convert from coordinate
					const firstValue = ensureNotNull(priceScale.firstValue());
					const price = priceScale.coordinateToPrice(coordinate, firstValue);
					return { price: price, coordinate: coordinate };
				}
			};
		};

		const valueTimeProvider = (rawIndexProvider: RawIndexProvider, rawCoordinateProvider: RawCoordinateProvider) => {
			return () => {
				return {
					time: this._model.timeScale().indexToTime(rawIndexProvider()),
					coordinate: rawCoordinateProvider(),
				};
			};
		};

		// for current position always return both price and coordinate
		this._currentPosPriceProvider = valuePriceProvider(
			() => this._price as BarPrice,
			() => this._y
		);

		const currentPosTimeProvider = valueTimeProvider(
			() => this._index,
			() => this.appliedX()
		);

		this._timeAxisView = new CrosshairTimeAxisView(this, model, currentPosTimeProvider);
		this._paneView = new CrosshairPaneView(this);
	}

	public options(): Readonly<CrosshairOptions> {
		return this._options;
	}

	public saveOriginCoord(x: Coordinate, y: Coordinate): void {
		this._originX = x;
		this._originY = y;
	}

	public clearOriginCoord(): void {
		this._originX = NaN as Coordinate;
		this._originY = NaN as Coordinate;
	}

	public originCoordX(): Coordinate {
		return this._originX;
	}

	public originCoordY(): Coordinate {
		return this._originY;
	}

	public setPosition(index: TimePointIndex, price: number, pane: Pane): void {
		if (!this._subscribed) {
			this._subscribed = true;
		}

		this._visible = true;

		this._tryToUpdateViews(index, price, pane);
	}

	public appliedIndex(): TimePointIndex {
		return this._index;
	}

	public appliedX(): Coordinate {
		return this._x;
	}

	public appliedY(): Coordinate {
		return this._y;
	}

	public override visible(): boolean {
		return this._visible;
	}

	public clearPosition(): void {
		this._visible = false;
		this._setIndexToLastSeriesBarIndex();

		this._price = NaN;
		this._x = NaN as Coordinate;
		this._y = NaN as Coordinate;
		this._pane = null;

		this.clearOriginCoord();
	}

	public paneViews(pane: Pane): readonly IPaneView[] {
		return this._pane !== null ? [this._paneView, this._markersPaneView] : [];
	}

	public horzLineVisible(pane: Pane): boolean {
		return pane === this._pane && this._options.horzLine.visible;
	}

	public vertLineVisible(): boolean {
		return this._options.vertLine.visible;
	}

	public override priceAxisViews(pane: Pane, priceScale: PriceScale): IPriceAxisView[] {
		if (!this._visible || this._pane !== pane) {
			this._priceAxisViews.clear();
		}

		const views: IPriceAxisView[] = [];
		if (this._pane === pane) {
			views.push(this._createPriceAxisViewOnDemand(this._priceAxisViews, priceScale, this._currentPosPriceProvider));
		}

		return views;
	}

	public override timeAxisViews(): readonly ITimeAxisView[] {
		return this._visible ? [this._timeAxisView] : [];
	}

	public pane(): Pane | null {
		return this._pane;
	}

	public updateAllViews(): void {
		this._paneView.update();
		this._priceAxisViews.forEach((value: PriceAxisView) => value.update());
		this._timeAxisView.update();
		this._markersPaneView.update();
	}

	private _priceScaleByPane(pane: Pane): PriceScale | null {
		if (pane && !pane.defaultPriceScale().isEmpty()) {
			return pane.defaultPriceScale();
		}

		return null;
	}

	private _tryToUpdateViews(index: TimePointIndex, price: number, pane: Pane): void {
		if (this._tryToUpdateData(index, price, pane)) {
			this.updateAllViews();
		}
	}

	private _tryToUpdateData(newIndex: TimePointIndex, newPrice: number, newPane: Pane): boolean {
		const oldX = this._x;
		const oldY = this._y;
		const oldPrice = this._price;
		const oldIndex = this._index;
		const oldPane = this._pane;
		const priceScale = this._priceScaleByPane(newPane);

		this._index = newIndex;
		this._x = isNaN(newIndex) ? NaN as Coordinate : this._model.timeScale().indexToCoordinate(newIndex);
		this._pane = newPane;

		const firstValue = priceScale !== null ? priceScale.firstValue() : null;
		if (priceScale !== null && firstValue !== null) {
			this._price = newPrice;
			this._y = priceScale.priceToCoordinate(newPrice, firstValue);
		} else {
			this._price = NaN;
			this._y = NaN as Coordinate;
		}

		return (oldX !== this._x || oldY !== this._y || oldIndex !== this._index ||
			oldPrice !== this._price || oldPane !== this._pane);
	}

	private _setIndexToLastSeriesBarIndex(): void {
		const lastIndexes = this._model.serieses()
			.map((s: Series) => s.bars().lastIndex())
			.filter(notNull);
		const lastBarIndex = (lastIndexes.length === 0) ? null : (Math.max(...lastIndexes) as TimePointIndex);
		this._index = lastBarIndex !== null ? lastBarIndex : NaN as TimePointIndex;
	}

	private _createPriceAxisViewOnDemand(map: Map<PriceScale, CrosshairPriceAxisView>, priceScale: PriceScale, valueProvider: PriceAndCoordinateProvider): IPriceAxisView {
		let view = map.get(priceScale);

		if (view === undefined) {
			view = new CrosshairPriceAxisView(this, priceScale, valueProvider);
			map.set(priceScale, view);
		}

		return view;
	}
}
