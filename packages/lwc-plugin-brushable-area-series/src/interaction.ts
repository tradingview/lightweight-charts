import {
	CustomData,
	DeepPartial,
	IRange,
	ISeriesApi,
	Logical,
	SeriesAttachedParameter,
	Time,
	WhitespaceData,
} from 'lightweight-charts';
import { PluginBase } from '@tradingview/lwc-toolkit/plugin-base';
import { Delegate, ISubscription } from '@tradingview/lwc-toolkit/delegate';
import { BrushableAreaSeriesOptions, BrushableAreaStyle } from './options';
import { MultiTouchChartEvents, MultiTouchInteraction } from './multi-touch';

// The series this primitive drives, typed with the plugin's own options so that
// `brushRanges` can be applied without casting the options object away.
type BrushableSeriesApi = ISeriesApi<
	'Custom',
	Time,
	CustomData<Time> | WhitespaceData<Time>,
	BrushableAreaSeriesOptions,
	DeepPartial<BrushableAreaSeriesOptions>
>;

/**
 * The brushed span, as logical indices and — where the series has a data point
 * at each end — as the times of those points.
 */
export interface BrushableAreaRange extends IRange<Logical> {
	/** Time of the data point at {@link BrushableAreaRange.from}, if any. */
	fromTime: Time | null;
	/** Time of the data point at {@link BrushableAreaRange.to}, if any. */
	toTime: Time | null;
}

export interface BrushableAreaInteractionOptions {
	/** Style applied to the brushed range. Merged over the series' base style. */
	style: Partial<BrushableAreaStyle>;
	/**
	 * Style applied outside the brushed range, for the usual effect of the
	 * selection staying vivid while the rest fades.
	 */
	outsideStyle: Partial<BrushableAreaStyle>;
	/**
	 * Set the series' `brushRanges` as the user drags. Turn it off to use the
	 * primitive purely as a source of {@link BrushableAreaInteraction.activeRange}
	 * events.
	 */
	applyToSeries: boolean;
	/** Smallest drag, in logical indices, that counts as a range. */
	minimumRangeWidth: number;
}

/** Values used for any interaction option left out. */
export const defaultInteractionOptions: BrushableAreaInteractionOptions = {
	style: {
		lineColor: 'rgb(4,153,129)',
		topColor: 'rgba(4,153,129, 0.4)',
		bottomColor: 'rgba(4,153,129, 0)',
	},
	outsideStyle: {
		lineColor: 'rgba(40,98,255, 0.2)',
		topColor: 'rgba(40,98,255, 0.05)',
	},
	applyToSeries: true,
	minimumRangeWidth: 1,
};

/**
 * Opt-in brush selection for a {@link BrushableAreaSeries}: attach it to the
 * series and a mouse drag, a one-finger drag or two fingers on the chart set
 * the series' `brushRanges` and report the selected span.
 *
 * ```js
 * const brush = new BrushableAreaInteraction();
 * series.attachPrimitive(brush);
 * brush.activeRange().subscribe(range => console.log(range));
 * ```
 *
 * The chart's own drag gestures compete with brushing, so charts using this
 * primitive normally set `handleScroll: false` and `handleScale: false`.
 */
export class BrushableAreaInteraction extends PluginBase {
	private readonly _activeRange: Delegate<BrushableAreaRange | null> =
		new Delegate();
	private _options: BrushableAreaInteractionOptions;
	private _events: MultiTouchChartEvents | null = null;
	private _range: BrushableAreaRange | null = null;
	private _gestureMadeRange: boolean = false;

	public constructor(options?: Partial<BrushableAreaInteractionOptions>) {
		super();
		this._options = { ...defaultInteractionOptions, ...options };
	}

	public override attached(param: SeriesAttachedParameter<Time>): void {
		super.attached(param);
		this._events = new MultiTouchChartEvents(this.chart);
		this._events.move().subscribe(this._onMove);
		this._events.end().subscribe(this._onEnd);
	}

	public override detached(): void {
		this._events?.destroy();
		this._events = null;
		super.detached();
	}

	/** The interaction's current options. */
	public options(): Readonly<BrushableAreaInteractionOptions> {
		return this._options;
	}

	/** Merges `options` into the interaction's options. */
	public applyOptions(
		options: Partial<BrushableAreaInteractionOptions>
	): void {
		this._options = { ...this._options, ...options };
	}

	/** Fired whenever the brushed range changes, with `null` once it is cleared. */
	public activeRange(): ISubscription<BrushableAreaRange | null> {
		return this._activeRange;
	}

	/** The brushed range, or `null` when there is no selection. */
	public range(): BrushableAreaRange | null {
		return this._range;
	}

	/** Clears the selection, as a click without a drag does. */
	public clear(): void {
		this._setRange(null);
	}

	private _onMove = (interaction: MultiTouchInteraction): void => {
		if (interaction.points.length < 2) {
			return;
		}
		const [first, last] = [
			interaction.points[0],
			interaction.points[interaction.points.length - 1],
		];
		const from = Math.min(first.index, last.index);
		const to = Math.max(first.index, last.index);
		if (to - from < this._options.minimumRangeWidth) {
			return;
		}
		this._gestureMadeRange = true;
		this._setRange({
			from: from as Logical,
			to: to as Logical,
			fromTime: this._timeAt(from),
			toTime: this._timeAt(to),
		});
	};

	private _onEnd = (): void => {
		// A click with no drag clears the selection, so that the same gesture
		// both makes and removes a range.
		if (!this._gestureMadeRange) {
			this._setRange(null);
		}
		this._gestureMadeRange = false;
	};

	private _timeAt(index: number): Time | null {
		const point = (this.series as BrushableSeriesApi).dataByIndex(
			index as Logical
		);
		return point === null ? null : point.time;
	}

	private _setRange(range: BrushableAreaRange | null): void {
		if (range === null && this._range === null) {
			return;
		}
		this._range = range;
		if (this._options.applyToSeries) {
			const series = this.series as BrushableSeriesApi;
			series.applyOptions(
				range === null
					? { brushRanges: [] }
					: {
							brushRanges: [
								{
									range: { from: range.from, to: range.to },
									style: this._options.style,
								},
							],
							outsideStyle: this._options.outsideStyle,
						}
			);
		}
		this._activeRange.fire(range);
	}
}
