import { createChart, LineSeries, type Time } from 'lightweight-charts';
import { VerticalLine, VertLine } from '@tradingview/lwc-plugin-vertical-line';
import { VerticalLine as Standalone } from '@tradingview/lwc-plugin-vertical-line/standalone';
import { expectTrue, type Equal } from '../../../../tests/plugin-type-checks/assertions.js';

expectTrue<Equal<typeof VerticalLine, typeof Standalone>>();
expectTrue<Equal<typeof VerticalLine, typeof VertLine>>();
const chart = createChart(document.createElement('div'));
const series = chart.addSeries(LineSeries);
const line = new VerticalLine('2024-01-01', { draggable: true, badge: { text: 'Event' } });
series.attachPrimitive(line);
series.attachPrimitive(new VertLine(chart, series, '2024-01-01'));
const alias: VertLine = line;
expectTrue<Equal<typeof alias, VerticalLine>>();
line.applyOptions({ snap: 'nearest', badge: { text: 'Updated', padding: 4 } });
line.timeChanged().subscribe(time => { expectTrue<Equal<typeof time, Time>>(); });
expectTrue<Equal<ReturnType<typeof line.time>, Time>>();
// @ts-expect-error Returned options are read-only.
line.options().draggable = false;
// @ts-expect-error Unsupported snap mode.
line.applyOptions({ snap: 'left' });
// @ts-expect-error A badge requires its text even when other fields are partial.
line.applyOptions({ badge: { padding: 4 } });
// @ts-expect-error Raw numeric timestamps require the UTCTimestamp brand.
new VerticalLine(1704067200);
