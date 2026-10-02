import { createChart, type IChartApiBase } from 'lightweight-charts';
import { addAccessibilityPlugin, AccessibilityPlugin, type AnySeries, type SeriesDataPoint } from '@tradingview/lwc-plugin-accessibility';
import { addAccessibilityPlugin as Standalone } from '@tradingview/lwc-plugin-accessibility/standalone';
import { expectTrue, type Equal } from '../../../../tests/plugin-type-checks/assertions.js';

expectTrue<Equal<typeof addAccessibilityPlugin, typeof Standalone>>();
const chart = createChart(document.createElement('div'));
const controller = addAccessibilityPlugin(chart, {
	dataScope: 'all',
	dataUpdates: { mode: 'all', debounceMs: 10 },
	onFocusChange: event => {
		expectTrue<Equal<typeof event.value, number | undefined>>();
		expectTrue<Equal<typeof event.point, SeriesDataPoint | undefined>>();
		expectTrue<Equal<typeof event.series, AnySeries | null>>();
	},
	valueAccessor: (point, series) => {
		expectTrue<Equal<typeof point, SeriesDataPoint>>();
		expectTrue<Equal<typeof series, AnySeries | null>>();
		return 'value' in point ? point.value : undefined;
	},
	messages: { seriesUpdate: args => {
		expectTrue<Equal<typeof args.count, number>>();
		return `${args.count} points`;
	} },
});
expectTrue<Equal<typeof controller.plugins, readonly AccessibilityPlugin[]>>();
controller.applyOptions({ dataUpdates: { mode: 'none' } });
controller.focus(0);
controller.detach();
chart.panes()[0].attachPrimitive(new AccessibilityPlugin());
// @ts-expect-error The controller owns its list of pane plugins.
controller.plugins.push(new AccessibilityPlugin());
// @ts-expect-error Accessors must produce numeric values.
addAccessibilityPlugin(chart, { valueAccessor: () => 'ten' });
// @ts-expect-error Unsupported announcement mode.
controller.applyOptions({ dataUpdates: { mode: 'always' } });
declare const categoryChart: IChartApiBase<{ key: string }>;
// @ts-expect-error Accessibility formatting is explicitly Time-based.
addAccessibilityPlugin(categoryChart);
