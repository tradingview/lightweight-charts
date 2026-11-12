// series.update() paints the column it appends at once, and the colors follow
// the range of the amounts in view: a larger amount arriving makes the earlier
// columns' top cells a middle color, and updating that column again with
// smaller amounts makes them the top color again.
async function beforeInteractions(container) {
	const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false, background: { color: '#ffffff' } },
		grid: { vertLines: { visible: false }, horzLines: { visible: false } },
		crosshair: { mode: LightweightCharts.CrosshairMode.Hidden },
		timeScale: { barSpacing: 40, rightOffset: 2 },
	});
	const series = LwcPlugin.createHeatmapSeries(chart, {
		cellShader: LwcPlugin.createColorScale({ stops: ['#0000ff', '#ff0000'] }),
		cellGap: 0,
	});
	const times = Array.from({ length: 9 }, (_, i) => 1704067200 + i * 86400);
	const column = (bottom, top) => [{ low: 0, high: 10, amount: bottom }, { low: 10, high: 20, amount: top }];
	series.setData(times.slice(0, 8).map(time => ({ time, cells: column(0, 100) })));
	chart.timeScale().fitContent();
	await frames();
	const canvas = chart.panes()[0].getHTMLElement().querySelector('td[style*="relative"] canvas');
	const ratio = canvas.width / canvas.getBoundingClientRect().width;
	const read = (x, y) => Array.from(canvas.getContext('2d').getImageData(Math.floor(x * ratio), Math.floor(y * ratio), 1, 1).data.slice(0, 3));
	const color = (index, price) => read(chart.timeScale().timeToCoordinate(times[index]), series.priceToCoordinate(price));
	const isRed = ([r, g, b]) => r > 200 && g < 60 && b < 60;
	const isMiddle = ([r, g, b]) => r > 90 && r < 170 && b > 90 && b < 170 && g < 60;
	if (!isRed(color(4, 15))) {
		throw new Error(`Before the update, the top cell is ${color(4, 15)}, not red`);
	}
	series.update({ time: times[8], cells: column(0, 200) });
	await frames();
	if (!isRed(color(8, 15))) {
		throw new Error(`The appended column's top cell is ${color(8, 15)}, not red`);
	}
	if (!isMiddle(color(4, 15))) {
		throw new Error(`After a larger amount arrived, an earlier top cell is ${color(4, 15)}, not a middle color`);
	}
	series.update({ time: times[8], cells: column(0, 50) });
	await frames();
	if (!isRed(color(4, 15))) {
		throw new Error(`After the update replaced the larger amount, an earlier top cell is ${color(4, 15)}, not red`);
	}
	if (!isMiddle(color(8, 15))) {
		throw new Error(`The updated column's top cell is ${color(8, 15)}, not a middle color`);
	}
}
