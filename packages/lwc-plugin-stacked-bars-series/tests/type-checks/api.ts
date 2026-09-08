// Resolve the built exports map, as an npm consumer does; no src aliases.
import { createChart, type IChartApiBase, type Time, type CustomSeriesWhitespaceData } from 'lightweight-charts';
import { StackedBarsSeries, type StackedBarsData, type StackedBarsSeriesOptions } from '@tradingview/lwc-plugin-stacked-bars-series';
import { StackedBarsSeries as Standalone } from '@tradingview/lwc-plugin-stacked-bars-series/standalone';
import { expectTrue, type Equal } from '../../../../tests/plugin-type-checks/assertions.js';

expectTrue<Equal<typeof StackedBarsSeries, typeof Standalone>>();
const chart = createChart(document.createElement('div'));
const series = chart.addCustomSeries(new StackedBarsSeries());
series.setData([{ time: '2024-01-01', values: [10, -20] }, { time: '2024-01-02' }]);
series.update({ time: { year: 2024, month: 1, day: 3 }, values: [10, -20] });
series.applyOptions({ priceLineVisible: false });
expectTrue<Equal<ReturnType<typeof series.options>, Readonly<StackedBarsSeriesOptions>>>();
expectTrue<Equal<ReturnType<typeof series.data>[number], StackedBarsData<Time> | CustomSeriesWhitespaceData<Time>>>();
// @ts-expect-error Unknown series options must be rejected.
series.applyOptions({ nonexistentOption: true });
// @ts-expect-error An arbitrary object is not a Time.
series.update({ time: { key: 'A' }, values: [10, -20] });

// A custom horizontal scale and user data must survive addCustomSeries inference.
type Category = { key: string };
declare const categoryChart: IChartApiBase<Category>;
interface TaggedPoint extends StackedBarsData<Category> { tag: string; }
const tagged = categoryChart.addCustomSeries(new StackedBarsSeries<Category, TaggedPoint>());
tagged.setData([{ time: { key: 'A' }, values: [10, -20], tag: 'first' }]);
tagged.update({ time: { key: 'B' }, values: [10, -20], tag: 'second' });
expectTrue<Equal<ReturnType<typeof tagged.data>[number], TaggedPoint | CustomSeriesWhitespaceData<Category>>>();
// @ts-expect-error A Time must not leak into a custom horizontal scale.
tagged.update({ time: '2024-01-01', values: [10, -20], tag: 'wrong scale' });
// @ts-expect-error User-defined data fields keep their declared types.
tagged.update({ time: { key: 'A' }, values: [10, -20], tag: 123 });

// Options involved in the runtime regressions remain usable without casts.
series.applyOptions({ stackOrder: 'reverse', radius: 1, segmentBorderWidth: 4 });
// @ts-expect-error Invalid plugin-specific option values must be rejected.
series.applyOptions({ stackOrder: 'random' });
