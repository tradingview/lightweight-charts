// A point's own color shades its bar through the chart, which hands it to the
// renderer as the bar color rather than in the point's data; a color the
// canvas does not accept leaves that bar shaded from its value. The shade is
// the only series, opaque, on a white background, so the pixel read back is
// its fill.
async function beforeInteractions(container) {
	const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const chart = LightweightCharts.createChart(container, {
		layout: { background: { color: '#ffffff' } },
		grid: { vertLines: { visible: false }, horzLines: { visible: false } },
	});
	const shade = LwcPlugin.createBackgroundShadeSeries(chart, { lowColor: '#0000ff', highColor: '#ff0000', opacity: 1 });
	const times = Array.from({ length: 12 }, (_, i) => 1704067200 + i * 86400);
	shade.setData(times.map((time, i) => ({ time, value: 100, color: i === 5 ? '#00ff00' : i === 7 ? 'not-a-color' : undefined })));
	chart.timeScale().fitContent();
	await frames();
	const canvas = chart.panes()[0].getHTMLElement().querySelector('td[style*="relative"] canvas');
	const ratio = canvas.width / canvas.getBoundingClientRect().width;
	const sample = time => {
		const x = chart.timeScale().timeToCoordinate(time);
		const y = canvas.getBoundingClientRect().height / 2;
		return Array.from(canvas.getContext('2d').getImageData(Math.floor(x * ratio), Math.floor(y * ratio), 1, 1).data.slice(0, 3));
	};
	const [r1, g1, b1] = sample(times[5]);
	if (!(g1 > 200 && r1 < 60 && b1 < 60)) {
		throw new Error(`The bar with its own color is not green: rgb(${r1}, ${g1}, ${b1})`);
	}
	const [r2, g2, b2] = sample(times[7]);
	if (!(r2 > 200 && g2 < 60 && b2 < 60)) {
		throw new Error(`The bar with an invalid color is not shaded from its value: rgb(${r2}, ${g2}, ${b2})`);
	}
}
