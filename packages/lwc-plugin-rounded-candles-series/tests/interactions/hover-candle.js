// The series reports the candle under the pointer as `candle-<index>`, inside
// its body and within the hit test tolerance (3px by default) of its wick,
// and nothing well clear of it.
async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, { height: 380, crosshair: { mode: LightweightCharts.CrosshairMode.Normal } });
	const series = chart.addCustomSeries(new LwcPlugin.RoundedCandleSeries(), { priceLineVisible: false, lastValueVisible: false });
	const time = index => 1704067200 + index * 86400;
	series.setData(Array.from({ length: 9 }, (_, i) => ({ time: time(i), open: 10, high: 18, low: 6, close: 14 })));
	chart.timeScale().fitContent();
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const ids = new Map();
	chart.subscribeCrosshairMove(event => {
		if (event.point !== undefined) {
			ids.set(Math.round(event.point.y), event.hoveredSeries === series ? event.hoveredObjectId : undefined);
		}
	});
	const canvas = chart.panes()[0].getHTMLElement().querySelector('td[style*="relative"] canvas');
	const box = canvas.getBoundingClientRect();
	const host = container.getBoundingClientRect();
	const x = chart.timeScale().timeToCoordinate(time(4));
	const body = Math.round(series.priceToCoordinate(12));
	const nearWick = Math.round(series.priceToCoordinate(18)) - 2;
	const clear = Math.round(series.priceToCoordinate(18)) - 20;
	const move = y => ({ action: 'moveMouseXY', target: 'container', options: { x: box.left - host.left + x, y: box.top - host.top + y } });
	window.initialInteractionsToPerform = () => [move(body), move(nearWick), move(clear)];
	window.afterInitialInteractions = () => {
		if (ids.get(body) !== 'candle-4') { throw new Error(`Body: ${ids.get(body)}`); }
		if (ids.get(nearWick) !== 'candle-4') { throw new Error(`Near the wick: ${ids.get(nearWick)}`); }
		if (!ids.has(clear) || ids.get(clear) !== undefined) { throw new Error(`Clear of the candle: ${ids.get(clear)}`); }
	};
}
