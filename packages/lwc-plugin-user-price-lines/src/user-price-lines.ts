import {
	CrosshairMode,
	IChartApi,
	IPriceLine,
	IPrimitivePaneView,
	ISeriesApi,
	MouseEventParams,
	PrimitiveHoveredItem,
	SeriesAttachedParameter,
	SeriesType,
	Time,
} from 'lightweight-charts';
import { isChartRemoved, isSeriesAttached } from '@tradingview/lwc-toolkit/chart/lifecycle';
import { Delegate, ISubscription } from '@tradingview/lwc-toolkit/delegate';
import { mergeOptions } from '@tradingview/lwc-toolkit/options/merge';
import { PluginBase } from '@tradingview/lwc-toolkit/plugin-base';

import { ButtonPaneView, ButtonState } from './button';
import { BUTTON_WIDTH, SHOW_DISTANCE, buttonRect, isInRect, lineLimit } from './geometry';
import { UserPriceLinesOptions, defaultOptions } from './options';

export { defaultOptions, type UserPriceLinesOptions } from './options';

/** The `externalId` the add button reports through the chart's hit test. */
export const ADD_BUTTON_ID = 'user-price-lines-add';

/** Where the pointer shows the button: its y coordinate, and whether it is on the button. */
interface Pointer {
	y: number;
	hovered: boolean;
}

/** Gives every price line the plugins add an id of its own. */
let nextLineId = 0;

/**
 * The instances attached to series of each chart, in the order they were
 * attached. Within a pane, only the last of them shows its button and adds
 * lines, so two instances never both add a line for one click.
 */
const attachedInstances = new WeakMap<IChartApi, UserPriceLines[]>();

function isChartApi(value: unknown): value is IChartApi {
	return typeof value === 'object' && value !== null && typeof (value as IChartApi).subscribeClick === 'function';
}

/**
 * A button at the right edge of the pane that follows the pointer and adds a
 * price line to the series where it is clicked. Attach it with
 * `series.attachPrimitive(new UserPriceLines(options))`.
 */
export class UserPriceLines extends PluginBase {
	private _options: UserPriceLinesOptions;
	private _pointer: Pointer | null = null;
	/** The lines the plugin added and has not removed, oldest first. */
	private _lines: IPriceLine[] = [];
	private readonly _lineAdded = new Delegate<IPriceLine>();
	private readonly _lineRemoved = new Delegate<IPriceLine>();
	private readonly _paneViews: readonly IPrimitivePaneView[];
	/** The chart the plugin listens to, while it does. */
	private _listeningTo: IChartApi | null = null;
	/** The series the plugin is attached to, while it is. */
	private _attachedTo: ISeriesApi<SeriesType> | null = null;
	/**
	 * The crosshair mode the chart had before the plugin set it to `Normal`,
	 * while the plugin holds it there; `null` when it does not.
	 */
	private _previousCrosshairMode: CrosshairMode | null = null;
	/** Set while `detached` removes the lines, so that no handler adds one then. */
	private _detaching = false;

	/** Creates the button. Attach it to a series with `series.attachPrimitive(lines)`. */
	public constructor(options?: Partial<UserPriceLinesOptions>);
	/**
	 * @deprecated Pass the options only and attach the plugin to the series:
	 * `series.attachPrimitive(new UserPriceLines(options))`. This form, from
	 * the `plugin-examples` collection, attaches itself to `series`.
	 */
	public constructor(chart: IChartApi, series: ISeriesApi<SeriesType>, options?: Partial<UserPriceLinesOptions>);
	public constructor(...args: unknown[]) {
		super();
		const legacyForm = isChartApi(args[0]);
		this._options = mergeOptions(defaultOptions, legacyForm ? args[2] : args[0]);
		this._paneViews = [new ButtonPaneView(() => this._buttonState())];
		if (legacyForm) {
			(args[1] as ISeriesApi<SeriesType>).attachPrimitive(this);
		}
	}

	public override attached(param: SeriesAttachedParameter<Time>): void {
		// Attached to another series while still on one, the plugin moves:
		// it is detached from the first, which removes its lines there.
		const previous = this._attachedTo;
		if (previous !== null && previous !== param.series && this._livePane() !== null) {
			previous.detachPrimitive(this);
		}
		// Let go in case the plugin is attached again after its series was
		// removed from the chart, which does not call `detached`; the lines went
		// with that series.
		this._release();
		this._lines = [];
		super.attached(param);
		this._attachedTo = param.series;
		param.chart.subscribeCrosshairMove(this._onCrosshairMove);
		param.chart.subscribeClick(this._onClick);
		this._listeningTo = param.chart;
		const instances = attachedInstances.get(param.chart) ?? [];
		instances.push(this);
		attachedInstances.set(param.chart, instances);
		this._syncCrosshairMode();
	}

