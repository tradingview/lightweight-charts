// Resolve the built exports map, as an npm consumer does; no src aliases.
import { createChart, type IChartApiBase, type Time, type CustomSeriesWhitespaceData } from 'lightweight-charts';
import { createStackedAreaSeries, StackedAreaSeries, type StackedAreaData, type StackedAreaSeriesOptions } from '@tradingview/lwc-plugin-stacked-area-series';
import { StackedAreaSeries as Standalone } from '@tradingview/lwc-plugin-stacked-area-series/standalone';
import { expectTrue, type Equal } from '../../../../tests/plugin-type-checks/assertions.js';

expectTrue<Equal<typeof StackedAreaSeries, typeof Standalone>>();
const chart = createChart(document.createElement('div'));
const series = createStackedAreaSeries(chart);
series.setData([{ time: '2024-01-01', values: [10, -20] }, { time: '2024-01-02' }]);
series.update({ time: { year: 2024, month: 1, day: 3 }, values: [10, -20] });
series.applyOptions({ priceLineVisible: false });
expectTrue<Equal<ReturnType<typeof series.options>, Readonly<StackedAreaSeriesOptions>>>();
expectTrue<Equal<ReturnType<typeof series.data>[number], StackedAreaData<Time> | CustomSeriesWhitespaceData<Time>>>();
// @ts-expect-error Unknown series options must be rejected.
series.applyOptions({ nonexistentOption: true });
// @ts-expect-error An arbitrary object is not a Time.
series.update({ time: { key: 'A' }, values: [10, -20] });

// A custom horizontal scale and user data must survive addCustomSeries inference.
type Category = { key: string };
declare const categoryChart: IChartApiBase<Category>;
interface TaggedPoint extends StackedAreaData<Category> { tag: string; }
const tagged = createStackedAreaSeries<Category, TaggedPoint>(categoryChart, {}, 1);
tagged.setData([{ time: { key: 'A' }, values: [10, -20], tag: 'first' }]);
tagged.update({ time: { key: 'B' }, values: [10, -20], tag: 'second' });
expectTrue<Equal<ReturnType<typeof tagged.data>[number], TaggedPoint | CustomSeriesWhitespaceData<Category>>>();
// @ts-expect-error A Time must not leak into a custom horizontal scale.
tagged.update({ time: '2024-01-01', values: [10, -20], tag: 'wrong scale' });
// @ts-expect-error User-defined data fields keep their declared types.
tagged.update({ time: { key: 'A' }, values: [10, -20], tag: 123 });

// Options involved in the runtime regressions remain usable without casts.
series.applyOptions({ colors: [{ line: 'red', area: 'green' }], lineVisible: false });
// @ts-expect-error Invalid plugin-specific option values must be rejected.
series.applyOptions({ colors: [42] });

// The low-level pane view remains available.
chart.addCustomSeries(new StackedAreaSeries());
