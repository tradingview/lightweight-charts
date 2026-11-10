// The shade paints when it is the only series on its price scale, and the only
// series in the chart: its values are kept out of the price scale, so its own
// scale has nothing to autoscale, and the pane must still draw it.
async function beforeInteractions(container) {
	const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const chart = LightweightCharts.createChart(container, {
		layout: { background: { color: '#ffffff' } },
		grid: { vertLines: { visible: false }, horzLines: { visible: false } },
	});
	const shade = LwcPlugin.createBackgroundShadeSeries(chart, { lowColor: '#ff0000', highColor: '#ff0000', opacity: 1 });
	const times = Array.from({ length: 20 }, (_, i) => 1704067200 + i * 86400);
	shade.setData(times.map((time, i) => ({ time, value: i })));
	chart.timeScale().fitContent();
	await frames();
	const canvas = chart.panes()[0].getHTMLElement().querySelector('td[style*="relative"] canvas');
	const ratio = canvas.width / canvas.getBoundingClientRect().width;
	const x = chart.timeScale().timeToCoordinate(times[10]);
	const y = canvas.getBoundingClientRect().height / 2;
	const [r, g, b] = canvas.getContext('2d').getImageData(Math.floor(x * ratio), Math.floor(y * ratio), 1, 1).data;
	if (!(r > 200 && g < 60 && b < 60)) {
		throw new Error(`Expected the shade at the 11th bar, got rgb(${r}, ${g}, ${b})`);
	}
}
