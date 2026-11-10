// A border color is painted only in the frame around each cell: a translucent
// cell shows the white background through it, not the black border color.
async function beforeInteractions(container) {
	const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false, background: { color: '#ffffff' } },
		grid: { vertLines: { visible: false }, horzLines: { visible: false } },
		crosshair: { mode: LightweightCharts.CrosshairMode.Hidden },
		timeScale: { barSpacing: 40, rightOffset: 2 },
	});
	const series = LwcPlugin.createHeatmapSeries(chart, {
		cellShader: () => 'rgba(255, 0, 0, 0.5)',
		cellGap: 0,
		cellBorderWidth: 2,
		cellBorderColor: '#000000',
	});
	const times = Array.from({ length: 8 }, (_, i) => 1704067200 + i * 86400);
	series.setData(times.map(time => ({ time, cells: [{ low: 0, high: 10, amount: 1 }, { low: 10, high: 20, amount: 1 }] })));
	chart.timeScale().fitContent();
	await frames();
	const canvas = chart.panes()[0].getHTMLElement().querySelector('td[style*="relative"] canvas');
	const ratio = canvas.width / canvas.getBoundingClientRect().width;
	const read = (x, y) => Array.from(canvas.getContext('2d').getImageData(Math.floor(x * ratio), Math.floor(y * ratio), 1, 1).data.slice(0, 3));
	const x = chart.timeScale().timeToCoordinate(times[4]);
	const inside = read(x, series.priceToCoordinate(5));
	// Half red over white is about (255, 128, 128); over the black border color
	// it would be about (128, 0, 0).
	if (!(inside[0] > 230 && inside[1] > 100 && inside[2] > 100)) {
		throw new Error(`The inside of a translucent cell is ${inside}, not red over the background`);
	}
	const edge = read(x, series.priceToCoordinate(10));
	if (!(edge[0] < 60 && edge[1] < 60 && edge[2] < 60)) {
		throw new Error(`The border between two cells is ${edge}, not the border color`);
	}
}
