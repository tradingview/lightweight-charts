import { AreaData, AreaSeries, createChart, UTCTimestamp } from 'lightweight-charts';

import { ChartNavigator } from '../chart-navigator';
import '../navigator.css';

const main = createChart('chart', {
	autoSize: true,
	timeScale: { fixLeftEdge: true, fixRightEdge: true, rightOffset: 0, minBarSpacing: 0.01 },
});
const container = document.getElementById('overview');
if (container === null) {
	throw new Error('Missing overview container');
}
const overview = createChart(container, {
	autoSize: true,
	handleScroll: false,
	handleScale: false,
	crosshair: { vertLine: { visible: false, labelVisible: false }, horzLine: { visible: false, labelVisible: false } },
	leftPriceScale: { visible: false },
	rightPriceScale: { visible: false },
	timeScale: { fixLeftEdge: true, fixRightEdge: true, rightOffset: 0, minBarSpacing: 0.01 },
});
// Identical ordered time points let both charts share fractional logical indexes.
const data: AreaData<UTCTimestamp>[] = [];
for (let index = 0; index < 300; index++) {
	data.push({
		time: (Date.UTC(2024, 0, 1) / 1000 + index * 86400) as UTCTimestamp,
		value: 100 + index / 10 + 8 * Math.sin(index / 11) + 3 * Math.cos(index / 3),
	});
}
for (const chart of [main, overview]) {
	chart.addSeries(AreaSeries, { lineColor: '#2962ff', topColor: '#2962ff66', bottomColor: '#2962ff08' }).setData(data);
}
overview.timeScale().fitContent();
main.timeScale().setVisibleLogicalRange({ from: 150, to: 230 });
const navigator = new ChartNavigator(main, overview, container, data.length);

// Dispose the overlay before its charts in a real application's unmount hook.
window.addEventListener('pagehide', (event: PageTransitionEvent) => {
	if (!event.persisted) {
		navigator.remove();
		main.remove();
		overview.remove();
	}
});
