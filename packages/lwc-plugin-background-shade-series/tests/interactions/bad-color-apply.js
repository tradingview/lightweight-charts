// An end color the canvas rejects, set through applyOptions after the shade
// was drawn, falls back to the default for that end: the shade keeps
// painting, where the example threw on every paint. The shade is the only
// series, opaque, on a white background.
async function beforeInteractions(container) {
	const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const chart = LightweightCharts.createChart(container, {
		layout: { background: { color: '#ffffff' } },
		grid: { vertLines: { visible: false }, horzLines: { visible: false } },
	});
	const shade = LwcPlugin.createBackgroundShadeSeries(chart, { lowColor: '#00ff00', highColor: '#00ff00', opacity: 1 });
	const times = Array.from({ length: 20 }, (_, i) => 1704067200 + i * 86400);
	shade.setData(times.map(time => ({ time, value: 0 })));
	chart.timeScale().fitContent();
	await frames();
	shade.applyOptions({ lowColor: 'not a color' });
	await frames();
	const canvas = chart.panes()[0].getHTMLElement().querySelector('td[style*="relative"] canvas');
	const ratio = canvas.width / canvas.getBoundingClientRect().width;
	const x = chart.timeScale().timeToCoordinate(times[10]);
	const y = canvas.getBoundingClientRect().height / 2;
	const [r, g, b] = canvas.getContext('2d').getImageData(Math.floor(x * ratio), Math.floor(y * ratio), 1, 1).data;
	// The default low color is rgb(50, 50, 255).
	if (!(b > 200 && r < 90 && g < 90)) {
		throw new Error(`Expected the default low color after the bad one, got rgb(${r}, ${g}, ${b})`);
	}
}
