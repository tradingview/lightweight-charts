// Resolve the built exports map, as an npm consumer does; no src aliases.
import { createChart, type IChartApiBase, type Time, type CustomSeriesWhitespaceData } from 'lightweight-charts';
import { createDualRangeHistogramSeries, keepPixelSeriesInView, DualRangeHistogramSeries, type DualRangeHistogramData, type DualRangeHistogramSeriesOptions } from '@tradingview/lwc-plugin-dual-range-histogram-series';
import { DualRangeHistogramSeries as Standalone, createDualRangeHistogramSeries as createStandalone } from '@tradingview/lwc-plugin-dual-range-histogram-series/standalone';
import { expectTrue, type Equal } from '../../../../tests/plugin-type-checks/assertions.js';

expectTrue<Equal<typeof DualRangeHistogramSeries, typeof Standalone>>();
expectTrue<Equal<typeof createDualRangeHistogramSeries, typeof createStandalone>>();
const chart = createChart(document.createElement('div'));
const series = createDualRangeHistogramSeries(chart);
series.setData([{ time: '2024-01-01', values: [10, -20] }, { time: '2024-01-02' }]);
series.update({ time: { year: 2024, month: 1, day: 3 }, values: [10, -20] });
series.applyOptions({ priceLineVisible: false });
expectTrue<Equal<ReturnType<typeof series.options>, Readonly<DualRangeHistogramSeriesOptions>>>();
expectTrue<Equal<ReturnType<typeof series.data>[number], DualRangeHistogramData<Time> | CustomSeriesWhitespaceData<Time>>>();
// @ts-expect-error Unknown series options must be rejected.
series.applyOptions({ nonexistentOption: true });
// @ts-expect-error An arbitrary object is not a Time.
series.update({ time: { key: 'A' }, values: [10, -20] });

// A custom horizontal scale and user data must survive addCustomSeries inference.
type Category = { key: string };
declare const categoryChart: IChartApiBase<Category>;
interface TaggedPoint extends DualRangeHistogramData<Category> { tag: string; }
const tagged = createDualRangeHistogramSeries<Category, TaggedPoint>(categoryChart);
tagged.setData([{ time: { key: 'A' }, values: [10, -20], tag: 'first' }]);
tagged.update({ time: { key: 'B' }, values: [10, -20], tag: 'second' });
expectTrue<Equal<ReturnType<typeof tagged.data>[number], TaggedPoint | CustomSeriesWhitespaceData<Category>>>();
// @ts-expect-error A Time must not leak into a custom horizontal scale.
tagged.update({ time: '2024-01-01', values: [10, -20], tag: 'wrong scale' });
// @ts-expect-error User-defined data fields keep their declared types.
tagged.update({ time: { key: 'A' }, values: [10, -20], tag: 123 });

// Options involved in the runtime regressions remain usable without casts.
series.applyOptions({ baseValue: 50, scaleMode: 'price', borderRadius: { upOuter: 1 }, borderWidth: 4 });
// @ts-expect-error Invalid plugin-specific option values must be rejected.
series.applyOptions({ scaleMode: 'screen' });

keepPixelSeriesInView(chart, series)();
keepPixelSeriesInView(categoryChart, tagged, 100)();
