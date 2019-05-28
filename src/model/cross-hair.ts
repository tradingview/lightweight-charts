import { ensureNotNull } from '../helpers/assertions';
import { notNull } from '../helpers/strict-type-checks';

import { LineStyle, LineWidth } from '../renderers/draw-line';
import { CrossHairMarksPaneView } from '../views/pane/cross-hair-marks-pane-view';
import { CrossHairPaneView } from '../views/pane/cross-hair-pane-view';
import { IPaneView } from '../views/pane/ipane-view';
import { CrossHairPriceAxisView } from '../views/price-axis/cross-hair-price-axis-view';
import { IPriceAxisView } from '../views/price-axis/iprice-axis-view';
import { PriceAxisView } from '../views/price-axis/price-axis-view';
import { CrossHairTimeAxisView } from '../views/time-axis/cross-hair-time-axis-view';
import { TimeAxisView } from '../views/time-axis/time-axis-view';

import { BarPrice } from './bar';
import { ChartModel } from './chart-model';
import { Coordinate } from './coordinate';
import { DataSource } from './data-source';
import { Pane } from './pane';
import { PriceScale } from './price-scale';
import { Series } from './series';
import { TimePoint, TimePointIndex } from './time-data';

export interface CrossHairPriceAndCoordinate {
	price: number;
	coordinate: number;
}

export interface CrossHairTimeAndCoordinate {
	time: TimePoint | null;
	coordinate: number;
}

export type PriceAndCoordinateProvider = (priceScale: PriceScale) => CrossHairPriceAndCoordinate;
export type TimeAndCoordinateProvider = () => CrossHairTimeAndCoordinate;

export interface CrossHairMovedEventParams {
	time: TimePoint | null;
	price: number;
}

export const enum CrossHairMode {
	Normal,
	Magnet,
}

export interface CrossHairLineOptions {
	color: string;
	width: LineWidth;
	style: LineStyle;
	visible: boolean;
	labelVisible: boolean;
}

export interface CrossHairOptions {
	mode: CrossHairMode;
	vertLine: CrossHairLineOptions;
	horzLine: CrossHairLineOptions;
}

type RawPriceProvider = () => BarPrice;
type RawCoordinateProvider = () => Coordinate;
type RawIndexProvider = () => TimePointIndex;

export class CrossHair extends DataSource {
	private _pane: Pane | null = null;
	private _price: number = NaN;
	private _index: TimePointIndex = 0 as TimePointIndex;
	private _visible: boolean = true;
	private readonly _model: ChartModel;
	private _priceAxisViews: Map<PriceScale, CrossHairPriceAxisView> = new Map();
	private readonly _timeAxisView: CrossHairTimeAxisView;
	private readonly _markersPaneView: CrossHairMarksPaneView;
	private _subscribed: boolean = false;
	private readonly _currentPosPriceProvider: PriceAndCoordinateProvider;
	private readonly _options: CrossHairOptions;
	private readonly _paneView: CrossHairPaneView;

	private _x: Coordinate = NaN as Coordinate;
	private _y: Coordinate = NaN as Coordinate;

	private _originX: Coordinate = NaN as Coordinate;
	private _originY: Coordinate = NaN as Coordinate;

	public constructor(model: ChartModel, options: CrossHairOptions) {
		super();
		this._model = model;
		this._options = options;
		this._markersPaneView = new CrossHairMarksPaneView(model, this);

		const valuePriceProvider = (rawPriceProvider: RawPriceProvider, rawCoordinateProvider: RawCoordinateProvider) => {
			return (priceScale: PriceScale) => {
				const coordinate = rawCoordinateProvider();
				const rawPrice = rawPriceProvider();
				if (priceScale === ensureNotNull(this._pane).defaultPriceScale()) {
					// price must be defined
					return { price: rawPrice, coordinate: coordinate };
				} else {
					// always convert from coordinate
					const mainSource = ensureNotNull(priceScale.mainSource());
					const firstValue = ensureNotNull(mainSource.firstValue());
					const price = priceScale.coordinateToPrice(coordinate, firstValue);
					return { price: price, coordinate: coordinate };
				}
			};
		};

		const valueTimeProvider = (rawIndexProvider: RawIndexProvider, rawCoordinateProvider: RawCoordinateProvider) => {
			return () => {
				return {
					time: this._model.timeScale().indexToUserTime(rawIndexProvider()),
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

		this._timeAxisView = new CrossHairTimeAxisView(this, model, currentPosTimeProvider);
		this._paneView = new CrossHairPaneView(this);
	}

	public index(): TimePointIndex {
		return this._index;
	}

	public options(): CrossHairOptions {
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

	public visible(): boolean {
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

	public paneViews(pane: Pane): IPaneView[] {
		return this._pane !== null ? [this._paneView, this._markersPaneView] : [];
	}

	public horzLineVisible(pane: Pane): boolean {
		return pane === this._pane && this._options.horzLine.visible;
	}

	public vertLineVisible(): boolean {
		return this._options.vertLine.visible;
	}

	public priceAxisViews(pane: Pane, priceScale: PriceScale): IPriceAxisView[] {
		if (!this._visible || this._pane !== pane) {
			this._priceAxisViews.clear();
		}

		const views = [];
		if (this._pane === pane) {
			views.push(this._createPriceAxisViewOnDemand(this._priceAxisViews, priceScale, this._currentPosPriceProvider));
		}

		return views;
	}

	public timeAxisViews(): ReadonlyArray<TimeAxisView> {
		return this._visible ? [this._timeAxisView] : [];
	}

	public pane(): Pane | null {
		return this._pane;
	}

	public updateAllViews(): void {
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

		const newPaneMainSource = newPane.mainDataSource();
		const newPaneMainSourceFirstValue = newPaneMainSource !== null ? newPaneMainSource.firstValue() : null;
		if (priceScale !== null && newPaneMainSourceFirstValue !== null) {
			this._pane = newPane;
			this._price = newPrice;
			this._y = priceScale.priceToCoordinate(newPrice, newPaneMainSourceFirstValue);
		} else {
			this._pane = null;
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

	private _createPriceAxisViewOnDemand(map: Map<PriceScale, CrossHairPriceAxisView>, priceScale: PriceScale, valueProvider: PriceAndCoordinateProvider): IPriceAxisView {
		let view = map.get(priceScale);

		if (view === undefined) {
			view = new CrossHairPriceAxisView(this, priceScale, valueProvider);
			map.set(priceScale, view);
		}

		return view;
	}
}
