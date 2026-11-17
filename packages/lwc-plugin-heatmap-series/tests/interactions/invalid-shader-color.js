// A cell whose shader output the canvas cannot parse is not drawn. The canvas
// ignores such a fill and keeps the one before it, so drawing the cell anyway
// would paint it in the color of the cell drawn before it.
async function beforeInteractions(container) {
	const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false, background: { color: '#ffffff' } },
		grid: { vertLines: { visible: false }, horzLines: { visible: false } },
		crosshair: { mode: LightweightCharts.CrosshairMode.Hidden },
		timeScale: { barSpacing: 40, rightOffset: 2 },
	});
	const series = LwcPlugin.createHeatmapSeries(chart, {
		cellShader: amount => (amount > 50 ? 'not-a-color' : '#ff0000'),
		cellGap: 0,
	});
	const times = Array.from({ length: 8 }, (_, i) => 1704067200 + i * 86400);
	series.setData(times.map(time => ({ time, cells: [{ low: 0, high: 10, amount: 10 }, { low: 10, high: 20, amount: 90 }] })));
	chart.timeScale().fitContent();
	await frames();
	const canvas = chart.panes()[0].getHTMLElement().querySelector('td[style*="relative"] canvas');
	const ratio = canvas.width / canvas.getBoundingClientRect().width;
	const read = (x, y) => Array.from(canvas.getContext('2d').getImageData(Math.floor(x * ratio), Math.floor(y * ratio), 1, 1).data.slice(0, 3));
	const x = chart.timeScale().timeToCoordinate(times[4]);
	const drawn = read(x, series.priceToCoordinate(5));
	if (!(drawn[0] > 200 && drawn[1] < 60 && drawn[2] < 60)) {
		throw new Error(`The cell with a valid color is ${drawn}, not red`);
	}
	const skipped = read(x, series.priceToCoordinate(15));
	if (!(skipped[0] > 240 && skipped[1] > 240 && skipped[2] > 240)) {
		throw new Error(`The cell with an invalid color is ${skipped}, not left out`);
	}
}
