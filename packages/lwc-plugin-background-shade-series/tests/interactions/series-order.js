// createBackgroundShadeSeries moves the shade behind the series added before
// it: an opaque shade must not cover the line, whose color is read back from
// the canvas where it is drawn.
async function beforeInteractions(container) {
	const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		crosshair: { mode: LightweightCharts.CrosshairMode.Hidden },
	});
	const times = Array.from({ length: 20 }, (_, i) => 1704067200 + i * 86400);
	const line = chart.addSeries(LightweightCharts.LineSeries, {
		color: '#00ff00', lineWidth: 4, priceLineVisible: false, lastValueVisible: false,
	});
	line.setData(times.map(time => ({ time, value: 50 })));
	const shade = LwcPlugin.createBackgroundShadeSeries(chart, { lowColor: '#ff0000', highColor: '#ff0000', opacity: 1 });
	shade.setData(times.map(time => ({ time, value: 50 })));
	chart.timeScale().fitContent();
	await frames();

	if (shade.seriesOrder() !== 0 || line.seriesOrder() !== 1) {
		throw new Error(`Expected the shade first, got orders ${shade.seriesOrder()} and ${line.seriesOrder()}`);
	}
	const canvas = container.querySelector('tr:nth-of-type(1) td:nth-of-type(2) canvas');
	const ratio = canvas.width / canvas.clientWidth;
	const x = chart.timeScale().timeToCoordinate(times[10]);
	const y = line.priceToCoordinate(50);
	const pixel = canvas.getContext('2d').getImageData(Math.round(x * ratio), Math.round(y * ratio), 1, 1).data;
	if (!(pixel[0] < 40 && pixel[1] > 200 && pixel[2] < 40)) {
		throw new Error(`The line is hidden by the shade: pixel is ${Array.from(pixel)}`);
	}
	const above = canvas.getContext('2d').getImageData(Math.round(x * ratio), Math.round((y - 20) * ratio), 1, 1).data;
	if (!(above[0] > 200 && above[1] < 40 && above[2] < 40)) {
		throw new Error(`The shade is not drawn behind the line: pixel is ${Array.from(above)}`);
	}
}
