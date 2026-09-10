import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
	Coordinate,
	IChartApi,
	ISeriesApi,
	ISeriesPrimitiveAxisView,
	IPrimitivePaneRenderer,
	IPrimitivePaneView,
	SeriesType,
	Time,
} from 'lightweight-charts';
import { positionsLine } from '@tradingview/lwc-toolkit/dimensions/positions';
import { PluginBase } from '@tradingview/lwc-toolkit/plugin-base';

class VerticalLinePaneRenderer implements IPrimitivePaneRenderer {
	private readonly _x: Coordinate | null;
	private readonly _options: VerticalLineOptions;

	public constructor(x: Coordinate | null, options: VerticalLineOptions) {
		this._x = x;
		this._options = options;
	}

	public draw(target: CanvasRenderingTarget2D) {
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

class VerticalLinePaneView implements IPrimitivePaneView {
	private readonly _source: VerticalLine;
	private readonly _time: Time;
	private readonly _options: VerticalLineOptions;
	private _x: Coordinate | null = null;

	public constructor(
		source: VerticalLine,
		time: Time,
		options: VerticalLineOptions
	) {
		this._source = source;
		this._time = time;
		this._options = options;
	}

	public update() {
		const timeScale = this._source.chart.timeScale();
		this._x = timeScale.timeToCoordinate(this._time);
	}

	public renderer() {
		return new VerticalLinePaneRenderer(this._x, this._options);
	}
}

class VerticalLineTimeAxisView implements ISeriesPrimitiveAxisView {
	private readonly _source: VerticalLine;
	private readonly _time: Time;
	private readonly _options: VerticalLineOptions;
	private _x: Coordinate | null = null;

	public constructor(
		source: VerticalLine,
		time: Time,
		options: VerticalLineOptions
	) {
		this._source = source;
		this._time = time;
		this._options = options;
	}

	public update() {
		const timeScale = this._source.chart.timeScale();
		this._x = timeScale.timeToCoordinate(this._time);
	}

	public visible() {
		return this._options.showLabel;
	}

	public tickVisible() {
		return this._options.showLabel;
	}

	public coordinate() {
		return this._x ?? 0;
	}

	public text() {
		return this._options.labelText;
	}

	public textColor() {
		return this._options.labelTextColor;
	}

	public backColor() {
		return this._options.labelBackgroundColor;
	}
}

export interface VerticalLineOptions {
	color: string;
	labelText: string;
	width: number;
	labelBackgroundColor: string;
	labelTextColor: string;
	showLabel: boolean;
}

/** @deprecated Use VerticalLineOptions. */
export type VertLineOptions = VerticalLineOptions;

/** Values used for any option not passed to the constructor. */
export const defaultOptions: VerticalLineOptions = {
	color: 'green',
	labelText: '',
	width: 3,
	labelBackgroundColor: 'green',
	labelTextColor: 'white',
	showLabel: false,
};

function isChartApi(value: unknown): value is IChartApi {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as IChartApi).timeScale === 'function'
	);
}

export class VerticalLine extends PluginBase {
	private readonly _paneViews: VerticalLinePaneView[];
	private readonly _timeAxisViews: VerticalLineTimeAxisView[];

	/**
	 * Creates a vertical line at the given time. Attach it to a series with
	 * `series.attachPrimitive(line)`.
	 */
	public constructor(time: Time, options?: Partial<VerticalLineOptions>);
	/**
	 * @deprecated Pass the time and the options only: `new VerticalLine(time, options)`.
	 * The chart and the series are taken from the series the line is attached to.
	 */
	public constructor(
		chart: IChartApi,
		series: ISeriesApi<SeriesType>,
		time: Time,
		options?: Partial<VerticalLineOptions>
	);
	public constructor(...args: unknown[]) {
		super();
		// The deprecated form passes the chart and the series first, and both are
		// ignored: PluginBase provides them once the line has been attached.
		const legacyForm = args.length > 2 || isChartApi(args[0]);
		const time = (legacyForm ? args[2] : args[0]) as Time;
		const options = (legacyForm ? args[3] : args[1]) as
			| Partial<VerticalLineOptions>
			| undefined;
		const lineOptions: VerticalLineOptions = {
			...defaultOptions,
			...options,
		};
		this._paneViews = [new VerticalLinePaneView(this, time, lineOptions)];
		this._timeAxisViews = [
			new VerticalLineTimeAxisView(this, time, lineOptions),
		];
	}

	public updateAllViews() {
		this._paneViews.forEach(pw => pw.update());
		this._timeAxisViews.forEach(tw => tw.update());
	}

	public timeAxisViews(): ISeriesPrimitiveAxisView[] {
		return this._timeAxisViews;
	}

	public paneViews(): IPrimitivePaneView[] {
		return this._paneViews;
	}
}

/** @deprecated Use VerticalLine. */
export const VertLine = VerticalLine;
/** @deprecated Use VerticalLine. */
export type VertLine = VerticalLine;
