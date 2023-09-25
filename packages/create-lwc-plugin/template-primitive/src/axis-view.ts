import { Coordinate, ISeriesPrimitiveAxisView } from 'lightweight-charts';
import { Point, _CLASSNAME_DataSource } from './data-source';

abstract class _CLASSNAME_AxisView implements ISeriesPrimitiveAxisView {
	_source: _CLASSNAME_DataSource;
	_p: Point;
	_pos: Coordinate | null = null;
	constructor(source: _CLASSNAME_DataSource, p: Point) {
		this._source = source;
		this._p = p;
	}
	abstract update(): void;
	abstract text(): string;

	coordinate() {
		return this._pos ?? -1;
	}

	visible(): boolean {
		return this._source.options.showLabels;
	}

	tickVisible(): boolean {
		return this._source.options.showLabels;
	}

	textColor() {
		return this._source.options.labelTextColor;
	}
	backColor() {
		return this._source.options.labelColor;
	}
	movePoint(p: Point) {
		this._p = p;
		this.update();
	}
}

export class _CLASSNAME_TimeAxisView extends _CLASSNAME_AxisView {
	update() {
		const timeScale = this._source.chart.timeScale();
		this._pos = timeScale.timeToCoordinate(this._p.time);
	}
	text() {
		return this._source.options.timeLabelFormatter(this._p.time);
	}
}

export class _CLASSNAME_PriceAxisView extends _CLASSNAME_AxisView {
	update() {
		const series = this._source.series;
		this._pos = series.priceToCoordinate(this._p.price);
	}
	text() {
		return this._source.options.priceLabelFormatter(this._p.price);
	}
}
