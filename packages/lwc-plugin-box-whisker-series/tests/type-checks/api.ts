// Resolve the built exports map, as an npm consumer does; no src aliases.
import { createChart, type IChartApiBase, type Time, type CustomSeriesWhitespaceData } from 'lightweight-charts';
import { createBoxWhiskerSeries, BoxWhiskerSeries, defaultOptions, type BoxWhiskerData, type BoxWhiskerSeriesApi, type BoxWhiskerSeriesOptions } from '@tradingview/lwc-plugin-box-whisker-series';
import { BoxWhiskerSeries as Standalone, createBoxWhiskerSeries as createStandalone } from '@tradingview/lwc-plugin-box-whisker-series/standalone';
import { expectTrue, type Equal } from '../../../../tests/plugin-type-checks/assertions.js';

expectTrue<Equal<typeof BoxWhiskerSeries, typeof Standalone>>();
expectTrue<Equal<typeof createBoxWhiskerSeries, typeof createStandalone>>();
expectTrue<Equal<typeof defaultOptions, BoxWhiskerSeriesOptions>>();
expectTrue<Equal<BoxWhiskerData['median'], number>>();
const chart = createChart(document.createElement('div'));
const series = createBoxWhiskerSeries(chart, { whiskerColor: '#131722', medianColor: '#FFFFFF' });
expectTrue<Equal<typeof series, BoxWhiskerSeriesApi<Time, BoxWhiskerData<Time>>>>();
series.setData([
	{ time: '2024-01-01', min: 1, q1: 2, median: 3, q3: 4, max: 5, outliers: [0, 9] },
	{ time: '2024-01-02' },
	{ time: '2024-01-03', min: 1, q1: 2, median: 3, q3: 4, max: 5, lowerBoxColor: '#089981', medianColor: '#131722' },
]);
series.update({ time: { year: 2024, month: 1, day: 4 }, min: 1, q1: 2, median: 3, q3: 4, max: 5, outliers: null });
series.applyOptions({ outlierColor: '#F23645', lowerBoxColor: '#90BFF9', upperBoxColor: '#2962FF' });
expectTrue<Equal<ReturnType<typeof series.options>, Readonly<BoxWhiskerSeriesOptions>>>();
expectTrue<Equal<ReturnType<typeof series.data>[number], BoxWhiskerData<Time> | CustomSeriesWhitespaceData<Time>>>();
// @ts-expect-error Unknown series options must be rejected.
series.applyOptions({ nonexistentOption: true });
// @ts-expect-error The plugin-examples option names are gone.
series.applyOptions({ lowerQuartileFill: '#90BFF9' });
// A box plot has all five numbers. Checked on the data type: `update` also
// takes whitespace, which a point with only some of them passes for.
// @ts-expect-error The `max` is missing.
const missingMax: BoxWhiskerData = { time: '2024-01-05', min: 1, q1: 2, median: 3, q3: 4 };
void missingMax;

// The plain class still works with addCustomSeries.
const plain = chart.addCustomSeries(new BoxWhiskerSeries(), { upperBoxColor: '#2962FF' });
plain.setData([{ time: '2024-01-01', min: 1, q1: 2, median: 3, q3: 4, max: 5 }]);

// A custom horizontal scale and user data must survive inference.
type Category = { key: string };
declare const categoryChart: IChartApiBase<Category>;
interface TaggedPoint extends BoxWhiskerData<Category> { tag: string; }
const tagged = createBoxWhiskerSeries<Category, TaggedPoint>(categoryChart);
tagged.setData([{ time: { key: 'A' }, min: 1, q1: 2, median: 3, q3: 4, max: 5, tag: 'first' }]);
expectTrue<Equal<ReturnType<typeof tagged.data>[number], TaggedPoint | CustomSeriesWhitespaceData<Category>>>();
// @ts-expect-error A Time must not leak into a custom horizontal scale.
tagged.update({ time: '2024-01-01', min: 1, q1: 2, median: 3, q3: 4, max: 5, tag: 'wrong scale' });
