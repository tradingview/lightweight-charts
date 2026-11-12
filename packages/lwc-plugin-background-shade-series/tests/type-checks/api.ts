// Resolve the built exports map, as an npm consumer does; no src aliases.
import { createChart, type IChartApiBase, type Time, type CustomSeriesWhitespaceData } from 'lightweight-charts';
import { createBackgroundShadeSeries, BackgroundShadeSeries, defaultOptions, type BackgroundShadeData, type BackgroundShadeSeriesOptions } from '@tradingview/lwc-plugin-background-shade-series';
import { BackgroundShadeSeries as Standalone, createBackgroundShadeSeries as createStandalone } from '@tradingview/lwc-plugin-background-shade-series/standalone';
import { expectTrue, type Equal } from '../../../../tests/plugin-type-checks/assertions.js';

expectTrue<Equal<typeof BackgroundShadeSeries, typeof Standalone>>();
expectTrue<Equal<typeof createBackgroundShadeSeries, typeof createStandalone>>();
expectTrue<Equal<typeof defaultOptions, BackgroundShadeSeriesOptions>>();
const chart = createChart(document.createElement('div'));
const series = createBackgroundShadeSeries(chart, { lowColor: '#F23645', highColor: 'teal', lowValue: 30, highValue: 70 });
series.setData([{ time: '2024-01-01', value: 12, color: '#131722' }, { time: '2024-01-02' }]);
series.update({ time: { year: 2024, month: 1, day: 3 }, value: 40 });
series.applyOptions({ opacity: 0.5 });
expectTrue<Equal<ReturnType<typeof series.options>, Readonly<BackgroundShadeSeriesOptions>>>();
expectTrue<Equal<ReturnType<typeof series.data>[number], BackgroundShadeData<Time> | CustomSeriesWhitespaceData<Time>>>();
// @ts-expect-error Unknown series options must be rejected.
series.applyOptions({ nonexistentOption: true });
// @ts-expect-error A value is a number.
series.update({ time: '2024-01-04', value: '12' });

// The plain class still works with addCustomSeries.
const plain = chart.addCustomSeries(new BackgroundShadeSeries(), { opacity: 0.2 });
plain.setData([{ time: '2024-01-01', value: 12 }]);

// A custom horizontal scale and user data must survive inference.
type Category = { key: string };
declare const categoryChart: IChartApiBase<Category>;
interface TaggedPoint extends BackgroundShadeData<Category> { tag: string; }
const tagged = createBackgroundShadeSeries<Category, TaggedPoint>(categoryChart);
tagged.setData([{ time: { key: 'A' }, value: 1, tag: 'first' }]);
expectTrue<Equal<ReturnType<typeof tagged.data>[number], TaggedPoint | CustomSeriesWhitespaceData<Category>>>();
// @ts-expect-error A Time must not leak into a custom horizontal scale.
tagged.update({ time: '2024-01-01', value: 1, tag: 'wrong scale' });
