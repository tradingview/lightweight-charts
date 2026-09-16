import { Coordinate } from 'lightweight-charts';
import { AxisLabelSource } from '@tradingview/lwc-toolkit/axis-label-view';
import { Point, _CLASSNAME_DataSource } from './data-source';

/**
 * What one axis label shows. The toolkit's AxisLabelView turns this into the
 * ISeriesPrimitiveAxisView the library expects, and hides the label whenever
 * coordinate() cannot resolve the point.
 */
abstract class _CLASSNAME_AxisLabelSource implements AxisLabelSource {
	protected _source: _CLASSNAME_DataSource;
	protected _p: Point;
	constructor(source: _CLASSNAME_DataSource, p: Point) {
		this._source = source;
		this._p = p;
	}
	//* The coordinate is read on demand, so there is no separate update step:
	//* return null whenever the point cannot be placed on the axis.
	abstract coordinate(): Coordinate | null;
	abstract text(): string;

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
	}
}

export class _CLASSNAME_TimeAxisLabelSource extends _CLASSNAME_AxisLabelSource {
	coordinate() {
		const timeScale = this._source.chart.timeScale();
		return timeScale.timeToCoordinate(this._p.time);
	}
	text() {
		return this._source.options.timeLabelFormatter(this._p.time);
	}
}

export class _CLASSNAME_PriceAxisLabelSource extends _CLASSNAME_AxisLabelSource {
	coordinate() {
		const series = this._source.series;
		return series.priceToCoordinate(this._p.price);
	}
	text() {
		return this._source.options.priceLabelFormatter(this._p.price);
	}
}
