// Resolve the built exports map, as an npm consumer does; no src aliases.
import { createChart, type IChartApiBase, type Time, type CustomSeriesWhitespaceData } from 'lightweight-charts';
import { PrettyHistogramSeries, type PrettyHistogramData, type PrettyHistogramSeriesOptions } from '@tradingview/lwc-plugin-pretty-histogram-series';
import { PrettyHistogramSeries as Standalone } from '@tradingview/lwc-plugin-pretty-histogram-series/standalone';
import { expectTrue, type Equal } from '../../../../tests/plugin-type-checks/assertions.js';

expectTrue<Equal<typeof PrettyHistogramSeries, typeof Standalone>>();
const chart = createChart(document.createElement('div'));
const series = chart.addCustomSeries(new PrettyHistogramSeries());
series.setData([{ time: '2024-01-01', value: 10 }, { time: '2024-01-02' }]);
series.update({ time: { year: 2024, month: 1, day: 3 }, value: 10 });
series.applyOptions({ priceLineVisible: false });
expectTrue<Equal<ReturnType<typeof series.options>, Readonly<PrettyHistogramSeriesOptions>>>();
expectTrue<Equal<ReturnType<typeof series.data>[number], PrettyHistogramData<Time> | CustomSeriesWhitespaceData<Time>>>();
// @ts-expect-error Unknown series options must be rejected.
series.applyOptions({ nonexistentOption: true });
// @ts-expect-error An arbitrary object is not a Time.
series.update({ time: { key: 'A' }, value: 10 });

// A custom horizontal scale and user data must survive addCustomSeries inference.
type Category = { key: string };
declare const categoryChart: IChartApiBase<Category>;
interface TaggedPoint extends PrettyHistogramData<Category> { tag: string; }
const tagged = categoryChart.addCustomSeries(new PrettyHistogramSeries<Category, TaggedPoint>());
tagged.setData([{ time: { key: 'A' }, value: 10, tag: 'first' }]);
tagged.update({ time: { key: 'B' }, value: 10, tag: 'second' });
expectTrue<Equal<ReturnType<typeof tagged.data>[number], TaggedPoint | CustomSeriesWhitespaceData<Category>>>();
// @ts-expect-error A Time must not leak into a custom horizontal scale.
tagged.update({ time: '2024-01-01', value: 10, tag: 'wrong scale' });
// @ts-expect-error User-defined data fields keep their declared types.
tagged.update({ time: { key: 'A' }, value: 10, tag: 123 });

// Options involved in the runtime regressions remain usable without casts.
series.applyOptions({ base: 100, radius: 1, borderWidth: 4 });
// @ts-expect-error Invalid plugin-specific option values must be rejected.
series.applyOptions({ base: '100' });