	/**
	 * Stops listening to the pointer, removes the price lines the plugin added,
	 * and puts back the crosshair mode it set.
	 */
	public override detached(): void {
		// Before letting go of the chart: the lines are only reached while the
		// plugin is live.
		this._detaching = true;
		try {
			if (this._livePane() !== null) {
				this.removeAll();
			}
		} finally {
			// Also when a `lineRemoved` handler throws.
			this._detaching = false;
			this._release();
			this._lines = [];
			this._attachedTo = null;
			super.detached();
		}
	}

	public paneViews(): readonly IPrimitivePaneView[] {
		return this._paneViews;
	}

	/**
	 * Reports the button to the chart's hit test wherever it shows under the
	 * pointer, so that the cursor becomes a pointer over it and pointer events
	 * report `ADD_BUTTON_ID` as the hovered object. It is worked out from the
	 * point, since the chart hit tests before it reports the pointer move, but
	 * only while the button shows: the chart also hit tests a crosshair placed
	 * by code, where no button is drawn.
	 */
	public hitTest(x: number, y: number): PrimitiveHoveredItem | null {
		if (this._pointer === null) {
			return null;
		}
		const pane = this._livePane();
		if (pane === null || !this._isActive(pane)) {
			return null;
		}
		const distance = this.chart.paneSize(pane).width - x;
		// No button shows where the series has no price, before it has data.
		if (distance < 0 || distance > BUTTON_WIDTH || this.series.coordinateToPrice(y) === null) {
			return null;
		}
		return { externalId: ADD_BUTTON_ID, zOrder: 'top', cursorStyle: 'pointer' };
	}

	/** The current options, with every default filled in. */
	public options(): Readonly<UserPriceLinesOptions> {
		return this._options;
	}

	/** Changes any subset of the options. An option left out is not changed. */
	public applyOptions(options: Partial<UserPriceLinesOptions>): void {
		this._options = mergeOptions(this._options, options);
		if (this._attachedTo !== null && this._livePane() !== null) {
			this._syncCrosshairMode();
			this._trimLines(0);
			this.requestUpdate();
		}
	}

	/**
	 * Adds a price line at `price` with the line options, and returns it. A
	 * click on the button does the same at the price under the pointer. At
	 * `maxLines`, the oldest line is removed first. Throws unless the plugin is
	 * attached to a series that is on a chart.
	 */
	public addLine(price: number): IPriceLine {
		this._seriesForNewLine();
		this._trimLines(1);
		// Read again: a `lineRemoved` handler may have detached the plugin.
		const series = this._seriesForNewLine();
		const line = series.createPriceLine({
			// `series.priceLines()` returns new objects on every call, so the
			// lines are recognized there by this id.
			id: `${ADD_BUTTON_ID}-${nextLineId++}`,
			price,
			color: this._options.lineColor,
			lineWidth: this._options.lineWidth,
			lineStyle: this._options.lineStyle,
			axisLabelVisible: this._options.axisLabelVisible,
		});
		this._lines.push(line);
		this._lineAdded.fire(line);
		return line;
	}

	/**
	 * Removes a price line the plugin added, and returns whether it did. A
	 * line it did not add, or one already removed, is left alone.
	 */
	public removeLine(line: IPriceLine): boolean {
		if (!this.lines().includes(line)) {
			return false;
		}
		this._removeTracked(line);
		return true;
	}

	/** Removes every price line the plugin added. */
	public removeAll(): void {
		for (const line of this.lines()) {
			this._removeTracked(line);
		}
	}

	/**
	 * The price lines the plugin added that are still on the series, oldest
	 * first. A line removed with `series.removePriceLine` is left out.
	 */
	public lines(): readonly IPriceLine[] {
		const series = this._attachedTo;
		if (series === null || this._livePane() === null) {
			return [];
		}
		const onSeries = new Set(series.priceLines().map((line: IPriceLine) => line.options().id));
		this._lines = this._lines.filter((line: IPriceLine) => onSeries.has(line.options().id));
		return [...this._lines];
	}

