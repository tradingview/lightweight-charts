import { createChart, CandlestickSeries, type Time } from 'lightweight-charts';
import {
	SessionHighlighting,
	defaultOptions,
	type SessionHighlighter,
	type SessionHighlightingOptions,
} from '@tradingview/lwc-plugin-session-highlighting';
import { SessionHighlighting as Standalone } from '@tradingview/lwc-plugin-session-highlighting/standalone';
import { expectTrue, type Equal } from '../../../../tests/plugin-type-checks/assertions.js';

expectTrue<Equal<typeof SessionHighlighting, typeof Standalone>>();
expectTrue<Equal<typeof defaultOptions, SessionHighlightingOptions>>();
expectTrue<Equal<SessionHighlighter, (time: Time) => string>>();
const chart = createChart(document.createElement('div'));
const series = chart.addSeries(CandlestickSeries);
const weekends: SessionHighlighter = time => (typeof time === 'number' && new Date(time * 1000).getUTCDay() % 6 === 0 ? 'rgba(255, 152, 1, 0.08)' : '');
// The plugin-examples signature, with and without options.
const highlighting = new SessionHighlighting(weekends);
series.attachPrimitive(new SessionHighlighting(weekends, {}));
series.attachPrimitive(new SessionHighlighting(weekends, { zOrder: 'top', visible: false }));
series.attachPrimitive(highlighting);
highlighting.applyOptions({ visible: true });
highlighting.setHighlighter(() => '');
expectTrue<Equal<ReturnType<SessionHighlighting['options']>, Readonly<SessionHighlightingOptions>>>();
// @ts-expect-error A highlighter is required.
new SessionHighlighting();
// @ts-expect-error The highlighter returns a colour string.
new SessionHighlighting((time: Time) => 1);
// @ts-expect-error Returned options are read-only.
highlighting.options().visible = false;
// @ts-expect-error Unsupported layer.
highlighting.applyOptions({ zOrder: 'above' });
// @ts-expect-error No unknown options.
highlighting.applyOptions({ color: 'red' });
