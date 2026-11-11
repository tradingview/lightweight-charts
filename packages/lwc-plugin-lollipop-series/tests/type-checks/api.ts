// Resolve the built exports map, as an npm consumer does; no src aliases.
import { createChart, type IChartApiBase, type Time, type CustomSeriesWhitespaceData } from 'lightweight-charts';
import { createLollipopSeries, LollipopSeries, defaultOptions, type LollipopData, type LollipopSeriesOptions } from '@tradingview/lwc-plugin-lollipop-series';
import { LollipopSeries as Standalone, createLollipopSeries as createStandalone } from '@tradingview/lwc-plugin-lollipop-series/standalone';
import { expectTrue, type Equal } from '../../../../tests/plugin-type-checks/assertions.js';

expectTrue<Equal<typeof LollipopSeries, typeof Standalone>>();
expectTrue<Equal<typeof createLollipopSeries, typeof createStandalone>>();
expectTrue<Equal<typeof defaultOptions, LollipopSeriesOptions>>();
const chart = createChart(document.createElement('div'));
const series = createLollipopSeries(chart, { base: 10, markerSize: 12 });
series.setData([{ time: '2024-01-01', value: 12, color: '#F23645' }, { time: '2024-01-02' }]);
series.update({ time: { year: 2024, month: 1, day: 3 }, value: -4 });
series.applyOptions({ lineWidth: 1, markerSize: 0, priceLineVisible: false });
expectTrue<Equal<ReturnType<typeof series.options>, Readonly<LollipopSeriesOptions>>>();
expectTrue<Equal<ReturnType<typeof series.data>[number], LollipopData<Time> | CustomSeriesWhitespaceData<Time>>>();
// @ts-expect-error Unknown series options must be rejected.
series.applyOptions({ nonexistentOption: true });
// @ts-expect-error The dot has no shape option: it is always a circle.
series.applyOptions({ dotShape: 'diamond' });
// @ts-expect-error A value is a number.
series.update({ time: '2024-01-04', value: '12' });

// The plain class still works with addCustomSeries.
const plain = chart.addCustomSeries(new LollipopSeries(), { base: 5 });
plain.setData([{ time: '2024-01-01', value: 12 }]);

// A custom horizontal scale and user data must survive inference.
type Category = { key: string };
declare const categoryChart: IChartApiBase<Category>;
interface TaggedPoint extends LollipopData<Category> { tag: string; }
const tagged = createLollipopSeries<Category, TaggedPoint>(categoryChart);
tagged.setData([{ time: { key: 'A' }, value: 1, tag: 'first' }]);
expectTrue<Equal<ReturnType<typeof tagged.data>[number], TaggedPoint | CustomSeriesWhitespaceData<Category>>>();
// @ts-expect-error A Time must not leak into a custom horizontal scale.
tagged.update({ time: '2024-01-01', value: 1, tag: 'wrong scale' });
