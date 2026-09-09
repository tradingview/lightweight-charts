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
	let changingData = 0;
	let refreshPending = false;
	const setData = api.setData.bind(api);
	const update = api.update.bind(api);
	const applyOptions = api.applyOptions.bind(api);

	const refresh = (): void => {
		if (!refreshPending || changingData !== 0) { return; }
		refreshPending = false;
		if (input.size > 0) {
			// Sort by the host's time key, including custom horizontal scales.
			const data = [...input.entries()].sort(([a], [b]) => a - b).map(([, point]) => point);
			setData(data);
		}
	};

	api.setData = (data: Point[]): void => {
		const previous = input;
		input = new Map(data.map(point => [key(point), { ...point }]));
		changingData++;
		try {
			setData(data);
		} catch (error) {
			input = previous;
			throw error;
		} finally {
			changingData--;
			refresh();
		}
	};

	api.update = (point: Point, historicalUpdate?: boolean): void => {
		const time = key(point);
		const previous = input.get(time);
		input.set(time, { ...point });
		changingData++;
		try {
			update(point, historicalUpdate);
		} catch (error) {
			if (previous === undefined) { input.delete(time); } else { input.set(time, previous); }
			throw error;
		} finally {
			changingData--;
			refresh();
		}
	};

	// pop was added after the 5.0 peer floor. Preserve it on hosts that have it.
	const withPop = api as typeof api & { pop?: (count: number) => Point[] };
	const pop = withPop.pop?.bind(api);
	if (pop !== undefined) {
		withPop.pop = (count: number): Point[] => {
			changingData++;
			try {
				const removed = pop(count);
				for (const point of removed) { input.delete(key(point)); }
				return removed;
			} finally {
				changingData--;
				refresh();
			}
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
