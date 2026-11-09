// The series reports the bar under the pointer as `hlc-<time index>`, the
// bar's index on the time scale, which is its position in the data here only
// because no other series adds times: on the vertical line from its low to
// its high, and within the hit test tolerance (3px by default) beside it.
// Farther away it reports no object.
async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, { height: 380, crosshair: { mode: LightweightCharts.CrosshairMode.Normal } });
	const series = LwcPlugin.createHLCAreaSeries(chart, { priceLineVisible: false, lastValueVisible: false });
	const time = index => 1704067200 + index * 86400;
	series.setData(Array.from({ length: 9 }, (_, i) => ({ time: time(i), high: 20, low: 10, close: 15 })));
	chart.timeScale().fitContent();
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const ids = new Map();
	chart.subscribeCrosshairMove(event => {
		if (event.point !== undefined) {
			ids.set(Math.round(event.point.x), event.hoveredSeries === series ? event.hoveredObjectId : undefined);
		}
	});
	const canvas = chart.panes()[0].getHTMLElement().querySelector('td[style*="relative"] canvas');
	const box = canvas.getBoundingClientRect();
	const host = container.getBoundingClientRect();
	const on = Math.round(chart.timeScale().timeToCoordinate(time(4)));
	const beside = on + 2;
	const away = on + 12;
	const y = series.priceToCoordinate(12);
	const move = x => ({ action: 'moveMouseXY', target: 'container', options: { x: box.left - host.left + x, y: box.top - host.top + y } });
	window.initialInteractionsToPerform = () => [move(on), move(beside), move(away)];
	window.afterInitialInteractions = () => {
		if (ids.get(on) !== 'hlc-4') { throw new Error(`On the bar: ${ids.get(on)}`); }
		if (ids.get(beside) !== 'hlc-4') { throw new Error(`Beside the bar: ${ids.get(beside)}`); }
		if (!ids.has(away) || ids.get(away) !== undefined) { throw new Error(`Away from the bar: ${ids.get(away)}`); }
	};
}
