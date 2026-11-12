// Resolve the built exports map, as an npm consumer does; no src aliases.
import { createChart, type IChartApiBase, type Time, type CustomSeriesWhitespaceData } from 'lightweight-charts';
import {
	createColorScale,
	createHeatmapSeries,
	HeatmapSeries,
	defaultOptions,
	type ColorScaleOptions,
	type HeatmapAmountRange,
	type HeatmapCell,
	type HeatmapCellShader,
	type HeatmapData,
	type HeatmapSeriesApi,
	type HeatmapSeriesOptions,
} from '@tradingview/lwc-plugin-heatmap-series';
import { HeatmapSeries as Standalone, createColorScale as createScaleStandalone, createHeatmapSeries as createStandalone } from '@tradingview/lwc-plugin-heatmap-series/standalone';
import { expectTrue, type Equal } from '../../../../tests/plugin-type-checks/assertions.js';

expectTrue<Equal<typeof HeatmapSeries, typeof Standalone>>();
expectTrue<Equal<typeof createHeatmapSeries, typeof createStandalone>>();
expectTrue<Equal<typeof createColorScale, typeof createScaleStandalone>>();
expectTrue<Equal<typeof defaultOptions, HeatmapSeriesOptions>>();
expectTrue<Equal<HeatmapSeriesOptions['cellShader'], HeatmapCellShader>>();
expectTrue<Equal<HeatmapCellShader, (amount: number, range: HeatmapAmountRange) => string>>();
expectTrue<Equal<HeatmapSeriesOptions['lastValueVisible'], boolean>>();
expectTrue<Equal<HeatmapSeriesOptions['priceLineVisible'], boolean>>();
expectTrue<Equal<HeatmapSeriesOptions['cellGap'], number>>();
expectTrue<Equal<ReturnType<typeof createColorScale>, HeatmapCellShader>>();
expectTrue<Equal<ColorScaleOptions['domain'], readonly [number, number] | undefined>>();
expectTrue<Equal<HeatmapData['cells'], readonly (HeatmapCell | null)[]>>();
const chart = createChart(document.createElement('div'));
// An inline shader gets its parameters typed, at creation and in applyOptions.
const series = createHeatmapSeries(chart, { cellShader: (amount, range) => `rgba(0, 0, 255, ${(amount / range.max).toFixed(2)})`, cellGap: 0 });
series.applyOptions({ cellShader: amount => (amount > 50 ? 'red' : 'blue'), lastValueVisible: true, priceLineVisible: true });
series.applyOptions({ cellShader: createColorScale({ stops: ['#2962FF', '#F23645'], domain: [0, 100], steps: 16 }) });
expectTrue<Equal<typeof series, HeatmapSeriesApi>>();
series.setData([{ time: '2024-01-01', cells: [{ low: 0, high: 10, amount: 5 }, null] }, { time: '2024-01-02' }]);
series.update({ time: { year: 2024, month: 1, day: 3 }, cells: [] });
expectTrue<Equal<ReturnType<typeof series.options>, Readonly<HeatmapSeriesOptions>>>();
expectTrue<Equal<ReturnType<typeof series.data>[number], HeatmapData<Time> | CustomSeriesWhitespaceData<Time>>>();
// @ts-expect-error Unknown series options must be rejected.
series.applyOptions({ nonexistentOption: true });
// @ts-expect-error A shader returns a color string.
series.applyOptions({ cellShader: (amount: number) => amount });
// @ts-expect-error A cell has a low, a high and an amount.
series.update({ time: '2024-01-04', cells: [{ low: 0, high: 10 }] });
// @ts-expect-error A domain is two numbers.
createColorScale({ stops: ['#000000'], domain: [0] });

// The plain class still works with addCustomSeries.
const plain = chart.addCustomSeries(new HeatmapSeries(), { cellBorderColor: '#FFFFFF' });
plain.setData([{ time: '2024-01-01', cells: [{ low: 0, high: 10, amount: 5 }] }]);

// A custom horizontal scale and user data must survive inference.
type Category = { key: string };
declare const categoryChart: IChartApiBase<Category>;
interface TaggedPoint extends HeatmapData<Category> { tag: string; }
const tagged = createHeatmapSeries<Category, TaggedPoint>(categoryChart);
tagged.setData([{ time: { key: 'A' }, cells: [{ low: 0, high: 1, amount: 1 }], tag: 'first' }]);
expectTrue<Equal<ReturnType<typeof tagged.data>[number], TaggedPoint | CustomSeriesWhitespaceData<Category>>>();
// @ts-expect-error A Time must not leak into a custom horizontal scale.
tagged.update({ time: '2024-01-01', cells: [], tag: 'wrong scale' });
