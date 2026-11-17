// Resolve the built exports map, as an npm consumer does; no src aliases.
import { createChart, LineSeries, LineStyle, type IPriceLine } from 'lightweight-charts';
import { ADD_BUTTON_ID, UserPriceLines, defaultOptions, type UserPriceLinesOptions } from '@tradingview/lwc-plugin-user-price-lines';
import { UserPriceLines as Standalone } from '@tradingview/lwc-plugin-user-price-lines/standalone';
import { expectTrue, type Equal } from '../../../../tests/plugin-type-checks/assertions.js';

expectTrue<Equal<typeof UserPriceLines, typeof Standalone>>();
expectTrue<Equal<typeof defaultOptions, UserPriceLinesOptions>>();
expectTrue<Equal<typeof ADD_BUTTON_ID, 'user-price-lines-add'>>();
expectTrue<Equal<UserPriceLinesOptions['maxLines'], number>>();
expectTrue<Equal<UserPriceLinesOptions['setCrosshairMode'], boolean>>();

const chart = createChart(document.createElement('div'));
const series = chart.addSeries(LineSeries);
const lines = new UserPriceLines({ lineColor: '#F23645', lineStyle: LineStyle.Solid, lineWidth: 2, maxLines: 3 });
series.attachPrimitive(lines);
lines.applyOptions({ setCrosshairMode: false, buttonColor: '', hoverColor: '#777777', axisLabelVisible: false });
expectTrue<Equal<ReturnType<typeof lines.options>, Readonly<UserPriceLinesOptions>>>();
const line: IPriceLine = lines.addLine(100);
expectTrue<Equal<ReturnType<typeof lines.lines>, readonly IPriceLine[]>>();
expectTrue<Equal<ReturnType<typeof lines.removeLine>, boolean>>();
lines.lineAdded().subscribe((added: IPriceLine) => added.applyOptions({ title: 'added' }));
lines.lineRemoved().subscribe((removed: IPriceLine) => void removed.options().price);
lines.removeLine(line);
lines.removeAll();
series.detachPrimitive(lines);

// The plugin-examples form still compiles, marked deprecated.
const legacy = new UserPriceLines(chart, series, { lineColor: 'hotpink' });
legacy.remove();

// @ts-expect-error Unknown options must be rejected.
lines.applyOptions({ nonexistentOption: true });
// @ts-expect-error The plugin-examples options are renamed: color is lineColor.
lines.applyOptions({ color: '#000000' });
// @ts-expect-error The plugin-examples options are renamed: limitToOne is maxLines.
lines.applyOptions({ limitToOne: true });
// @ts-expect-error A line width is 1 to 4.
lines.applyOptions({ lineWidth: 7 });
