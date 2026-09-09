import {
	CustomData, CustomSeriesOptions, CustomSeriesWhitespaceData, DeepPartial,
	IChartApiBase, ICustomSeriesPaneView, ISeriesApi,
} from 'lightweight-charts';

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
 */
export function createOptionsAwareSeries<H, D extends CustomData<H>, O extends CustomSeriesOptions>(
	chart: IChartApiBase<H>,
	createView: (readOptions: () => Readonly<O>) => ICustomSeriesPaneView<H, D, O>,
	defaults: O,
	options: DeepPartial<O>,
	priceOptions: readonly (keyof O)[],
	paneIndex: number = 0
): OptionsAwareSeries<H, D, O> {
	let series: OptionsAwareSeries<H, D, O> | undefined;
	const view = createView(() => series?.options() ?? defaults);
	series = chart.addCustomSeries(view, options, paneIndex);
	const api = series;
	type Point = D | CustomSeriesWhitespaceData<H>;
	const key = (point: Point): number => chart.horzBehaviour().key(point.time);
	let input = new Map<number, Point>();
	const operations: { commit: (() => void) | null }[] = [];
	let refreshPending = false;
	const setData = api.setData.bind(api);
	const update = api.update.bind(api);
	const applyOptions = api.applyOptions.bind(api);

	const refresh = (): void => {
		if (!refreshPending || operations.length !== 0) { return; }
		refreshPending = false;
		if (input.size > 0) {
			// Sort by the host's time key, including custom horizontal scales.
			const data = [...input.entries()].sort(([a], [b]) => a - b).map(([, point]) => point);
			setData(data);
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
		const next = new Map(data.map(point => [key(point), { ...point }]));
		changeData(() => { input = next; }, () => setData(data));
	};

	api.update = (point: Point, historicalUpdate?: boolean): void => {
		const time = key(point);
		const next = { ...point };
		changeData(() => { input.set(time, next); }, () => update(point, historicalUpdate));
	};

	// pop was added after the 5.0 peer floor. Preserve it on hosts that have it.
	const withPop = api as typeof api & { pop?: (count: number) => Point[] };
	const pop = withPop.pop?.bind(api);
	if (pop !== undefined) {
		withPop.pop = (count: number): Point[] => {
			// The host removes fulfilled points only; trailing whitespace remains.
			const removedKeys = count <= 0 ? [] : api.data().slice(-count).map(key);
			return changeData(() => {
				for (const time of removedKeys) { input.delete(time); }
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
