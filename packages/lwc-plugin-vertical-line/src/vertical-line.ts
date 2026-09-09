import { cloneReadonly } from '@tradingview/lwc-toolkit/simple-clone';
import { paneContentElement } from '@tradingview/lwc-toolkit/dom/pane-element';
import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
	Coordinate,
	IChartApi,
	ISeriesApi,
	ISeriesPrimitiveAxisView,
	IPrimitivePaneRenderer,
	IPrimitivePaneView,
	Logical,
	PrimitiveHoveredItem,
	PrimitivePaneViewZOrder,
	SeriesAttachedParameter,
	SeriesType,
	Time,
} from 'lightweight-charts';
import { positionsLine } from '@tradingview/lwc-toolkit/dimensions/positions';
import { PluginBase } from '@tradingview/lwc-toolkit/plugin-base';
import { AxisLabelView } from '@tradingview/lwc-toolkit/axis-label-view';
import {
	setLineStyle,
	type LineStyle as ToolkitLineStyle,
} from '@tradingview/lwc-toolkit/line-style';
import { Delegate, ISubscription } from '@tradingview/lwc-toolkit/delegate';
import {
	VerticalLineBadgeOptions,
	VerticalLineOptions,
	defaultBadgeOptions,
	defaultOptions,
} from './options';
import { drawTextBadge } from './text-badge';

class VerticalLinePaneRenderer implements IPrimitivePaneRenderer {
	private _source: VerticalLine;

	public constructor(source: VerticalLine) {
		this._source = source;
	}

	public draw(target: CanvasRenderingTarget2D): void {
		const x = this._source.coordinate();
		if (x === null) {
			return;
		}
		const options = this._source.options();
		if (options.lineVisible) {
			target.useBitmapCoordinateSpace(scope => {
				const ctx = scope.context;
				const position = positionsLine(
					x,
					scope.horizontalPixelRatio,
					options.width
				);
				ctx.save();
				ctx.strokeStyle = options.color;
				ctx.lineWidth = position.length;
				// The library's `LineStyle` enum has the same values as the
				// toolkit's, which does not depend on the library.
				setLineStyle(ctx, options.lineStyle as unknown as ToolkitLineStyle);
				const centre = position.position + position.length / 2;
				ctx.beginPath();
				ctx.moveTo(centre, 0);
				ctx.lineTo(centre, scope.bitmapSize.height);
				ctx.stroke();
				ctx.restore();
			});
		}
		const badge = this._source.badgeOptions();
		if (badge !== null) {
			target.useMediaCoordinateSpace(scope => {
				drawTextBadge(
					scope.context,
					x,
					scope.mediaSize.width,
					scope.mediaSize.height,
					badge
				);
			});
		}
	}
}

class VerticalLinePaneView implements IPrimitivePaneView {
	private readonly _source: VerticalLine;
	private readonly _renderer: VerticalLinePaneRenderer;

	public constructor(source: VerticalLine) {
		this._source = source;
		this._renderer = new VerticalLinePaneRenderer(source);
	}

	public zOrder(): PrimitivePaneViewZOrder {
		return this._source.options().zOrder;
	}

	public renderer(): IPrimitivePaneRenderer {
		return this._renderer;
	}
}

export type {
	VerticalLineBadgeOptions,
	VerticalLineOptions,
	VerticalLineSnap,
	VertLineOptions,
} from './options';
export { defaultBadgeOptions, defaultOptions } from './options';

function isChartApi(value: unknown): value is IChartApi {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as IChartApi).timeScale === 'function'
	);
}

