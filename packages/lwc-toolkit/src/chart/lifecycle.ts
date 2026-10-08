import type { IChartApiBase, IPaneApi, ISeriesApi, SeriesType } from 'lightweight-charts';

/*
 A plugin that wraps a series or a chart behind an API of its own outlives
 neither: the host can call `chart.remove()`, or take the series off with
 `chart.removeSeries(series)`, without telling the plugin. These checks let it
 find out before it writes to them again. They only read the chart; what to do
 about it — release subscriptions, stop timers, report `null` — is the
 caller's decision, and is best not done from inside the chart's own event
 dispatch (see `scheduling/coalesced-task`).
 */

/**
 * Whether the chart was removed with `chart.remove()`. A removed chart has
 * no panes, while a live one always has at least one; should the chart throw
 * when asked, it is treated as removed. Once removed, a chart stays removed,
 * so a caller may remember a `true`.
 */
export function isChartRemoved<HorzScaleItem>(chart: IChartApiBase<HorzScaleItem>): boolean {
	try {
		return chart.panes().length === 0;
	} catch {
		return true;
	}
}

/**
 * Whether `series` is on `chart`, in any of its panes: `false` once the host
 * took it off with `chart.removeSeries`, and once the chart is removed.
 *
 * @param chart - the chart the series was added to.
 * @param series - the series API returned by `addSeries` or `addCustomSeries`.
 */
export function isSeriesAttached<HorzScaleItem>(
	chart: IChartApiBase<HorzScaleItem>,
	series: Pick<ISeriesApi<SeriesType, HorzScaleItem>, 'seriesType'>
): boolean {
	try {
		return chart.panes().some(
			(pane: IPaneApi<HorzScaleItem>) => pane.getSeries().indexOf(series as ISeriesApi<SeriesType, HorzScaleItem>) !== -1
		);
	} catch {
		return false;
	}
}
