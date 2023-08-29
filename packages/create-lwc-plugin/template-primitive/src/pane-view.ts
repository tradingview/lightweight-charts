import { Coordinate, ISeriesPrimitivePaneView } from 'lightweight-charts';
import { _CLASSNAME_PaneRenderer } from './pane-renderer';
import { _CLASSNAME_DataSource } from './data-source';

export interface ViewPoint {
	x: Coordinate | null;
	y: Coordinate | null;
}

export class _CLASSNAME_PaneView implements ISeriesPrimitivePaneView {
	_source: _CLASSNAME_DataSource;
	_p1: ViewPoint = { x: null, y: null };
	_p2: ViewPoint = { x: null, y: null };

	constructor(source: _CLASSNAME_DataSource) {
		this._source = source;
	}

	update() {
		const series = this._source.series;
		const y1 = series.priceToCoordinate(this._source.p1.price);
		const y2 = series.priceToCoordinate(this._source.p2.price);
		const timeScale = this._source.chart.timeScale();
		const x1 = timeScale.timeToCoordinate(this._source.p1.time);
		const x2 = timeScale.timeToCoordinate(this._source.p2.time);
		this._p1 = { x: x1, y: y1 };
		this._p2 = { x: x2, y: y2 };
	}

	renderer() {
		return new _CLASSNAME_PaneRenderer(
			this._p1,
			this._p2,
			this._source.options.fillColor
		);
	}
}