	/** Fires with each price line the plugin adds, by a click or by `addLine`. */
	public lineAdded(): ISubscription<IPriceLine> {
		return this._lineAdded;
	}

	/**
	 * Fires with each price line the plugin removes: by `removeLine` or
	 * `removeAll`, to stay within `maxLines`, or when it is detached.
	 */
	public lineRemoved(): ISubscription<IPriceLine> {
		return this._lineRemoved;
	}

	/**
	 * @deprecated Detach the plugin instead: `series.detachPrimitive(lines)`.
	 * Like detaching, this removes the price lines the plugin added. Once the
	 * chart or the series has been removed, it only lets go of the chart, and
	 * puts back the crosshair mode if the chart is still there.
	 */
	public remove(): void {
		const chart = this._listeningTo;
		const series = this._attachedTo;
		if (chart === null || series === null || isChartRemoved(chart) || !isSeriesAttached(chart, series)) {
			this._release();
			return;
		}
		series.detachPrimitive(this);
	}

	private readonly _onCrosshairMove = (param: MouseEventParams<Time>): void => {
		// The chart also reports moves with no pointer event behind them: after
		// `setCrosshairPosition`, on every data or time scale change. Those never
		// bring the button up, since the pointer is not there, but they still
		// move or hide a button that shows.
		if (param.sourceEvent === undefined && this._pointer === null) {
			return;
		}
		// With no button showing, a pointer away from the right edge of its pane
		// changes nothing, so the costlier checks below are skipped.
		if (this._pointer === null) {
			const point = param.point;
			if (point === undefined) {
				return;
			}
			if (param.paneIndex !== undefined && this.chart.paneSize(param.paneIndex).width - point.x > SHOW_DISTANCE) {
				return;
			}
		}
		const pane = this._livePane();
		if (pane === null) {
			return;
		}
		const pointer = this._isActive(pane) ? this._pointerAt(param, pane) : null;
		if (pointer?.y !== this._pointer?.y || pointer?.hovered !== this._pointer?.hovered) {
			this._pointer = pointer;
			this.requestUpdate();
		}
	};

	/**
	 * Adds a line when the click lands on the button where it is shown. A tap
	 * on a touch screen moves no crosshair, so with no button shown a tap adds
	 * nothing, and after a long press has brought the button up, only a tap on
	 * it does. The chart reports no click after a drag.
	 */
	private readonly _onClick = (param: MouseEventParams<Time>): void => {
		const shown = this._pointer;
		if (shown === null) {
			return;
		}
		const pane = this._livePane();
		const point = param.point;
		if (pane === null || point === undefined || !this._isActive(pane)) {
			return;
		}
		if (param.paneIndex !== undefined && param.paneIndex !== pane) {
			return;
		}
		if (!isInRect(buttonRect(this.chart.paneSize(pane).width, shown.y), point.x, point.y)) {
			return;
		}
		const price = this.series.coordinateToPrice(shown.y);
		if (price !== null) {
			this.addLine(price);
		}
	};

	/**
	 * The index of the plugin's pane while its series is on a chart that is
	 * still there, otherwise `null`. Neither `chart.removeSeries` nor
	 * `chart.remove` detaches a series' primitives, so once the plugin finds
	 * its series gone it lets go of the chart, rather than failing on every
	 * pointer event.
	 */
	private _livePane(): number | null {
		const chart = this._listeningTo;
		const series = this._attachedTo;
		if (chart !== null && series !== null && !isChartRemoved(chart) && isSeriesAttached(chart, series)) {
			return series.getPane().paneIndex();
		}
		this._release();
		return null;
	}

	/**
	 * Whether this is the instance attached last among those whose series are
	 * in `pane`, its own pane.
	 */
	private _isActive(pane: number): boolean {
		const instances = attachedInstances.get(this.chart) ?? [];
		for (let i = instances.length - 1; i >= 0; i--) {
			const other = instances[i];
			if (other === this) {
				return true;
			}
			if (other._livePane() === pane) {
				return false;
			}
		}
		return false;
	}

	/**
	 * Removes a line from the plugin's list and the series, and reports it,
	 * unless a `lineRemoved` handler has removed it already.
	 */
	private _removeTracked(line: IPriceLine): void {
		const index = this._lines.indexOf(line);
		if (index < 0) {
			return;
		}
		this._lines.splice(index, 1);
		this._attachedTo?.removePriceLine(line);
		this._lineRemoved.fire(line);
	}

