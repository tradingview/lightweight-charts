// Resolve the built exports map, as an npm consumer does; no src aliases.
import { createChart, type IChartApiBase, type Time, type Logical, type CustomSeriesWhitespaceData } from 'lightweight-charts';
import { createBrushableAreaSeries, BrushableAreaSeries, BrushableAreaInteraction, type BrushableAreaData, type BrushableAreaSeriesOptions } from '@tradingview/lwc-plugin-brushable-area-series';
import { BrushableAreaSeries as Standalone } from '@tradingview/lwc-plugin-brushable-area-series/standalone';
import { expectTrue, type Equal } from '../../../../tests/plugin-type-checks/assertions.js';

expectTrue<Equal<typeof BrushableAreaSeries, typeof Standalone>>();
const chart = createChart(document.createElement('div'));
const series = createBrushableAreaSeries(chart);
series.setData([{ time: '2024-01-01', value: 10 }, { time: '2024-01-02' }]);
series.update({ time: { year: 2024, month: 1, day: 3 }, value: 10 });
series.applyOptions({ priceLineVisible: false });
expectTrue<Equal<ReturnType<typeof series.options>, Readonly<BrushableAreaSeriesOptions>>>();
expectTrue<Equal<ReturnType<typeof series.data>[number], BrushableAreaData<Time> | CustomSeriesWhitespaceData<Time>>>();
// @ts-expect-error Unknown series options must be rejected.
series.applyOptions({ nonexistentOption: true });
// @ts-expect-error An arbitrary object is not a Time.
series.update({ time: { key: 'A' }, value: 10 });

// A custom horizontal scale and user data must survive addCustomSeries inference.
type Category = { key: string };
declare const categoryChart: IChartApiBase<Category>;
interface TaggedPoint extends BrushableAreaData<Category> { tag: string; }
const tagged = createBrushableAreaSeries<Category, TaggedPoint>(categoryChart, {}, 1);
tagged.setData([{ time: { key: 'A' }, value: 10, tag: 'first' }]);
tagged.update({ time: { key: 'B' }, value: 10, tag: 'second' });
expectTrue<Equal<ReturnType<typeof tagged.data>[number], TaggedPoint | CustomSeriesWhitespaceData<Category>>>();
// @ts-expect-error A Time must not leak into a custom horizontal scale.
tagged.update({ time: '2024-01-01', value: 10, tag: 'wrong scale' });
// @ts-expect-error User-defined data fields keep their declared types.
tagged.update({ time: { key: 'A' }, value: 10, tag: 123 });

// Options involved in the runtime regressions remain usable without casts.
series.applyOptions({ brushRanges: [{ range: { from: 0, to: 2 }, style: { lineColor: 'red' } }] });
// @ts-expect-error Invalid plugin-specific option values must be rejected.
series.applyOptions({ lineWidth: 9 });

const brush = new BrushableAreaInteraction({ style: { lineColor: 'red' } });
series.attachPrimitive(brush);
brush.activeRange().subscribe(range => {
	if (range !== null) {
		expectTrue<Equal<typeof range.from, Logical>>();
		expectTrue<Equal<typeof range.fromTime, Time | null>>();
	}
});

// The low-level pane view remains available.
chart.addCustomSeries(new BrushableAreaSeries());
