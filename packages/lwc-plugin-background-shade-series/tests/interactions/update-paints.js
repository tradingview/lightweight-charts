// series.update() shades the bar it appends at once, and a later update of
// that bar repaints it in its new shade. The shade is the only series, opaque,
// on a white background, so the pixel read back is its fill.
async function beforeInteractions(container) {
	const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const chart = LightweightCharts.createChart(container, {
		layout: { background: { color: '#ffffff' } },
		grid: { vertLines: { visible: false }, horzLines: { visible: false } },
		timeScale: { rightOffset: 5 },
	});
	const shade = LwcPlugin.createBackgroundShadeSeries(chart, { lowColor: '#0000ff', highColor: '#ff0000', opacity: 1 });
	const times = Array.from({ length: 11 }, (_, i) => 1704067200 + i * 86400);
	shade.setData(times.slice(0, 10).map(time => ({ time, value: 0 })));
	await frames();
	const canvas = chart.panes()[0].getHTMLElement().querySelector('td[style*="relative"] canvas');
	const ratio = canvas.width / canvas.getBoundingClientRect().width;
	const sample = time => {
		const x = chart.timeScale().timeToCoordinate(time);
		const y = canvas.getBoundingClientRect().height / 2;
		return Array.from(canvas.getContext('2d').getImageData(Math.floor(x * ratio), Math.floor(y * ratio), 1, 1).data.slice(0, 3));
	};
	shade.update({ time: times[10], value: 100 });
	await frames();
	const [r1, g1, b1] = sample(times[10]);
	if (!(r1 > 200 && g1 < 60 && b1 < 60)) {
		throw new Error(`The appended bar is not shaded red: rgb(${r1}, ${g1}, ${b1})`);
	}
	shade.update({ time: times[10], value: 0 });
	await frames();
	const [r2, g2, b2] = sample(times[10]);
	if (!(b2 > 200 && r2 < 60 && g2 < 60)) {
		throw new Error(`The updated bar is not repainted blue: rgb(${r2}, ${g2}, ${b2})`);
	}
}
