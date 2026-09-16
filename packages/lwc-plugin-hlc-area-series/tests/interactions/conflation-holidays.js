// Holidays scattered through conflated data must not erase the area, while a
// run wider than one conflation bucket must still leave a hole.
async function beforeInteractions(container) {
	const time = index => 1704067200 + index * 86400;
	const chart = LightweightCharts.createChart(container, {
		height: 380,
		grid: { vertLines: { visible: false }, horzLines: { visible: false } },
		timeScale: { enableConflation: true, minBarSpacing: 0.01, barSpacing: 0.05 },
	});
	const series = LwcPlugin.createHLCAreaSeries(chart, {
		priceLineVisible: false, lastValueVisible: false,
		highAreaColor: '#00a000', lowAreaColor: '#00a000',
	});
	const build = hole => Array.from({ length: 6000 }, (_unused, i) =>
		i % 7 === 6 || (hole !== null && i >= hole && i < hole + 512)
			? { time: time(i) }
			: { time: time(i), high: 30, low: 10, close: 20 });
	series.setData(build(null));
	chart.timeScale().fitContent();
	const frames = async () => { for (let i = 0; i < 6; i++) { await new Promise(requestAnimationFrame); } };

	const sample = () => {
		const canvas = chart.panes()[0].getHTMLElement().querySelector('td[style*="relative"] canvas');
		const ratio = canvas.width / canvas.getBoundingClientRect().width;
		const y = Math.floor(series.priceToCoordinate(25) * ratio);
		const row = canvas.getContext('2d').getImageData(0, y, canvas.width, 1).data;
		let painted = 0;
		let longestHole = 0;
		let hole = 0;
		for (let x = 0; x < canvas.width; x++) {
			const [r, g, b] = row.slice(x * 4, x * 4 + 3);
			if (Math.max(r, g, b) - Math.min(r, g, b) > 20) {
				painted++;
				hole = 0;
			} else {
				hole++;
				longestHole = Math.max(longestHole, hole);
			}
		}
		return { painted, longestHole, width: canvas.width };
	};

	await frames();
	const dense = sample();
	if (dense.painted < dense.width * 0.5) {
		throw new Error(`Sparse whitespace erased the conflated area: ${dense.painted} of ${dense.width} columns painted`);
	}

	series.setData(build(3000));
	chart.timeScale().fitContent();
	await frames();
	const gapped = sample();
	if (gapped.longestHole < 20) {
		throw new Error(`A 512-point whitespace run did not leave a hole: longest run ${gapped.longestHole} columns`);
	}
	if (gapped.painted < gapped.width * 0.3) {
		throw new Error('The whitespace run erased more than its own span');
	}
}
