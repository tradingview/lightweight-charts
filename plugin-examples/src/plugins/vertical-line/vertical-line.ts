import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
	Coordinate,
	IChartApi,
	ISeriesApi,
	ISeriesPrimitive,
	ISeriesPrimitiveAxisView,
	ISeriesPrimitivePaneRenderer,
	ISeriesPrimitivePaneView,
	SeriesOptionsMap,
	SeriesType,
	Time,
} from 'lightweight-charts';
import { positionsLine } from '../../helpers/dimensions/positions';

class VertLinePaneRenderer implements ISeriesPrimitivePaneRenderer {
	_x: Coordinate | null = null;
	_options: VertLineOptions;
	constructor(x: Coordinate | null, options: VertLineOptions) {
		this._x = x;
		this._options = options;
	}
	draw(target: CanvasRenderingTarget2D) {
		target.useBitmapCoordinateSpace(scope => {
			if (this._x === null) return;
			const ctx = scope.context;
			const position = positionsLine(
				this._x,
				scope.horizontalPixelRatio,
				this._options.width
			);
			ctx.fillStyle = this._options.color;
			ctx.fillRect(
				position.position,
				0,
				position.length,
				scope.bitmapSize.height
			);
		});
	}
}

class VertLinePaneView implements ISeriesPrimitivePaneView {
	_source: VertLine;
	_x: Coordinate | null = null;
	_options: VertLineOptions;

	constructor(source: VertLine, options: VertLineOptions) {
		this._source = source;
		this._options = options;
	}
	update() {
		const timeScale = this._source._chart.timeScale();
		this._x = timeScale.timeToCoordinate(this._source._time);
	}
	renderer() {
		return new VertLinePaneRenderer(this._x, this._options);
	}
}

class VertLineTimeAxisView implements ISeriesPrimitiveAxisView {
	_source: VertLine;
	_x: Coordinate | null = null;
	_options: VertLineOptions;

	constructor(source: VertLine, options: VertLineOptions) {
		this._source = source;
		this._options = options;
	}
	update() {
		const timeScale = this._source._chart.timeScale();
		this._x = timeScale.timeToCoordinate(this._source._time);
	}
	visible() {
		return this._options.showLabel;
	}
	tickVisible() {
		return this._options.showLabel;
	}
	coordinate() {
		return this._x ?? 0;
	}
	text() {
		return this._options.labelText;
	}
	textColor() {
		return this._options.labelTextColor;
	}
	backColor() {
		return this._options.labelBackgroundColor;
	}
}

export interface VertLineOptions {
	color: string;
	labelText: string;
	width: number;
	labelBackgroundColor: string;
	labelTextColor: string;
	showLabel: boolean;
}

const defaultOptions: VertLineOptions = {
	color: 'green',
	labelText: '',
	width: 3,
	labelBackgroundColor: 'green',
	labelTextColor: 'white',
	showLabel: false,
};

export class VertLine implements ISeriesPrimitive<Time> {
	_chart: IChartApi;
	_series: ISeriesApi<keyof SeriesOptionsMap>;
	_time: Time;
	_paneViews: VertLinePaneView[];
	_timeAxisViews: VertLineTimeAxisView[];

	constructor(
		chart: IChartApi,
		series: ISeriesApi<SeriesType>,
		time: Time,
		options?: Partial<VertLineOptions>
	) {
		const vertLineOptions: VertLineOptions = {
			...defaultOptions,
			...options,
		};
		this._chart = chart;
		this._series = series;
		this._time = time;
		this._paneViews = [new VertLinePaneView(this, vertLineOptions)];
		this._timeAxisViews = [new VertLineTimeAxisView(this, vertLineOptions)];
	}
	updateAllViews() {
		this._paneViews.forEach(pw => pw.update());
		this._timeAxisViews.forEach(tw => tw.update());
	}
	timeAxisViews() {
		return this._timeAxisViews;
	}
	paneViews() {
		return this._paneViews;
	}
}
