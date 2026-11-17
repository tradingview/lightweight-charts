// Resolve the built exports map, as an npm consumer does; no src aliases.
import { createChart, type IChartApiBase, type Time, type CustomSeriesWhitespaceData } from 'lightweight-charts';
import { createGroupedBarsSeries, GroupedBarsSeries, defaultOptions, type GroupedBarsColumnWidthMode, type GroupedBarsData, type GroupedBarsSeriesOptions } from '@tradingview/lwc-plugin-grouped-bars-series';
import { GroupedBarsSeries as Standalone, createGroupedBarsSeries as createStandalone } from '@tradingview/lwc-plugin-grouped-bars-series/standalone';
import { expectTrue, type Equal } from '../../../../tests/plugin-type-checks/assertions.js';

expectTrue<Equal<typeof GroupedBarsSeries, typeof Standalone>>();
expectTrue<Equal<typeof createGroupedBarsSeries, typeof createStandalone>>();
expectTrue<Equal<typeof defaultOptions, GroupedBarsSeriesOptions>>();
const chart = createChart(document.createElement('div'));
const series = createGroupedBarsSeries(chart, { base: 10, columnWidthMode: 'percent', widthPercent: 60 });
expectTrue<Equal<GroupedBarsSeriesOptions['columnWidthMode'], GroupedBarsColumnWidthMode>>();
series.setData([{ time: '2024-01-01', values: [10, -20, 5], colors: [undefined, '#F23645'] }, { time: '2024-01-02' }]);
series.update({ time: { year: 2024, month: 1, day: 3 }, values: [1, null, 2] });
series.applyOptions({ colors: ['#2962FF'], priceLineVisible: false });
expectTrue<Equal<ReturnType<typeof series.options>, Readonly<GroupedBarsSeriesOptions>>>();
expectTrue<Equal<ReturnType<typeof series.data>[number], GroupedBarsData<Time> | CustomSeriesWhitespaceData<Time>>>();
// @ts-expect-error Unknown series options must be rejected.
series.applyOptions({ nonexistentOption: true });
// @ts-expect-error Only the two width modes are accepted.
series.applyOptions({ columnWidthMode: 'auto' });
// @ts-expect-error Values are numbers.
series.update({ time: '2024-01-04', values: ['12'] });

// The plain class still works with addCustomSeries.
const plain = chart.addCustomSeries(new GroupedBarsSeries(), { base: 5 });
plain.setData([{ time: '2024-01-01', values: [12, 3] }]);

// A custom horizontal scale and user data must survive inference.
type Category = { key: string };
declare const categoryChart: IChartApiBase<Category>;
interface TaggedPoint extends GroupedBarsData<Category> { tag: string; }
const tagged = createGroupedBarsSeries<Category, TaggedPoint>(categoryChart);
tagged.setData([{ time: { key: 'A' }, values: [1, 2], tag: 'first' }]);
expectTrue<Equal<ReturnType<typeof tagged.data>[number], TaggedPoint | CustomSeriesWhitespaceData<Category>>>();
// @ts-expect-error A Time must not leak into a custom horizontal scale.
tagged.update({ time: '2024-01-01', values: [1], tag: 'wrong scale' });
