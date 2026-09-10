import {
	CustomData, CustomSeriesOptions, CustomSeriesWhitespaceData, DeepPartial,
	IChartApiBase, ICustomSeriesPaneView, ISeriesApi,
} from 'lightweight-charts';

import { AcceptedInput, GapCheck, whitespaceGapCheck } from './visible-bars.js';

/** A custom series API with the plugin's data and options preserved. */
export type OptionsAwareSeries<H, D extends CustomData<H>, O extends CustomSeriesOptions> =
	ISeriesApi<'Custom', H, D | CustomSeriesWhitespaceData<H>, O, DeepPartial<O>>;

/**
 * Creates a custom series whose price-value builder can read current options
 * before the first setData, including on LWC 5.0. The factory receives a getter
 * bound to the resulting series, rather than waiting for a renderer update.
 *
 * The returned API retains its identity in chart events. Its applyOptions
 * rebuilds stored plot values when one of priceOptions changes, preserving the
 * original data, whitespace, and custom fields. Other option changes do not
 * re-ingest data. A shallow copy of the input is retained because the host
 * data() API only exposes fulfilled points.
 * The view factory can read that accepted input, including whitespace, through
 * its second argument.
 */
export function createOptionsAwareSeries<H, D extends CustomData<H>, O extends CustomSeriesOptions>(
	chart: IChartApiBase<H>,
	createView: (
		readOptions: () => Readonly<O>,
		readInput: () => AcceptedInput<H, D>
	) => ICustomSeriesPaneView<H, D, O>,
	defaults: O,
	options: DeepPartial<O>,
	priceOptions: readonly (keyof O)[],
	paneIndex: number = 0
): OptionsAwareSeries<H, D, O> {
	type Point = D | CustomSeriesWhitespaceData<H>;
	// Kept sorted by the host's time key, in parallel, so that a streaming
	// update is a binary search and a read costs nothing. Renderers that need
	// explicit whitespace read the array itself and cache on the revision,
	// which only moves after an accepted mutation and before consumer
	// data-change callbacks.
	let keys: number[] = [];
	const input: { points: Point[]; revision: number } = { points: [], revision: 0 };
	const readInput = (): AcceptedInput<H, D> => input;
	// Position of `time` in `keys`, or where it would be inserted.
	const seek = (time: number): number => {
		let low = 0;
		let high = keys.length;
		while (low < high) {
			const mid = (low + high) >> 1;
			if (keys[mid] < time) { low = mid + 1; } else { high = mid; }
		}
		return low;
	};
	let series: OptionsAwareSeries<H, D, O> | undefined;
	const view = createView(() => series?.options() ?? defaults, readInput);
	series = chart.addCustomSeries(view, options, paneIndex);
	const api = series;
	const key = (point: Point): number => chart.horzBehaviour().key(point.time);
	const operations: { commit: (() => void) | null }[] = [];
	let refreshPending = false;
	const setData = api.setData.bind(api);
	const update = api.update.bind(api);
	const applyOptions = api.applyOptions.bind(api);

	const refresh = (): void => {
		if (!refreshPending || operations.length !== 0) { return; }
		refreshPending = false;
		if (input.points.length > 0) {
			// A copy: the retained array goes on being mutated in place.
			setData(input.points.slice());
		}
	};

	// Registered before consumer listeners: reaching this notification means the
	// host accepted the mutation, even if a later listener throws. Commit before
	// those listeners can perform nested writes (including from a pop callback).
	api.subscribeDataChanged(() => {
		const operation = operations[operations.length - 1];
		const commit = operation?.commit;
		if (commit) {
			operation.commit = null;
			commit();
			input.revision++;
		}
	});

	const changeData = <R>(commit: () => void, change: () => R): R => {
		operations.push({ commit });
		try {
			return change();
		} finally {
			operations.pop();
			refresh();
		}
	};

	api.setData = (data: Point[]): void => {
		const sorted = data.map(point => ({ time: key(point), point: { ...point } }))
			.sort((a, b) => a.time - b.time);
		changeData(() => {
			keys = sorted.map(entry => entry.time);
			input.points = sorted.map(entry => entry.point);
		}, () => setData(data));
	};

	api.update = (point: Point, historicalUpdate?: boolean): void => {
		const time = key(point);
		const next = { ...point };
		changeData(() => {
			const at = seek(time);
			if (keys[at] === time) {
				input.points[at] = next;
			} else {
				keys.splice(at, 0, time);
				input.points.splice(at, 0, next);
			}
		}, () => update(point, historicalUpdate));
	};

	// pop was added after the 5.0 peer floor. Preserve it on hosts that have it.
	const withPop = api as typeof api & { pop?: (count: number) => Point[] };
	const pop = withPop.pop?.bind(api);
	if (pop !== undefined) {
		withPop.pop = (count: number): Point[] => {
			// The host removes fulfilled points only; trailing whitespace remains.
			const removedKeys = count <= 0 ? [] : api.data().slice(-count).map(key);
			return changeData(() => {
				for (const time of removedKeys) {
					const at = seek(time);
					if (keys[at] === time) {
						keys.splice(at, 1);
						input.points.splice(at, 1);
					}
				}
			}, () => pop(count));
		};
	}

	api.applyOptions = (next: DeepPartial<O>): void => {
		const before = priceOptions.map(option => api.options()[option]);
		applyOptions(next);
		if (priceOptions.some((option, index) => api.options()[option] !== before[index])) {
			refreshPending = true;
			refresh();
		}
	};
	return api;
}

/**
 * Adds a series whose renderer can distinguish its whitespace from other
 * series' timestamps. The view factory also receives the options getter of
 * {@link createOptionsAwareSeries}, so a price-value builder can read options
 * the host has not handed to a renderer yet.
 */
export function createWhitespaceSeries<H, D extends CustomData<H>, O extends CustomSeriesOptions>(
	chart: IChartApiBase<H>,
	createView: (isGap: GapCheck<H, D>, readOptions: () => Readonly<O>) => ICustomSeriesPaneView<H, D, O>,
	defaults: O,
	options: DeepPartial<O>,
	priceOptions: readonly (keyof O)[] = [],
	paneIndex: number = 0
): OptionsAwareSeries<H, D, O> {
	return createOptionsAwareSeries(chart, (readOptions, readInput) => {
		let view: ICustomSeriesPaneView<H, D, O>;
		const isGap = whitespaceGapCheck(readInput, time => chart.timeScale().timeToIndex(time, false), point => view.isWhitespace(point));
		view = createView(isGap, readOptions);
		return view;
	}, defaults, options, priceOptions, paneIndex);
}
