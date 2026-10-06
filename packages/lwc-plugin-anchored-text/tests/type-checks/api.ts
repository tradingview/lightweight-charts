import { createChart, LineSeries, type PrimitivePaneViewZOrder } from 'lightweight-charts';
import {
	AnchoredText,
	AnchoredTextPane,
	defaultOptions,
	type AnchoredTextHorzAlign,
	type AnchoredTextInputOptions,
	type AnchoredTextOptions,
} from '@tradingview/lwc-plugin-anchored-text';
import { AnchoredText as Standalone, AnchoredTextPane as StandalonePane } from '@tradingview/lwc-plugin-anchored-text/standalone';
import { expectTrue, type Equal } from '../../../../tests/plugin-type-checks/assertions.js';

expectTrue<Equal<typeof AnchoredText, typeof Standalone>>();
expectTrue<Equal<typeof AnchoredTextPane, typeof StandalonePane>>();
expectTrue<Equal<typeof defaultOptions, AnchoredTextOptions>>();
const chart = createChart(document.createElement('div'));
const series = chart.addSeries(LineSeries);
const text = new AnchoredText();
series.attachPrimitive(text);
chart.panes()[0].attachPrimitive(new AnchoredTextPane({ text: 'Pane', vertAlign: 'bottom' }));
// The options object of the plugin-examples version, 'middle' included, is still accepted.
const legacy = { vertAlign: 'middle', horzAlign: 'middle', text: 'Anchored Text', lineHeight: 54, font: 'italic bold 54px Arial', color: 'red' } as const;
series.attachPrimitive(new AnchoredText(legacy));
chart.panes()[0].attachPrimitive(new AnchoredTextPane(legacy));
text.applyOptions(legacy);
text.applyOptions({ horzAlign: 'center', zOrder: 'bottom', lineHeight: undefined });
text.setText('Changed');
const input: AnchoredTextInputOptions = { horzAlign: 'middle' };
text.applyOptions(input);
// 'middle' never comes back out of the plugin.
expectTrue<Equal<ReturnType<AnchoredText['options']>['horzAlign'], AnchoredTextHorzAlign>>();
expectTrue<Equal<AnchoredTextHorzAlign, 'left' | 'center' | 'right'>>();
expectTrue<Equal<ReturnType<AnchoredTextPane['options']>['zOrder'], PrimitivePaneViewZOrder>>();
// @ts-expect-error Returned options are read-only.
text.options().text = 'Mutated';
// @ts-expect-error Unsupported alignment spelling.
text.applyOptions({ horzAlign: 'centre' });
// @ts-expect-error Unsupported layer.
text.applyOptions({ zOrder: 'above' });
// @ts-expect-error The (chart, series, options) form used by an old inline copy is not supported.
new AnchoredText(chart, series, { text: 'Title' });
// @ts-expect-error Text is a string.
text.setText(42);
