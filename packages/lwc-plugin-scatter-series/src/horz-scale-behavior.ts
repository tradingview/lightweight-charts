import type {
	ChartOptionsImpl,
	DataItem,
	HorzScaleItemConverterToInternalObj,
	IHorzScaleBehavior,
	InternalHorzScaleItem,
	InternalHorzScaleItemKey,
	LocalizationOptions,
	Mutable,
	SeriesDataItemTypeMap,
	SeriesType,
	TickMark,
	TickMarkWeightValue,
	TimeMark,
	TimeScalePoint,
} from 'lightweight-charts';

import { SlotGrid, TickLevel, fallbackTickWeight, formatXValue, tickWeight } from './x-axis';

/** How the X axis of a scatter chart is labelled, as its scatter series sets it. */
export interface ScatterXAxisState {
	/** The slot grid of the series; `null` without a series. */
	grid: SlotGrid | null;
	/** The label chain the slots are weighed with. */
	levels: readonly TickLevel[];
	/** Whether the two ends of the grid are labelled, and nothing else. */
	ends: boolean;
	/** Formats an X value; `null` for the default number formatting. */
	formatter: ((x: number) => string) | null;
}

/** The most decimals the default formatting prints without a grid. */
const FALLBACK_DECIMALS = 10;

const emptyState: ScatterXAxisState = { grid: null, levels: [], ends: false, formatter: null };

/*
 The state lives outside the class, so that the published typings of the
 behaviour show nothing but `IHorzScaleBehavior`: hosts pass an instance to
 `createChartEx`, the scatter series is the only one that talks to it.
 */
const states = new WeakMap<ScatterHorzScaleBehavior, ScatterXAxisState>();

/** The grid, the label chain and the formatter `behavior` labels the axis with. */
export function scatterXAxis(behavior: ScatterHorzScaleBehavior): Readonly<ScatterXAxisState> {
	return states.get(behavior) ?? emptyState;
}

/**
 * Sets the grid, the label chain and the formatter of the axis. The series
 * calls it before it sets the slots of a changed grid or chain, so the new
 * time points are weighed with them.
 */
export function setScatterXAxis(behavior: ScatterHorzScaleBehavior, state: ScatterXAxisState): void {
	states.set(behavior, state);
}

/** The scatter series a chart's axis belongs to. */
export interface ScatterXAxisOwner {
	/** Whether its underlying series is still on the chart. */
	attached(): boolean;
	/** Releases everything it holds. */
	remove(): void;
}

const owners = new WeakMap<ScatterHorzScaleBehavior, ScatterXAxisOwner>();

/**
 * Makes `owner` the scatter series of the chart of `behavior`. A chart takes
 * one scatter series: the axis is labelled from its grid. A previous owner
 * whose underlying series the host took off the chart itself (with
 * `chart.removeSeries`, not the scatter API's `remove()`) is released first.
 */
export function claimScatterXAxis(behavior: ScatterHorzScaleBehavior, owner: ScatterXAxisOwner): void {
	const current = owners.get(behavior);
	if (current !== undefined && current !== owner) {
		if (current.attached()) {
			throw new Error('This chart already has a scatter series: add the points to it, or remove() it first.');
		}
		current.remove();
	}
	owners.set(behavior, owner);
}

/** Releases the axis claimed by `owner` and forgets its grid. */
export function releaseScatterXAxis(behavior: ScatterHorzScaleBehavior, owner: ScatterXAxisOwner): void {
	if (owners.get(behavior) === owner) {
		owners.delete(behavior);
		states.delete(behavior);
	}
}

/** Formats an X value the way the axis of `state` labels it. */
export function formatScatterX(state: Readonly<ScatterXAxisState>, x: number): string {
	if (state.formatter !== null) {
		return state.formatter(x);
	}
	return formatXValue(x, state.grid !== null ? state.grid.decimals : FALLBACK_DECIMALS);
}

/**
 * Horizontal scale behaviour of a scatter chart: the horizontal items are
 * plain numbers (X values), labelled with nice, evenly spaced ticks.
 *
 * `createScatterChart` uses it; pass an instance to `createChartEx` to build a
 * scatter chart with options of your own. The scatter series added to the
 * chart decides the labels; without one the ticks fall back to a generic
 * 1-2-10 chain.
 *
 * For evenly spaced labels set `timeScale.uniformDistribution: true` (the
 * scatter chart defaults do).
 */
export class ScatterHorzScaleBehavior implements IHorzScaleBehavior<number> {
	// Not `#private`: the chart calls the behaviour it was given, which a host may have wrapped in a Proxy.
	private _options!: ChartOptionsImpl<number>;

	public options(): ChartOptionsImpl<number> {
		return this._options;
	}

	public setOptions(options: ChartOptionsImpl<number>): void {
		this._options = options;
	}

	public preprocessData(_data: DataItem<number> | DataItem<number>[]): void {}

	public updateFormatter(_options: LocalizationOptions<number>): void {}

	public createConverterToInternalObj(
		_data: SeriesDataItemTypeMap<number>[SeriesType][]
	): HorzScaleItemConverterToInternalObj<number> {
		return (x: number) => x as unknown as InternalHorzScaleItem;
	}

	public key(item: InternalHorzScaleItem | number): InternalHorzScaleItemKey {
		return item as unknown as InternalHorzScaleItemKey;
	}

	public cacheKey(item: InternalHorzScaleItem): number {
		return item as unknown as number;
	}

	public convertHorzItemToInternal(item: number): InternalHorzScaleItem {
		return item as unknown as InternalHorzScaleItem;
	}

	public formatHorzItem(item: InternalHorzScaleItem): string {
		return formatScatterX(scatterXAxis(this), item as unknown as number);
	}

	public formatTickmark(item: TickMark, _localizationOptions: LocalizationOptions<number>): string {
		return formatScatterX(scatterXAxis(this), item.time as unknown as number);
	}

	public maxTickMarkWeight(marks: TimeMark[]): TickMarkWeightValue {
		let max = marks[0].weight;
		for (const mark of marks) {
			if (mark.weight > max) {
				max = mark.weight;
			}
		}
		return max;
	}

	public fillWeightsForPoints(sortedTimePoints: readonly Mutable<TimeScalePoint>[], startIndex: number): void {
		const { grid, levels, ends } = scatterXAxis(this);
		for (let index = startIndex; index < sortedTimePoints.length; ++index) {
			const x = sortedTimePoints[index].time as unknown as number;
			sortedTimePoints[index].timeWeight = (
				grid !== null ? tickWeight(grid, levels, x, ends) : fallbackTickWeight(x)
			) as TickMarkWeightValue;
		}
	}
}

/** Whether a chart's horizontal scale behaviour is a {@link ScatterHorzScaleBehavior}. */
export function isScatterHorzScaleBehavior(behavior: unknown): behavior is ScatterHorzScaleBehavior {
	return behavior instanceof ScatterHorzScaleBehavior;
}