export class VerticalLine extends PluginBase {
	private readonly _paneViews: VerticalLinePaneView[];
	private readonly _timeAxisViews: AxisLabelView[];
	private readonly _timeChanged: Delegate<Time> = new Delegate();
	private _options: VerticalLineOptions;
	private _time: Time;
	private _x: Coordinate | null = null;
	private _dragging: boolean = false;
	private _pointerId: number | null = null;
	private _restoreHandlers: (() => void) | null = null;
	private _unsubscribers: (() => void)[] = [];

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
		this._time = (legacyForm ? args[2] : args[0]) as Time;
		const options = (legacyForm ? args[3] : args[1]) as
			| Partial<VerticalLineOptions>
			| undefined;
		this._options = { ...defaultOptions, ...options };
		this._paneViews = [new VerticalLinePaneView(this)];
		this._timeAxisViews = [
			new AxisLabelView({
				coordinate: () => this._x,
				text: () => this._labelText(),
				textColor: () => this._options.labelTextColor,
				backColor: () => this._options.labelBackgroundColor,
				visible: () => this._options.showLabel,
				tickVisible: () => this._options.tickVisible,
			}),
		];
	}

	public override attached(param: SeriesAttachedParameter<Time>): void {
		super.attached(param);
		this._updateCoordinate();
		this._subscribeDragHandlers();
	}

	public override detached(): void {
		this._endDrag();
		this._unsubscribeDragHandlers();
		super.detached();
	}

	/** The time the line is drawn at. */
	public time(): Time {
		return this._time;
	}

	/** Moves the line to another time. */
	public setTime(time: Time): void {
		if (time === this._time) {
			return;
		}
		this._time = time;
		this._updateCoordinate();
		this.requestUpdate();
		this._timeChanged.fire(time);
	}

	/** Fired whenever the line's time changes, including while it is dragged. */
	public timeChanged(): ISubscription<Time> {
		return this._timeChanged;
	}

	/** The line's current options. */
	public options(): Readonly<VerticalLineOptions> {
		return this._options;
	}

	/** Merges `options` into the line's options and redraws it. */
	public applyOptions(options: Partial<VerticalLineOptions>): void {
		const wasDraggable = this._options.draggable;
		this._options = { ...this._options, ...options };
		if (this._options.draggable !== wasDraggable) {
			this._unsubscribeDragHandlers();
			this._subscribeDragHandlers();
		}
		this._updateCoordinate();
		this.requestUpdate();
	}

	/** Horizontal position of the line, or `null` when its time is off scale. */
	public coordinate(): Coordinate | null {
		return this._x;
	}

	/** Badge options with the defaults filled in, or `null` for no badge. */
	public badgeOptions(): VerticalLineBadgeOptions | null {
		const badge = this._options.badge;
		if (badge === undefined || badge.text === '') {
			return null;
		}
		return { ...defaultBadgeOptions, ...badge };
	}

	public updateAllViews(): void {
		this._updateCoordinate();
	}

	public timeAxisViews(): ISeriesPrimitiveAxisView[] {
		return this._timeAxisViews;
	}

	public paneViews(): IPrimitivePaneView[] {
		return this._paneViews;
	}

	public hitTest(x: number, _y: number): PrimitiveHoveredItem | null {
		if (this._x === null || !this._options.lineVisible) {
			return null;
		}
		const halfWidth = this._options.width / 2;
		if (Math.abs(x - this._x) > halfWidth + this._options.hitTestTolerance) {
			return null;
		}
		return {
			externalId: this._options.id,
			zOrder: this._options.zOrder,
			cursorStyle: this._options.draggable ? 'ew-resize' : undefined,
		};
	}

	private _labelText(): string {
		if (this._options.labelText !== '') {
			return this._options.labelText;
		}
		if (this._options.labelFormatter !== undefined) {
			return this._options.labelFormatter(this._time);
		}
		return this._defaultLabelText();
	}

	// The chart's own time formatting, so that a label with no text of its own
	// reads like the time axis it sits on.
	private _defaultLabelText(): string {
		const behaviour = this.chart.horzBehaviour();
		return behaviour.formatHorzItem(
			behaviour.convertHorzItemToInternal(this._time)
		);
	}

	private _updateCoordinate(): void {
		const timeScale = this._chartOrNull()?.timeScale();
		if (timeScale === undefined) {
			this._x = null;
			return;
		}
		if (this._options.snap === 'exact') {
			this._x = timeScale.timeToCoordinate(this._time);
			return;
		}
		const index = timeScale.timeToIndex(this._time, true);
		this._x =
			index === null
				? null
				: timeScale.logicalToCoordinate(index as unknown as Logical);
	}

	// `PluginBase.chart` throws before the line is attached, and the views are
	// built in the constructor.
	private _chartOrNull(): IChartApi | null {
		try {
			return this.chart;
		} catch {
			return null;
		}
	}

	private _subscribeDragHandlers(): void {
		const chart = this._chartOrNull();
		if (chart === null || !this._options.draggable) {
			return;
		}
		const element = chart.chartElement();
		const add = <K extends keyof HTMLElementEventMap>(
			type: K,
			handler: (event: HTMLElementEventMap[K]) => void
		): void => {
			element.addEventListener(type, handler);
			this._unsubscribers.push(() =>
				element.removeEventListener(type, handler)
			);
		};
		add('pointerdown', this._onPointerDown);
		add('pointermove', this._onPointerMove);
		add('pointerup', this._onPointerUp);
		add('pointercancel', this._onPointerUp);
		add('pointerleave', this._onPointerUp);
	}

	private _unsubscribeDragHandlers(): void {
		this._endDrag();
		this._unsubscribers.forEach((unsubscribe: () => void) => unsubscribe());
		this._unsubscribers = [];
	}

	private _paneX(clientX: number): number | null {
		const chart = this._chartOrNull();
		if (chart === null) {
			return null;
		}
		const box = chart.chartElement().getBoundingClientRect();
		const x = clientX - box.left - chart.priceScale('left').width();
		if (x < 0 || x > chart.timeScale().width()) {
			return null;
		}
		return x;
	}

	private _onPointerDown = (event: PointerEvent): void => {
		if (this._x === null || this._dragging || !event.isPrimary || event.button !== 0) {
			return;
		}
		const element = paneContentElement(this.series.getPane());
		if (element === null) { return; }
		const box = element.getBoundingClientRect();
		if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) { return; }
		const x = this._paneX(event.clientX);
		const halfWidth = this._options.width / 2;
		if (
			x === null ||
			Math.abs(x - this._x) > halfWidth + this._options.hitTestTolerance
		) {
			return;
		}
		this._dragging = true;
		this._pointerId = event.pointerId;
		// The chart would otherwise pan under the pointer while the line moves.
		const chart = this.chart;
		const { handleScroll: scroll, handleScale: scale } = chart.options();
		const handleScroll = typeof scroll === 'boolean' ? scroll : cloneReadonly(scroll);
		const handleScale = typeof scale === 'boolean' ? scale : cloneReadonly(scale);
		chart.applyOptions({ handleScroll: false, handleScale: false });
		this._restoreHandlers = () => chart.applyOptions({ handleScroll, handleScale });
	};

	private _onPointerMove = (event: PointerEvent): void => {
		if (!this._dragging || event.pointerId !== this._pointerId) {
			return;
		}
		const x = this._paneX(event.clientX);
		if (x === null) {
			return;
		}
		const time = this.chart.timeScale().coordinateToTime(x);
		if (time !== null) {
			this.setTime(time);
		}
	};

	private _onPointerUp = (event: PointerEvent): void => {
		if (event.pointerId === this._pointerId) { this._endDrag(); }
	};

	private _endDrag(): void {
		this._dragging = false;
		this._pointerId = null;
		if (this._restoreHandlers !== null) {
			const restore = this._restoreHandlers;
			this._restoreHandlers = null;
			restore();
		}
	}
}

/** @deprecated Use VerticalLine. */
export const VertLine = VerticalLine;
/** @deprecated Use VerticalLine. */
export type VertLine = VerticalLine;