	/** The series a new line goes on; throws unless the plugin is attached and live. */
	private _seriesForNewLine(): ISeriesApi<SeriesType> {
		const series = this._attachedTo;
		if (series === null || this._detaching || this._livePane() === null) {
			throw new Error('UserPriceLines: attach the plugin to a series on a chart before adding price lines');
		}
		return series;
	}

	/**
	 * Lets go of the chart: stops listening to it, hides the button, takes the
	 * plugin off the active list and puts back the crosshair mode. Safe to call
	 * more than once.
	 */
	private _release(): void {
		const chart = this._listeningTo;
		if (chart === null) {
			return;
		}
		this._listeningTo = null;
		this._pointer = null;
		chart.unsubscribeCrosshairMove(this._onCrosshairMove);
		chart.unsubscribeClick(this._onClick);
		const instances = attachedInstances.get(chart) ?? [];
		const index = instances.indexOf(this);
		if (index >= 0) {
			instances.splice(index, 1);
		}
		this._restoreCrosshairMode(chart, instances);
	}

	/** Sets the crosshair to `Normal` mode, or puts the previous mode back, as the option says. */
	private _syncCrosshairMode(): void {
		if (!this._options.setCrosshairMode) {
			this._restoreCrosshairMode(this.chart, (attachedInstances.get(this.chart) ?? []).filter(other => other !== this));
			return;
		}
		if (this._previousCrosshairMode === null) {
			this._previousCrosshairMode = this.chart.options().crosshair.mode;
			this.chart.applyOptions({ crosshair: { mode: CrosshairMode.Normal } });
		}
	}

	/**
	 * Puts back the crosshair mode the plugin set to `Normal`, if it is still
	 * `Normal`. While another instance on the chart holds the mode too, the
	 * mode stays, and that instance puts back the one from before both.
	 */
	private _restoreCrosshairMode(chart: IChartApi, others: readonly UserPriceLines[]): void {
		const previous = this._previousCrosshairMode;
		if (previous === null) {
			return;
		}
		this._previousCrosshairMode = null;
		const heir = others.find(other => other._previousCrosshairMode !== null);
		if (heir !== undefined) {
			if (heir._previousCrosshairMode === CrosshairMode.Normal) {
				heir._previousCrosshairMode = previous;
			}
			return;
		}
		if (!isChartRemoved(chart) && chart.options().crosshair.mode === CrosshairMode.Normal) {
			chart.applyOptions({ crosshair: { mode: previous } });
		}
	}

	/**
	 * Removes the oldest lines until `room` more fit within `maxLines`. The
	 * lines are counted again after each removal, since a `lineRemoved` handler
	 * can add one; there are at most as many removals as there were lines, so
	 * a handler that always adds one cannot make it loop forever.
	 */
	private _trimLines(room: number): void {
		const limit = lineLimit(this._options.maxLines);
		for (let tries = this.lines().length; tries > 0 && this.lines().length + room > limit; tries--) {
			this.removeLine(this.lines()[0]);
		}
	}

	/**
	 * Where the button is for a pointer event: only in the series' own pane,
	 * near its right edge, and where the series has a price.
	 */
	private _pointerAt(param: MouseEventParams<Time>, pane: number): Pointer | null {
		const point = param.point;
		if (point === undefined || (param.paneIndex !== undefined && param.paneIndex !== pane)) {
			return null;
		}
		const paneWidth = this.chart.paneSize(pane).width;
		const distance = paneWidth - point.x;
		if (distance < 0 || distance > SHOW_DISTANCE || this.series.coordinateToPrice(point.y) === null) {
			return null;
		}
		return { y: point.y, hovered: isInRect(buttonRect(paneWidth, point.y), point.x, point.y) };
	}

	/**
	 * The width of the series' pane. Not the time scale's, which is 0 while the
	 * time axis is hidden.
	 */
	private _paneWidth(): number {
		return this.chart.paneSize(this.series.getPane().paneIndex()).width;
	}

	private _buttonState(): ButtonState | null {
		const pointer = this._pointer;
		if (pointer === null || this._attachedTo === null) {
			return null;
		}
		const options = this._options;
		const background = pointer.hovered
			? options.hoverColor
			: options.buttonColor !== ''
				? options.buttonColor
				: this.chart.options().crosshair.horzLine.labelBackgroundColor;
		return { rect: buttonRect(this._paneWidth(), pointer.y), background };
	}
}
